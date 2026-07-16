import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'recruiter' ? '/recruiter' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left-side Platform Purpose Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarBadge}>Smart hiring with NLP</span>
            <h2 className={styles.sidebarTitle}>Match the right talent to the right role</h2>
            <p className={styles.sidebarText}>
              HireFlow is an intelligent platform designed for both candidates looking to optimize their resumes and recruiters looking to rank applicants instantly.
            </p>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📄</div>
              <div className={styles.featureMeta}>
                <h4>Resume Analysis</h4>
                <p>Upload your resume and a job description to get an instant match score with keyword breakdown.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🎯</div>
              <div className={styles.featureMeta}>
                <h4>NLP Scoring Engine</h4>
                <p>Extract and compare skills, tools, and technologies automatically from documents.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>💡</div>
              <div className={styles.featureMeta}>
                <h4>Tailored Recommendations</h4>
                <p>Get actionable suggestions to bridge the gap between candidate resumes and job profiles.</p>
              </div>
            </div>
          </div>

          <div className={styles.testimonial}>
            <p className={styles.quote}>
              "HireFlow helped our recruitment team slash screening times by over 70% while finding highly compatible candidates."
            </p>
            <p className={styles.author}>— HR Director, InnoTech Solutions</p>
          </div>
        </div>
      </div>

      {/* Right-side Auth Form Container */}
      <div className={styles.formContainer}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.sub}>Sign in to your HireFlow account</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className={styles.footer}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.link}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
