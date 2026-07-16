const router = require('express').Router();
const { handleMultipleUpload } = require('../middleware/upload');
const { extractText } = require('../services/resumeParser');
const { rankResumes } = require('../services/matcher');

// POST /api/recruiter/rank
// Accepts: multiple resume files + jobDescription (text)
router.post('/rank', handleMultipleUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one resume file is required' });
    }
    if (!req.body.jobDescription?.trim()) {
      return res.status(400).json({ success: false, message: 'Job description text is required' });
    }
    if (req.files.length > 20) {
      return res.status(400).json({ success: false, message: 'Maximum 20 resumes per request' });
    }

    // Extract text from all uploaded resumes in parallel
    const extractionResults = await Promise.allSettled(
      req.files.map(async (file) => {
        const text = await extractText(file.buffer, file.originalname);
        return {
          id: file.originalname,
          name: file.originalname.replace(/\.[^.]+$/, ''), // filename without extension as candidate name
          fileName: file.originalname,
          text,
        };
      })
    );

    // Separate successful extractions from failures
    const resumes = [];
    const errors = [];

    extractionResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        resumes.push(result.value);
      } else {
        errors.push({
          file: req.files[idx].originalname,
          error: result.reason.message,
        });
      }
    });

    if (resumes.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'No resumes could be processed',
        errors,
      });
    }

    // Run ranking engine
    const ranked = rankResumes(resumes, req.body.jobDescription);

    res.json({
      success: true,
      data: {
        jobTitle: req.body.jobTitle || 'Untitled Position',
        totalProcessed: resumes.length,
        failedFiles: errors,
        rankings: ranked.map((r, idx) => ({
          rank: idx + 1,
          candidateName: r.candidateName,
          fileName: r.fileName,
          matchScore: r.matchScore,
          matchedKeywords: r.matchedKeywords,
          missingKeywords: r.missingKeywords,
          suggestions: r.suggestions,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
