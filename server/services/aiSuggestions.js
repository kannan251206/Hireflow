const fetch = require('node-fetch');

/**
 * Generate AI-powered resume improvement suggestions using Claude API
 */
async function getAISuggestions({ resumeText, jobDescription, matchScore, missingKeywords, atsScore, atsChecks }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { suggestions: [], error: 'AI suggestions unavailable — ANTHROPIC_API_KEY not set' };
  }

  const failedChecks = atsChecks
    .filter(c => c.status === 'fail' || c.status === 'warn')
    .map(c => `- ${c.category}: ${c.message}`)
    .join('\n');

  const prompt = `You are an expert resume coach and ATS specialist. Analyze this resume against the job description and provide specific, actionable improvements.

RESUME TEXT:
${resumeText.slice(0, 2000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 1000)}

CURRENT SCORES:
- Keyword Match Score: ${matchScore}%
- ATS Compatibility Score: ${atsScore}%
- Missing Keywords: ${missingKeywords.slice(0, 10).join(', ')}

ATS ISSUES DETECTED:
${failedChecks || 'None'}

Provide exactly 6 specific, actionable suggestions to improve this resume. Format your response as a JSON array only, no other text:
[
  {
    "priority": "high|medium|low",
    "category": "Keywords|ATS Format|Experience|Skills|Achievements|Summary",
    "suggestion": "specific actionable advice here",
    "example": "concrete example of how to implement this"
  }
]

Focus on: specific wording changes, missing keywords to add, quantifying achievements, ATS formatting fixes. Be very specific to THIS resume and THIS job.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || '[]';

    // Clean and parse JSON
    const clean = text.replace(/```json|```/g, '').trim();
    const suggestions = JSON.parse(clean);

    return { suggestions, error: null };
  } catch (err) {
    console.error('AI suggestions error:', err.message);
    return { suggestions: [], error: 'AI suggestions temporarily unavailable' };
  }
}

module.exports = { getAISuggestions };
