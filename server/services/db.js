const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const isSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

let supabase = null;
if (isSupabase) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('🔌 Supabase configuration loaded for database and auth');
}

// Lazy load Mongoose models only if MongoDB is used to prevent errors if Mongo is not connected
let User, Resume, JobDescription, Result;
function initMongoModels() {
  if (!User) {
    User = require('../models/User');
    const models = require('../models');
    Resume = models.Resume;
    JobDescription = models.JobDescription;
    Result = models.Result;
  }
}

// 1. Auth: Register
async function registerUser({ name, email, password, role }) {
  if (isSupabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    });

    if (error) {
      const err = new Error(error.message);
      // Supabase defaults to 400 or 422 for signup errors
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('exists')) {
        err.status = 409;
      } else {
        err.status = error.status || 400;
      }
      throw err;
    }

    if (!data.session) {
      // If email confirmation is enabled, session might be null.
      // Return a message or mock token, but for ease of use we assume confirmation is off or we return user.
      return {
        token: 'email_confirmation_required',
        user: {
          id: data.user.id,
          name: data.user.user_metadata.name || name,
          email: data.user.email,
          role: data.user.user_metadata.role || role
        }
      };
    }

    // Optional: write to custom profiles/users table for database completeness
    try {
      await supabase.from('users').insert({
        id: data.user.id,
        name,
        email,
        password: '', // Kept empty as Supabase Auth manages passwords securely
        role
      });
    } catch (dbErr) {
      console.warn('⚠️ Profile table insert skipped or failed:', dbErr.message);
    }

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: data.user.user_metadata.name,
        email: data.user.email,
        role: data.user.user_metadata.role
      }
    };
  } else {
    initMongoModels();
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }
    const user = await User.create({ name, email, password, role });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    };
  }
}

// 2. Auth: Login
async function loginUser({ email, password }) {
  if (isSupabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const err = new Error(error.message || 'Invalid credentials');
      err.status = error.status || 401;
      throw err;
    }

    // Write to users table if missing (failsafe)
    try {
      await supabase.from('users').insert({
        id: data.user.id,
        name: data.user.user_metadata.name,
        email: data.user.email,
        password: '',
        role: data.user.user_metadata.role
      });
    } catch (dbErr) {
      // Ignored
    }

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: data.user.user_metadata.name,
        email: data.user.email,
        role: data.user.user_metadata.role
      }
    };
  } else {
    initMongoModels();
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    };
  }
}

// 3. Token verification
async function verifyToken(token) {
  if (isSupabase) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      const err = new Error('Token invalid or expired');
      err.status = 401;
      throw err;
    }
    return {
      id: user.id,
      name: user.user_metadata.name,
      email: user.email,
      role: user.user_metadata.role
    };
  } else {
    initMongoModels();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { id: decoded.id };
  }
}

// 4. Save analysis result
async function saveAnalysis({
  userId,
  resumeName,
  resumeText,
  resumeKeywords,
  jobTitle,
  jobDescription,
  jobKeywords,
  analysis,
  atsResult,
  overallScore,
  aiResult
}) {
  if (isSupabase) {
    // 4a. Save Resume
    const { data: resume, error: resumeErr } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        original_name: resumeName,
        extracted_text: resumeText,
        keywords: resumeKeywords
      })
      .select()
      .single();
    if (resumeErr) throw resumeErr;

    // 4b. Save Job Description
    const { data: jd, error: jdErr } = await supabase
      .from('job_descriptions')
      .insert({
        user_id: userId,
        title: jobTitle,
        text: jobDescription,
        keywords: jobKeywords
      })
      .select()
      .single();
    if (jdErr) throw jdErr;

    // 4c. Save Result
    const { data: result, error: resErr } = await supabase
      .from('results')
      .insert({
        resume_id: resume.id,
        job_description_id: jd.id,
        original_file_name: resumeName,
        job_title: jobTitle,
        match_score: analysis.matchScore,
        ats_score: atsResult.atsScore,
        overall_score: overallScore,
        matched_keywords: analysis.matchedKeywords,
        missing_keywords: analysis.missingKeywords,
        suggestions: analysis.suggestions,
        ats_checks: atsResult.checks,
        ai_suggestions: aiResult.suggestions
      })
      .select()
      .single();
    if (resErr) throw resErr;

    return { _id: result.id };
  } else {
    initMongoModels();
    const resume = await Resume.create({
      userId,
      originalName: resumeName,
      extractedText: resumeText,
      keywords: resumeKeywords
    });
    const jd = await JobDescription.create({
      userId,
      text: jobDescription,
      title: jobTitle,
      keywords: jobKeywords
    });
    const savedResult = await Result.create({
      resumeId: resume._id,
      jobDescriptionId: jd._id,
      originalFileName: resumeName,
      jobTitle: jobTitle,
      matchScore: analysis.matchScore,
      atsScore: atsResult.atsScore,
      overallScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      suggestions: analysis.suggestions,
      atsChecks: atsResult.checks,
      aiSuggestions: aiResult.suggestions
    });
    return { _id: savedResult._id };
  }
}

// 5. Get user history
async function getUserHistory(userId) {
  if (isSupabase) {
    const { data, error } = await supabase
      .from('results')
      .select('*, resumes!inner(user_id, original_name), job_descriptions(title)')
      .eq('resumes.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;

    return data.map(r => ({
      _id: r.id,
      resumeId: { _id: r.resume_id, originalName: r.resumes?.original_name },
      jobDescriptionId: { _id: r.job_description_id, title: r.job_descriptions?.title },
      originalFileName: r.original_file_name,
      jobTitle: r.job_title,
      matchScore: r.match_score,
      atsScore: r.ats_score,
      overall_score: r.overall_score,
      matched_keywords: r.matched_keywords,
      missing_keywords: r.missing_keywords,
      suggestions: r.suggestions,
      atsChecks: r.ats_checks,
      aiSuggestions: r.ai_suggestions,
      createdAt: r.created_at
    }));
  } else {
    initMongoModels();
    const userResumes = await Resume.find({ userId }).select('_id');
    const resumeIds = userResumes.map(r => r._id);
    const results = await Result.find({ resumeId: { $in: resumeIds } })
      .populate('resumeId', 'originalName')
      .populate('jobDescriptionId', 'title')
      .sort({ createdAt: -1 })
      .limit(20);
    return results;
  }
}

module.exports = {
  isSupabase,
  registerUser,
  loginUser,
  verifyToken,
  saveAnalysis,
  getUserHistory
};
