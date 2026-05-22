const { GoogleGenAI } = require('@google/generative-ai');

const isMock = process.env.GEMINI_SERVICE_MOCK === 'true';
const apiKey = process.env.GEMINI_API_KEY;

let ai;
if (!isMock && apiKey) {
  // Try initializing standard Gemini SDK
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    ai = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('Error initializing Google Generative AI:', err.message);
  }
}

/**
 * Analyzes a commit using Gemini AI.
 * @param {Object} commit - The Commit model object
 * @param {Array<Object>} files - Array of CommitFile objects
 * @returns {Promise<Object>} The analysis result structure
 */
async function analyzeCommit(commit, files) {
  const fileSummaries = files.map(f => `File: ${f.filename}\nStatus: ${f.status}\nAdditions: ${f.additions}, Deletions: ${f.deletions}\nDiff:\n${f.patch}`).join('\n\n');
  
  const prompt = `
    You are an expert AI code reviewer. Analyze the following GitHub commit files and patch changes.
    Commit Author: ${commit.authorName} (@${commit.authorGithubUsername})
    Commit Message: ${commit.message}
    
    Files changed:
    ${fileSummaries}
    
    Please provide an analysis in JSON format with the following keys:
    {
      "summary": "Brief summary of the changes",
      "impact": "Low|Medium|High classification of code impact",
      "qualityScore": 1 to 10 rating of the code quality,
      "constructiveFeedback": "Actionable feedback for the coder",
      "contributions": {
        "features": ["Feature A details"],
        "bugfixes": ["Bug fix details"],
        "refactoring": ["Refactoring details"]
      },
      "codeStyleMatchesRubric": true|false,
      "securityIssues": ["Any security issues found, or empty list"]
    }
    Return ONLY the valid JSON block without markdown formatting or code blocks.
  `;

  if (isMock || !ai) {
    console.log(`[GEMINI MOCK] Analyzing commit: ${commit.commitSha.substring(0, 7)} by ${commit.authorName}`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate AI processing time

    // Return realistic generated analysis based on commit message
    let quality = 8;
    let feedback = "Excellent work on setting up standard structural pages. Variable naming is clean and conforms to standard React conventions.";
    let features = ["Set up login structure and basic forms"];
    let bugfixes = [];
    let styleMatches = true;

    if (commit.message.includes('feat: Add authentication')) {
      quality = 7;
      feedback = "Good integration of Axios client. Please ensure that error codes from the backend are explicitly handled in the UI and show clean feedback to the user rather than logging raw errors.";
      features = ["Added authentication input fields", "Integrated axios api request login handler"];
    } else if (commit.message.includes('style: Redesign')) {
      quality = 9;
      feedback = "Beautiful gradient selections. Moving to TailwindCSS v4 has reduced CSS footprint.";
      features = ["Applied Tailwind CSS v4 linear gradients", "Configured dark mode styling"];
    }

    return {
      summary: `AI review of commit: ${commit.message}`,
      impact: commit.changedFilesCount > 2 ? 'Medium' : 'Low',
      qualityScore: quality,
      constructiveFeedback: feedback,
      contributions: {
        features,
        bugfixes,
        refactoring: commit.message.toLowerCase().includes('refactor') ? [commit.message] : []
      },
      codeStyleMatchesRubric: styleMatches,
      securityIssues: commit.message.includes('password') ? ["Be careful not to expose plain-text passwords or store tokens in insecure local storage without CSRF protection."] : []
    };
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().trim();
    
    // Parse JSON safely (sometimes AI wraps in ```json ... ```)
    const cleanedText = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error generating content with Gemini:', error.message);
    return {
      summary: 'Fallback AI Commit Review: Analysis failed due to service limits or invalid API Key.',
      impact: 'Unknown',
      qualityScore: 5,
      constructiveFeedback: 'Please check your GEMINI_API_KEY environment variable configuration.',
      contributions: { features: ['Unable to analyze'], bugfixes: [], refactoring: [] },
      codeStyleMatchesRubric: true,
      securityIssues: []
    };
  }
}

/**
 * Suggests grades for a team's submission snapshot against a list of Rubric criteria.
 * @param {Object} repositorySnapshot - Repository snapshot details
 * @param {Array<Object>} commits - List of commits in this round
 * @param {Array<Object>} criteria - Rubric criteria
 * @returns {Promise<Object>} Suggestion object mapping criterion code/ID to scoring details
 */
async function generateScoringSuggestion(repositorySnapshot, commits, criteria) {
  const commitListSummary = commits.map(c => `Author: ${c.authorName}, Msg: ${c.message}, Added: ${c.additions}, Deleted: ${c.deletions}`).join('\n');
  const criteriaSummary = criteria.map(cr => `Code: ${cr.code}, Name: ${cr.name}, Max Score: ${cr.maxScore}, Weight: ${cr.weight}%, Desc: ${cr.description}`).join('\n');

  const prompt = `
    You are an automated grading assistant for the SEAL Hackathon. Suggest scores for a project team based on their code commits and submission details.
    
    Commits list:
    ${commitListSummary}
    
    Grading Rubric Criteria:
    ${criteriaSummary}
    
    Please suggest a score (0 to Max Score) for each criterion code with a short evaluation comment.
    Format your response as a JSON array of objects like:
    [
      {
        "criterionCode": "CODE_HERE",
        "suggestedScore": 8.5,
        "comment": "Short reason for this score"
      }
    ]
    Return ONLY valid JSON array.
  `;

  if (isMock || !ai) {
    console.log(`[GEMINI MOCK] Generating grading suggestion for team snapshot: ${repositorySnapshot.commitSha.substring(0, 7)}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return criteria.map(c => {
      // Logic-based suggestion simulation
      let suggestion = c.maxScore * 0.8; // Default to 80%
      let comment = `Team demonstrated steady work progress with commits addressing this criterion. Code structure is robust.`;
      
      if (c.code.toLowerCase().includes('git') || c.code.toLowerCase().includes('version')) {
        suggestion = c.maxScore * 0.9;
        comment = `Excellent commit frequency. Distinct commits for styling, logic, and scaffolding demonstrate healthy team coordination.`;
      }
      
      return {
        criterionCode: c.code,
        suggestedScore: Math.round(suggestion * 10) / 10,
        comment
      };
    });
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().trim();
    const cleanedText = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error fetching scoring suggestion from Gemini:', error.message);
    return criteria.map(c => ({
      criterionCode: c.code,
      suggestedScore: c.maxScore * 0.7,
      comment: 'Default automated suggestion due to AI service unavailability.'
    }));
  }
}

module.exports = {
  analyzeCommit,
  generateScoringSuggestion
};
