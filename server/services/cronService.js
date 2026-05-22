const cron = require('node-cron');
const mongoose = require('mongoose');
const githubService = require('./githubService');
const aiService = require('./aiService');

// Retrieve models dynamically to avoid import circular issues
const GithubRepository = mongoose.model('GithubRepository');
const Commit = mongoose.model('Commit');
const CommitFile = mongoose.model('CommitFile');
const AiAnalysis = mongoose.model('AiAnalysis');
const Team = mongoose.model('Team');

/**
 * Initializes cron jobs for the system
 */
function startCronJobs() {
  console.log('[CRON] Initializing background task schedulers...');
  
  // Schedule to run every 30 minutes: '*/30 * * * *'
  // For development testing, we can run it every 10 minutes or check standard:
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running scheduled 30-minute GitHub commit sync...');
    try {
      await syncAllRepositories();
    } catch (error) {
      console.error('[CRON ERROR] Failed to sync commits:', error.message);
    }
  });

  console.log('[CRON] Background task scheduler started. Repo sync scheduled for every 30 minutes.');
}

/**
 * Syncs all active repositories in the database
 */
async function syncAllRepositories() {
  const activeRepos = await GithubRepository.find({ isArchived: false });
  console.log(`[CRON] Syncing ${activeRepos.length} repository/repositories...`);
  
  for (const repo of activeRepos) {
    try {
      await syncRepo(repo._id);
    } catch (err) {
      console.error(`[CRON ERROR] Failed syncing repo ID ${repo._id}:`, err.message);
    }
  }
}

/**
 * Syncs a single repository by its DB Object ID
 * @param {string|ObjectId} repoId - MongoDB ObjectID of GithubRepository
 * @returns {Promise<boolean>}
 */
async function syncRepo(repoId) {
  const repo = await GithubRepository.findById(repoId);
  if (!repo) {
    throw new Error('Repository not found in database');
  }

  console.log(`[SYNC] Started sync for repo: ${repo.repoName}`);
  repo.syncStatus = 'syncing';
  await repo.save();

  try {
    // Determine the date to pull commits since
    const sinceDate = repo.lastSyncedAt || null;
    
    // Fetch commits from github
    const newCommits = await githubService.fetchCommits(repo.repoName, sinceDate);
    console.log(`[SYNC] Found ${newCommits.length} new commits since last sync.`);

    let latestSha = repo.lastCommitSha;

    for (const rawCommit of newCommits) {
      // Check if commit already exists (prevent duplicate errors)
      let commitRecord = await Commit.findOne({ repositoryId: repo._id, commitSha: rawCommit.sha });
      
      if (!commitRecord) {
        // Create Commit record
        commitRecord = new Commit({
          repositoryId: repo._id,
          teamId: repo.teamId,
          commitSha: rawCommit.sha,
          branch: repo.defaultBranch,
          authorGithubUsername: rawCommit.authorUsername,
          authorName: rawCommit.authorName,
          authorEmail: rawCommit.authorEmail,
          message: rawCommit.message,
          commitUrl: rawCommit.commitUrl || '',
          additions: rawCommit.additions,
          deletions: rawCommit.deletions,
          changedFilesCount: rawCommit.changedFilesCount,
          committedAt: rawCommit.committedAt,
          pulledAt: new Date(),
          diffFetched: true
        });
        await commitRecord.save();

        // Fetch and create CommitFile records
        const commitFiles = await githubService.fetchCommitFiles(repo.repoName, rawCommit.sha);
        const savedFiles = [];

        for (const file of commitFiles) {
          const fileRecord = new CommitFile({
            commitId: commitRecord._id,
            repositoryId: repo._id,
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            patch: file.patch,
            rawUrl: file.rawUrl || '',
            blobUrl: file.blobUrl || ''
          });
          await fileRecord.save();
          savedFiles.push(fileRecord);
        }

        // Call Gemini to analyze the commit
        try {
          const aiResult = await aiService.analyzeCommit(commitRecord, savedFiles);
          
          const aiAnalysis = new AiAnalysis({
            repositoryId: repo._id,
            teamId: repo.teamId,
            commitId: commitRecord._id,
            analysisType: 'commit_review',
            provider: 'Google Gemini',
            model: 'gemini-2.5-flash',
            result: aiResult,
            status: 'completed',
            completedAt: new Date()
          });
          await aiAnalysis.save();

          // Save a summary of the AI results back to the commit record
          commitRecord.diffSummary = aiResult.summary;
          await commitRecord.save();

        } catch (aiErr) {
          console.error(`[SYNC] Gemini AI review failed for commit ${rawCommit.sha}:`, aiErr.message);
          
          const aiAnalysisFailed = new AiAnalysis({
            repositoryId: repo._id,
            teamId: repo.teamId,
            commitId: commitRecord._id,
            analysisType: 'commit_review',
            status: 'failed',
            errorMessage: aiErr.message
          });
          await aiAnalysisFailed.save();
        }
      }

      // Track the latest commit SHA
      if (!latestSha || rawCommit.committedAt > (repo.lastSyncedAt || new Date(0))) {
        latestSha = rawCommit.sha;
      }
    }

    // Update repository record status
    repo.syncStatus = 'success';
    repo.lastSyncedAt = new Date();
    if (latestSha) {
      repo.lastCommitSha = latestSha;
    }
    repo.syncErrorMessage = null;
    await repo.save();
    console.log(`[SYNC] Completed sync successfully for: ${repo.repoName}`);
    return true;

  } catch (error) {
    console.error(`[SYNC ERROR] Failed to sync repo ${repo.repoName}:`, error.message);
    repo.syncStatus = 'failed';
    repo.syncErrorMessage = error.message;
    await repo.save();
    return false;
  }
}

module.exports = {
  startCronJobs,
  syncRepo,
  syncAllRepositories
};
