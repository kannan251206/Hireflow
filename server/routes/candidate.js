const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { handleSingleUpload } = require('../middleware/upload');
const { extractText } = require('../services/resumeParser');
const { extractKeywords } = require('../services/keywordExtractor');
const { analyzeMatch } = require('../services/matcher');
const { runATSCheck } = require('../services/atsScorer');
const { getAISuggestions } = require('../services/aiSuggestions');
const { Resume, JobDescription, Result } = require('../models');

// POST /api/candidate/analyze
router.post('/analyze', handleSingleUpload, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Resume file is required' });
    if (!req.body.jobDescription?.trim()) return res.status(400).json({ success: false, message: 'Job description text is required' });

    const resumeText = await extractText(req.file.buffer, req.file.originalname);
    const resumeKeywords = extractKeywords(resumeText);
    const jobKeywords = extractKeywords(req.body.jobDescription);
    const analysis = analyzeMatch(resumeText, req.body.jobDescription);
    const atsResult = runATSCheck(resumeText);
    const aiResult = await getAISuggestions({
      resumeText, jobDescription: req.body.jobDescription,
      matchScore: analysis.matchScore, missingKeywords: analysis.missingKeywords,
      atsScore: atsResult.atsScore, atsChecks: atsResult.checks,
    });

    const overallScore = Math.round(analysis.matchScore * 0.5 + atsResult.atsScore * 0.5);

    let savedResult = null;
    if (req.headers.authorization) {
      try {
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        const resume = await Resume.create({ userId: decoded.id, originalName: req.file.originalname, extractedText: resumeText, keywords: resumeKeywords });
        const jd = await JobDescription.create({ userId: decoded.id, text: req.body.jobDescription, title: req.body.jobTitle || 'Untitled Position', keywords: jobKeywords });
        savedResult = await Result.create({
          resumeId: resume._id, jobDescriptionId: jd._id,
          originalFileName: req.file.originalname, jobTitle: req.body.jobTitle || 'Untitled Position',
          matchScore: analysis.matchScore, atsScore: atsResult.atsScore, overallScore,
          matchedKeywords: analysis.matchedKeywords, missingKeywords: analysis.missingKeywords,
          suggestions: analysis.suggestions, atsChecks: atsResult.checks, aiSuggestions: aiResult.suggestions,
        });
      } catch { /* continue without saving */ }
    }

    res.json({
      success: true,
      data: {
        matchScore: analysis.matchScore, atsScore: atsResult.atsScore, overallScore,
        atsSummary: atsResult.summary, matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords, atsChecks: atsResult.checks,
        wordCount: atsResult.wordCount, suggestions: analysis.suggestions,
        aiSuggestions: aiResult.suggestions, aiError: aiResult.error,
        resultId: savedResult?._id,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/candidate/history
router.get('/history', async (req, res, next) => {
  try {
    if (!req.headers.authorization) return res.status(401).json({ success: false, message: 'Login required' });
    const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
    const userResumes = await Resume.find({ userId: decoded.id }).select('_id');
    const resumeIds = userResumes.map(r => r._id);
    const results = await Result.find({ resumeId: { $in: resumeIds } })
      .populate('resumeId', 'originalName')
      .populate('jobDescriptionId', 'title')
      .sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

module.exports = router;
