/**
 * ATS (Applicant Tracking System) Scoring Engine
 * Checks resume against real ATS constraints beyond just keywords
 */

const REQUIRED_SECTIONS = ['experience', 'education', 'skills'];
const PREFERRED_SECTIONS = ['summary', 'objective', 'projects', 'certifications', 'achievements', 'internship'];

const ATS_UNFRIENDLY_PATTERNS = [
  { pattern: /\btable\b/i,        issue: 'Tables are often unreadable by ATS parsers' },
  { pattern: /\bcolumn\b/i,       issue: 'Multi-column layouts can confuse ATS systems' },
  { pattern: /\bgraphic\b/i,      issue: 'Graphics and images are ignored by ATS' },
  { pattern: /\bheader\b.*\bfooter\b/i, issue: 'Content in headers/footers may be missed' },
];

const ACTION_VERBS = [
  'developed','built','designed','implemented','led','managed','created','improved',
  'optimized','delivered','collaborated','architected','deployed','automated','analyzed',
  'increased','reduced','achieved','launched','maintained','mentored','resolved',
];

const QUANTIFIER_PATTERN = /\d+(\.\d+)?(%|x|\+|k|m|b| percent| times| users| clients| projects)/i;

/**
 * Run full ATS analysis on resume text
 */
function runATSCheck(resumeText) {
  const text = resumeText.toLowerCase();
  const lines = resumeText.split('\n').filter(l => l.trim().length > 0);
  const wordCount = resumeText.split(/\s+/).length;
  const checks = [];
  let totalScore = 0;
  let maxScore = 0;

  // ── 1. Section Detection ──────────────────────────────
  const foundSections = [];
  const missingSections = [];

  for (const section of REQUIRED_SECTIONS) {
    if (text.includes(section)) {
      foundSections.push(section);
    } else {
      missingSections.push(section);
    }
  }

  const foundPreferred = PREFERRED_SECTIONS.filter(s => text.includes(s));

  const sectionScore = Math.round((foundSections.length / REQUIRED_SECTIONS.length) * 20);
  totalScore += sectionScore;
  maxScore += 20;

  checks.push({
    category: 'Section Structure',
    score: sectionScore,
    maxScore: 20,
    status: sectionScore >= 16 ? 'pass' : sectionScore >= 10 ? 'warn' : 'fail',
    found: foundSections,
    missing: missingSections,
    preferred: foundPreferred,
    message: missingSections.length === 0
      ? `All required sections found: ${foundSections.join(', ')}`
      : `Missing required sections: ${missingSections.join(', ')}`,
    tip: missingSections.length > 0
      ? `Add clearly labeled sections: ${missingSections.map(s => s.toUpperCase()).join(', ')}`
      : foundPreferred.length < 2
      ? 'Consider adding a Summary or Projects section to stand out'
      : null,
  });

  // ── 2. Resume Length ──────────────────────────────────
  maxScore += 15;
  let lengthScore, lengthStatus, lengthMsg, lengthTip;

  if (wordCount < 200) {
    lengthScore = 5;
    lengthStatus = 'fail';
    lengthMsg = `Too short: ${wordCount} words. ATS may flag thin resumes.`;
    lengthTip = 'Aim for 400–800 words. Add more detail to your experience and projects.';
  } else if (wordCount < 350) {
    lengthScore = 10;
    lengthStatus = 'warn';
    lengthMsg = `Slightly short: ${wordCount} words.`;
    lengthTip = 'Consider expanding your experience descriptions with more detail and impact.';
  } else if (wordCount <= 900) {
    lengthScore = 15;
    lengthStatus = 'pass';
    lengthMsg = `Good length: ${wordCount} words — ideal for ATS parsing.`;
    lengthTip = null;
  } else {
    lengthScore = 8;
    lengthStatus = 'warn';
    lengthMsg = `Too long: ${wordCount} words. May get truncated by some ATS.`;
    lengthTip = 'Trim to under 900 words. Focus on the most relevant experience.';
  }

  totalScore += lengthScore;
  checks.push({
    category: 'Resume Length',
    score: lengthScore,
    maxScore: 15,
    status: lengthStatus,
    wordCount,
    message: lengthMsg,
    tip: lengthTip,
  });

  // ── 3. Contact Information ────────────────────────────
  maxScore += 15;
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(resumeText);
  const hasLinkedIn = /linkedin\.com/i.test(resumeText);
  const hasGitHub = /github\.com/i.test(resumeText);

  const contactItems = [
    { label: 'Email', found: hasEmail },
    { label: 'Phone', found: hasPhone },
    { label: 'LinkedIn', found: hasLinkedIn },
    { label: 'GitHub', found: hasGitHub },
  ];

  const contactFound = contactItems.filter(c => c.found).map(c => c.label);
  const contactMissing = contactItems.filter(c => !c.found).map(c => c.label);
  const contactScore = Math.min(15, contactFound.length * 4);
  totalScore += contactScore;

  checks.push({
    category: 'Contact Information',
    score: contactScore,
    maxScore: 15,
    status: contactFound.length >= 3 ? 'pass' : contactFound.length >= 2 ? 'warn' : 'fail',
    found: contactFound,
    missing: contactMissing,
    message: `Found: ${contactFound.join(', ') || 'none'}`,
    tip: contactMissing.length > 0
      ? `Add missing contact info: ${contactMissing.join(', ')}`
      : null,
  });

  // ── 4. Action Verbs ───────────────────────────────────
  maxScore += 15;
  const foundVerbs = ACTION_VERBS.filter(v => text.includes(v));
  const verbScore = Math.min(15, Math.round((foundVerbs.length / 5) * 15));
  totalScore += verbScore;

  checks.push({
    category: 'Action Verbs',
    score: verbScore,
    maxScore: 15,
    status: foundVerbs.length >= 5 ? 'pass' : foundVerbs.length >= 3 ? 'warn' : 'fail',
    found: foundVerbs.slice(0, 8),
    count: foundVerbs.length,
    message: `${foundVerbs.length} action verbs found`,
    tip: foundVerbs.length < 5
      ? `Use strong action verbs like: ${ACTION_VERBS.filter(v => !foundVerbs.includes(v)).slice(0, 5).join(', ')}`
      : null,
  });

  // ── 5. Quantified Achievements ────────────────────────
  maxScore += 15;
  const bulletLines = lines.filter(l => l.trim().match(/^[-•*►▸]/));
  const quantifiedLines = lines.filter(l => QUANTIFIER_PATTERN.test(l));
  const quantScore = quantifiedLines.length === 0 ? 0
    : quantifiedLines.length === 1 ? 8
    : quantifiedLines.length >= 3 ? 15 : 12;
  totalScore += quantScore;

  checks.push({
    category: 'Quantified Achievements',
    score: quantScore,
    maxScore: 15,
    status: quantifiedLines.length >= 3 ? 'pass' : quantifiedLines.length >= 1 ? 'warn' : 'fail',
    count: quantifiedLines.length,
    message: `${quantifiedLines.length} quantified achievement${quantifiedLines.length !== 1 ? 's' : ''} found`,
    tip: quantifiedLines.length < 3
      ? 'Add numbers to your achievements e.g. "Improved performance by 30%" or "Built system serving 1000+ users"'
      : null,
  });

  // ── 6. File & Formatting ──────────────────────────────
  maxScore += 10;
  const hasSpecialChars = /[^\x00-\x7F]{10,}/.test(resumeText);
  const hasBullets = bulletLines.length > 0;
  const formatScore = hasBullets ? (hasSpecialChars ? 6 : 10) : 5;
  totalScore += formatScore;

  checks.push({
    category: 'Formatting',
    score: formatScore,
    maxScore: 10,
    status: formatScore >= 8 ? 'pass' : formatScore >= 5 ? 'warn' : 'fail',
    message: hasBullets
      ? `Good use of bullet points (${bulletLines.length} found)`
      : 'No bullet points detected — consider using them for experience descriptions',
    tip: !hasBullets
      ? 'Use bullet points (•) to list responsibilities and achievements for better ATS parsing'
      : hasSpecialChars
      ? 'Avoid special characters or symbols that may not parse correctly'
      : null,
  });

  // ── 7. Education Section ──────────────────────────────
  maxScore += 10;
  const hasDegree = /(b\.?e|b\.?tech|b\.?sc|m\.?tech|m\.?sc|bachelor|master|phd|degree)/i.test(resumeText);
  const hasGPA = /(cgpa|gpa|percentage|grade)/i.test(resumeText);
  const hasYear = /20(1[5-9]|2[0-9])/.test(resumeText);
  const eduScore = (hasDegree ? 5 : 0) + (hasGPA ? 3 : 0) + (hasYear ? 2 : 0);
  totalScore += eduScore;

  checks.push({
    category: 'Education Details',
    score: eduScore,
    maxScore: 10,
    status: eduScore >= 8 ? 'pass' : eduScore >= 5 ? 'warn' : 'fail',
    message: [
      hasDegree ? '✓ Degree mentioned' : '✗ No degree found',
      hasGPA ? '✓ GPA/percentage included' : '✗ GPA missing',
      hasYear ? '✓ Graduation year found' : '✗ Year missing',
    ].join(' · '),
    tip: !hasDegree ? 'Clearly state your degree name and institution'
      : !hasGPA ? 'Include your GPA or percentage'
      : null,
  });

  const atsScore = Math.round((totalScore / maxScore) * 100);

  return {
    atsScore,
    totalScore,
    maxScore,
    checks,
    wordCount,
    summary: getATSSummary(atsScore, checks),
  };
}

function getATSSummary(score, checks) {
  const fails = checks.filter(c => c.status === 'fail').map(c => c.category);
  const warns = checks.filter(c => c.status === 'warn').map(c => c.category);

  if (score >= 80) return { level: 'Excellent', color: 'green', message: 'Your resume is highly ATS-optimized.' };
  if (score >= 65) return { level: 'Good', color: 'blue', message: `Minor improvements needed in: ${warns.slice(0,2).join(', ')}` };
  if (score >= 45) return { level: 'Needs Work', color: 'amber', message: `Key issues in: ${[...fails, ...warns].slice(0,3).join(', ')}` };
  return { level: 'Poor', color: 'red', message: `Critical issues in: ${fails.slice(0,3).join(', ')}` };
}

module.exports = { runATSCheck };
