const { extractKeywords } = require('./keywordExtractor');

// Keyword categories for grouped suggestions
const CATEGORIES = {
  'Cloud & DevOps': ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'devops', 'helm'],
  'Languages': ['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'scala'],
  'Frontend': ['react', 'angular', 'vue', 'next.js', 'nuxt', 'html', 'css', 'sass', 'webpack', 'vite', 'redux', 'graphql'],
  'Backend & APIs': ['node.js', 'express', 'django', 'flask', 'spring', 'rest', 'microservices', 'api'],
  'Databases': ['mongodb', 'postgres', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'sql'],
  'AI & ML': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'llm', 'data science', 'ai', 'ml'],
  'Version Control & Tools': ['git', 'github', 'gitlab', 'linux', 'bash', 'shell', 'agile', 'scrum'],
};

/**
 * Compute match score and analysis between a resume and a job description
 * @param {string} resumeText
 * @param {string} jobText
 * @returns {{ matchScore, matchedKeywords, missingKeywords, suggestions, jobKeywords, resumeKeywords }}
 */
function analyzeMatch(resumeText, jobText) {
  const jobKeywords = extractKeywords(jobText);
  const resumeKeywords = new Set(extractKeywords(resumeText));

  if (jobKeywords.length === 0) {
    return {
      matchScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      suggestions: ['Job description appears too short or generic to extract meaningful keywords.'],
      jobKeywords: [],
      resumeKeywords: [...resumeKeywords],
    };
  }

  // Exact + partial matching (handles "node.js" vs "nodejs" etc.)
  const matched = [];
  const missing = [];

  for (const jk of jobKeywords) {
    const normalizedJk = jk.replace(/[.\s]/g, '').toLowerCase();
    const isMatch = resumeKeywords.has(jk) ||
      [...resumeKeywords].some((rk) =>
        rk.replace(/[.\s]/g, '').toLowerCase() === normalizedJk ||
        rk.includes(jk) || jk.includes(rk)
      );

    if (isMatch) {
      matched.push(jk);
    } else {
      missing.push(jk);
    }
  }

  // Base score: matched / total job keywords
  const baseScore = (matched.length / jobKeywords.length) * 100;

  // Bonus for tech keywords (they matter more)
  const techMatched = matched.filter((k) => isTechKeyword(k)).length;
  const techTotal = jobKeywords.filter((k) => isTechKeyword(k)).length;
  const techBonus = techTotal > 0 ? ((techMatched / techTotal) * 0.1 * 100) : 0;

  const matchScore = Math.min(100, Math.round(baseScore * 0.9 + techBonus));

  // Generate suggestions grouped by category
  const suggestions = generateSuggestions(missing, matchScore);

  return {
    matchScore,
    matchedKeywords: matched,
    missingKeywords: missing.slice(0, 15), // cap for readability
    suggestions,
    jobKeywords,
    resumeKeywords: [...resumeKeywords],
  };
}

function isTechKeyword(kw) {
  return Object.values(CATEGORIES).flat().some((tech) =>
    tech.toLowerCase() === kw.toLowerCase()
  );
}

function generateSuggestions(missingKeywords, score) {
  const suggestions = [];

  // Group missing keywords by category
  const grouped = {};
  const uncategorized = [];

  for (const kw of missingKeywords) {
    let found = false;
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
      if (keywords.some((k) => k.toLowerCase() === kw.toLowerCase())) {
        grouped[category] = grouped[category] || [];
        grouped[category].push(kw);
        found = true;
        break;
      }
    }
    if (!found) uncategorized.push(kw);
  }

  // Category-specific suggestions
  for (const [category, keywords] of Object.entries(grouped)) {
    suggestions.push(`Add ${category} skills: ${keywords.join(', ')}`);
  }

  if (uncategorized.length > 0) {
    suggestions.push(`Include these missing keywords: ${uncategorized.slice(0, 5).join(', ')}`);
  }

  // Score-based general advice
  if (score < 40) {
    suggestions.push('Your resume needs significant alignment with this role. Review the JD carefully and tailor your resume to match core requirements.');
    suggestions.push('Consider adding a skills section that mirrors the job description\'s key technologies and competencies.');
  } else if (score < 65) {
    suggestions.push('Your resume partially matches. Focus on highlighting relevant experience more prominently in your summary and bullet points.');
    suggestions.push('Use the same terminology from the job description to improve ATS (Applicant Tracking System) compatibility.');
  } else if (score < 80) {
    suggestions.push('Good match! Fine-tune by adding specific project examples that demonstrate the missing skills.');
  } else {
    suggestions.push('Excellent match! Make sure your resume highlights measurable achievements (e.g. "Reduced deployment time by 40% using Docker").');
  }

  return suggestions;
}

/**
 * Rank multiple resumes against a single job description
 * @param {Array<{id, name, text, fileName}>} resumes
 * @param {string} jobText
 * @returns {Array} sorted by matchScore descending
 */
function rankResumes(resumes, jobText) {
  const results = resumes.map((resume) => {
    const analysis = analyzeMatch(resume.text, jobText);
    return {
      id: resume.id,
      candidateName: resume.name || resume.fileName,
      fileName: resume.fileName,
      ...analysis,
    };
  });

  // Sort descending by match score
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { analyzeMatch, rankResumes };
