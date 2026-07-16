const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  originalName: { type: String, required: true },
  extractedText: { type: String, required: true },
  keywords: [String],
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const jobDescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, default: 'Untitled Position' },
  text: { type: String, required: true },
  keywords: [String],
}, { timestamps: true });

const resultSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  jobDescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDescription' },
  originalFileName: String,
  jobTitle: { type: String, default: 'Untitled Position' },
  matchScore: { type: Number, required: true },
  atsScore: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },
  matchedKeywords: [String],
  missingKeywords: [String],
  suggestions: [String],
  atsChecks: { type: Array, default: [] },
  aiSuggestions: { type: Array, default: [] },
}, { timestamps: true });

module.exports = {
  Resume: mongoose.model('Resume', resumeSchema),
  JobDescription: mongoose.model('JobDescription', jobDescriptionSchema),
  Result: mongoose.model('Result', resultSchema),
};
