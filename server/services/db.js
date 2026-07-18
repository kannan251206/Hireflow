const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const sslConfig = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('neon.tech') || 
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.NODE_ENV === 'production'
) ? { rejectUnauthorized: false } : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

console.log('🔌 PostgreSQL client pool initialized');

// Database Tables Initialization
async function initDb() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password')) {
    console.warn('⚠️ DATABASE_URL is not set or contains default credentials. Skipping table initialization.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create resumes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        original_name VARCHAR(255) NOT NULL,
        extracted_text TEXT NOT NULL,
        keywords JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create job_descriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_descriptions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'Untitled Position',
        text TEXT NOT NULL,
        keywords JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        resume_id INT REFERENCES resumes(id) ON DELETE CASCADE,
        job_description_id INT REFERENCES job_descriptions(id) ON DELETE CASCADE,
        original_file_name VARCHAR(255),
        job_title VARCHAR(255) DEFAULT 'Untitled Position',
        match_score INT NOT NULL,
        ats_score INT DEFAULT 0,
        overall_score INT DEFAULT 0,
        matched_keywords JSONB DEFAULT '[]'::jsonb,
        missing_keywords JSONB DEFAULT '[]'::jsonb,
        suggestions JSONB DEFAULT '[]'::jsonb,
        ats_checks JSONB DEFAULT '[]'::jsonb,
        ai_suggestions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database tables initialized successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to initialize PostgreSQL database tables:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// 1. Auth: Register
async function registerUser({ name, email, password, role }) {
  const hashedPassword = await bcrypt.hash(password, 12);
  try {
    const res = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email.toLowerCase().trim(), hashedPassword, role]
    );
    const user = res.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return {
      token,
      user
    };
  } catch (err) {
    if (err.code === '23505') {
      const dbErr = new Error('Email already registered');
      dbErr.status = 409;
      throw dbErr;
    }
    throw err;
  }
}

// 2. Auth: Login
async function loginUser({ email, password }) {
  const res = await pool.query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  const user = res.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
}

// 3. Token verification
async function verifyToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const res = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
  const user = res.rows[0];
  if (!user) {
    const err = new Error('User no longer exists');
    err.status = 401;
    throw err;
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Save Resume
    const resumeRes = await client.query(
      'INSERT INTO resumes (user_id, original_name, extracted_text, keywords) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, resumeName, resumeText, JSON.stringify(resumeKeywords || [])]
    );
    const resumeId = resumeRes.rows[0].id;
    
    // Save Job Description
    const jdRes = await client.query(
      'INSERT INTO job_descriptions (user_id, title, text, keywords) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, jobTitle || 'Untitled Position', jobDescription, JSON.stringify(jobKeywords || [])]
    );
    const jdId = jdRes.rows[0].id;
    
    // Save Result
    const resRes = await client.query(
      `INSERT INTO results (
        resume_id, job_description_id, original_file_name, job_title,
        match_score, ats_score, overall_score, matched_keywords,
        missing_keywords, suggestions, ats_checks, ai_suggestions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        resumeId,
        jdId,
        resumeName,
        jobTitle || 'Untitled Position',
        analysis.matchScore,
        atsResult.atsScore,
        overallScore,
        JSON.stringify(analysis.matchedKeywords || []),
        JSON.stringify(analysis.missingKeywords || []),
        JSON.stringify(analysis.suggestions || []),
        JSON.stringify(atsResult.checks || []),
        JSON.stringify(aiResult.suggestions || [])
      ]
    );
    const resultId = resRes.rows[0].id;
    
    await client.query('COMMIT');
    return { _id: resultId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// 5. Get user history
async function getUserHistory(userId) {
  const query = `
    SELECT 
      r.id,
      r.resume_id,
      r.job_description_id,
      r.original_file_name,
      r.job_title,
      r.match_score,
      r.ats_score,
      r.overall_score,
      r.matched_keywords,
      r.missing_keywords,
      r.suggestions,
      r.ats_checks,
      r.ai_suggestions,
      r.created_at,
      res.original_name AS resume_original_name,
      jd.title AS job_description_title
    FROM results r
    INNER JOIN resumes res ON r.resume_id = res.id
    LEFT JOIN job_descriptions jd ON r.job_description_id = jd.id
    WHERE res.user_id = $1
    ORDER BY r.created_at DESC
    LIMIT 20
  `;
  const res = await pool.query(query, [userId]);
  return res.rows.map(r => ({
    _id: r.id,
    resumeId: { _id: r.resume_id, originalName: r.resume_original_name },
    jobDescriptionId: { _id: r.job_description_id, title: r.job_description_title },
    originalFileName: r.original_file_name,
    jobTitle: r.job_title,
    matchScore: r.match_score,
    atsScore: r.ats_score,
    overallScore: r.overall_score,
    matchedKeywords: r.matched_keywords,
    missingKeywords: r.missing_keywords,
    suggestions: r.suggestions,
    atsChecks: r.ats_checks,
    aiSuggestions: r.ai_suggestions,
    createdAt: r.created_at
  }));
}

module.exports = {
  pool,
  initDb,
  registerUser,
  loginUser,
  verifyToken,
  saveAnalysis,
  getUserHistory
};
