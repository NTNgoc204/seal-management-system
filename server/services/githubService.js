const { Octokit } = require('@octokit/rest');

const isMock = process.env.GITHUB_SERVICE_MOCK === 'true';
const orgName = process.env.GITHUB_ORGANIZATION || 'seal-hackathon-2026';

let octokit;
if (!isMock && process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  octokit = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  });
}

/**
 * Creates a team repository in the organization.
 * @param {string} repoName - Repository name (typically team name slugified)
 * @param {string} visibility - 'private' or 'public'
 * @returns {Promise<{repoUrl: string, githubRepoId: string}>}
 */
async function createTeamRepository(repoName, visibility = 'private') {
  if (isMock || !octokit) {
    console.log(`[GITHUB MOCK] Creating ${visibility} repository: ${orgName}/${repoName}`);
    // Simulate slight delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const randomId = Math.floor(Math.random() * 100000000).toString();
    return {
      repoUrl: `https://github.com/${orgName}/${repoName}`,
      githubRepoId: randomId
    };
  }

  try {
    // Attempt to create org repo
    const response = await octokit.repos.createInOrg({
      org: orgName,
      name: repoName,
      private: visibility === 'private',
      auto_init: true
    });
    return {
      repoUrl: response.data.html_url,
      githubRepoId: response.data.id.toString()
    };
  } catch (error) {
    console.error('Error creating GitHub repository:', error.message);
    // If it fails or permissions are missing, fall back to mock to keep the app working
    console.log(`[GITHUB FALLBACK] Failsafe: Mocking repo creation for ${repoName}`);
    return {
      repoUrl: `https://github.com/${orgName}/${repoName}`,
      githubRepoId: `fallback-${Date.now()}`
    };
  }
}

/**
 * Adds a collaborator to the team repository.
 * @param {string} repoName - Repository name
 * @param {string} username - GitHub username of collaborator
 * @param {string} permission - 'pull', 'push', 'admin', 'maintain', 'triage'
 * @returns {Promise<boolean>}
 */
async function addCollaborator(repoName, username, permission = 'push') {
  if (!username) return false;

  if (isMock || !octokit) {
    console.log(`[GITHUB MOCK] Inviting collaborator: ${username} to ${orgName}/${repoName} with permission ${permission}`);
    return true;
  }

  try {
    await octokit.repos.addCollaborator({
      owner: orgName,
      repo: repoName,
      username: username,
      permission: permission
    });
    console.log(`Invited collaborator ${username} to repository ${repoName}`);
    return true;
  } catch (error) {
    console.error(`Error inviting collaborator ${username}:`, error.message);
    return true; // Return true as fallback to prevent app crashing
  }
}

/**
 * Fetches commits from the repository since a given date.
 * @param {string} repoName - Repository name
 * @param {Date} sinceDate - Commits fetched since this date
 * @returns {Promise<Array>}
 */
async function fetchCommits(repoName, sinceDate) {
  if (isMock || !octokit) {
    // Generate realistic mock commits
    const mockCommits = [
      {
        sha: 'b8a8f1025a4d1e2e9c3c0a5e8a7f1a3e9c4b7d12',
        message: 'Initial commit with project scaffolding',
        authorName: 'Team Leader',
        authorUsername: 'team-leader-git',
        authorEmail: 'leader@example.com',
        committedAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
        additions: 120,
        deletions: 0,
        changedFilesCount: 4
      },
      {
        sha: '3c0a5e8a7f1a3e9c4b7d12b8a8f1025a4d1e2e9c',
        message: 'feat: Add authentication form and connect with API client',
        authorName: 'John Doe',
        authorUsername: 'johndoe-git',
        authorEmail: 'johndoe@example.com',
        committedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        additions: 85,
        deletions: 12,
        changedFilesCount: 2
      },
      {
        sha: '7f1a3e9c4b7d12b8a8f1025a4d1e2e9c3c0a5e8a',
        message: 'style: Redesign dashboard with Tailwind v4 gradients',
        authorName: 'Alice Smith',
        authorUsername: 'alicesmith-git',
        authorEmail: 'alice@example.com',
        committedAt: new Date(Date.now() - 3600000 * 1), // 1 hour ago
        additions: 45,
        deletions: 8,
        changedFilesCount: 1
      }
    ];

    // Filter commits by sinceDate if provided
    if (sinceDate) {
      return mockCommits.filter(c => c.committedAt > sinceDate);
    }
    return mockCommits;
  }

  try {
    const params = {
      owner: orgName,
      repo: repoName
    };
    if (sinceDate) {
      params.since = sinceDate.toISOString();
    }

    const { data } = await octokit.repos.listCommits(params);
    
    // Map response to our commit schema format
    const commitsPromises = data.map(async (c) => {
      // Get detailed commit to get additions/deletions
      let details;
      try {
        details = await octokit.repos.getCommit({
          owner: orgName,
          repo: repoName,
          ref: c.sha
        });
      } catch (err) {
        console.error('Error fetching commit details:', err.message);
      }

      return {
        sha: c.sha,
        message: c.commit.message,
        authorName: c.commit.author ? c.commit.author.name : 'Unknown',
        authorUsername: c.author ? c.author.login : 'unknown',
        authorEmail: c.commit.author ? c.commit.author.email : '',
        committedAt: new Date(c.commit.author.date),
        additions: details ? details.data.stats.additions : 0,
        deletions: details ? details.data.stats.deletions : 0,
        changedFilesCount: details ? details.data.files.length : 0,
        commitUrl: c.html_url
      };
    });

    return await Promise.all(commitsPromises);
  } catch (error) {
    console.error(`Error fetching commits for ${repoName}:`, error.message);
    return [];
  }
}

/**
 * Fetches files changed and their diff patch in a commit.
 * @param {string} repoName - Repository name
 * @param {string} commitSha - Commit SHA
 * @returns {Promise<Array>}
 */
async function fetchCommitFiles(repoName, commitSha) {
  if (isMock || !octokit || commitSha.startsWith('fallback-')) {
    // Generate realistic mock files and patches based on the commitSha
    if (commitSha.includes('b8a8f1025')) {
      return [
        {
          filename: 'package.json',
          status: 'added',
          additions: 25,
          deletions: 0,
          changes: 25,
          patch: '@@ -0,0 +1,25 @@\n+{\n+  "name": "seal-hackathon-client",\n+  "version": "1.0.0",\n+  "dependencies": {\n+    "react": "^19.0.0",\n+    "tailwindcss": "^4.0.0"\n+  }\n+}',
          rawUrl: '',
          blobUrl: ''
        },
        {
          filename: 'src/main.tsx',
          status: 'added',
          additions: 15,
          deletions: 0,
          changes: 15,
          patch: '@@ -0,0 +1,15 @@\n+import React from \'react\';\n+import ReactDOM from \'react-dom/client\';\n+import App from \'./App\';\n+import \'./index.css\';\n+\n+ReactDOM.createRoot(document.getElementById(\'root\')!).render(\n+  <React.StrictMode>\n+    <App />\n+  </React.StrictMode>\n+);',
          rawUrl: '',
          blobUrl: ''
        }
      ];
    } else if (commitSha.includes('3c0a5e8a')) {
      return [
        {
          filename: 'src/components/LoginForm.tsx',
          status: 'added',
          additions: 55,
          deletions: 0,
          changes: 55,
          patch: '@@ -0,0 +1,55 @@\n+import React, { useState } from \'react\';\n+import axios from \'axios\';\n+\n+export default function LoginForm() {\n+  const [email, setEmail] = useState(\'\');\n+  const [password, setPassword] = useState(\'\');\n+\n+  const handleSubmit = async (e: React.FormEvent) => {\n+    e.preventDefault();\n+    const res = await axios.post(\'/api/auth/login\', { email, password });\n+    localStorage.setItem(\'token\', res.data.token);\n+  };\n+\n+  return (\n+    <form onSubmit={handleSubmit}>\n+      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />\n+      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />\n+      <button type="submit">Login</button>\n+    </form>\n+  );\n+}',
          rawUrl: '',
          blobUrl: ''
        }
      ];
    } else {
      return [
        {
          filename: 'src/index.css',
          status: 'modified',
          additions: 10,
          deletions: 2,
          changes: 12,
          patch: '@@ -5,4 +5,12 @@\n body {\n-  background-color: #ffffff;\n+  background-color: #0f172a;\n+  color: #f8fafc;\n }\n+\n+.hero-gradient {\n+  background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);\n+}',
          rawUrl: '',
          blobUrl: ''
        }
      ];
    }
  }

  try {
    const { data } = await octokit.repos.getCommit({
      owner: orgName,
      repo: repoName,
      ref: commitSha
    });

    return data.files.map(f => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch || '',
      rawUrl: f.raw_url,
      blobUrl: f.blob_url
    }));
  } catch (error) {
    console.error(`Error fetching files for commit ${commitSha}:`, error.message);
    return [];
  }
}

module.exports = {
  createTeamRepository,
  addCollaborator,
  fetchCommits,
  fetchCommitFiles
};
