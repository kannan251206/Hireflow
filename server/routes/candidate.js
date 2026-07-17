const router = require('express').Router();
const { handleSingleUpload } = require('../middleware/upload');
const { extractText } = require('../services/resumeParser');
const { extractKeywords } = require('../services/keywordExtractor');
const { analyzeMatch } = require('../services/matcher');
const { runATSCheck } = require('../services/atsScorer');
const { getAISuggestions } = require('../services/aiSuggestions');
const { verifyToken, saveAnalysis, getUserHistory } = require('../services/db');

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
        const token = req.headers.authorization.split(' ')[1];
        const decoded = await verifyToken(token);
        savedResult = await saveAnalysis({
          userId: decoded.id,
          resumeName: req.file.originalname,
          resumeText,
          resumeKeywords,
          jobTitle: req.body.jobTitle || 'Untitled Position',
          jobDescription: req.body.jobDescription,
          jobKeywords,
          analysis,
          atsResult,
          overallScore,
          aiResult
        });
      } catch (err) {
        console.warn('⚠️ Could not save candidate analysis history:', err.message);
      }
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
    const token = req.headers.authorization.split(' ')[1];
    const decoded = await verifyToken(token);
    const results = await getUserHistory(decoded.id);
    res.json({ success: true, data: results });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
});

module.exports = router;
