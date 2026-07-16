import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: searchParams.get('role') || 'candidate',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === 'recruiter' ? '/recruiter' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            <span className={styles.sidebarBadge}>Create a free account</span>
            <h2 className={styles.sidebarTitle}>Start hiring or getting hired smarter</h2>
            <p className={styles.sidebarText}>
              Join HireFlow to access powerful resume matching tools, template builders, and applicant scoring algorithms.
            </p>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>👤</div>
              <div className={styles.featureMeta}>
                <h4>For Candidates</h4>
                <p>Upload PDF/DOCX resumes, paste job descriptions, and see missing keywords with live suggestions.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📝</div>
              <div className={styles.featureMeta}>
                <h4>Interactive Resume Builder</h4>
                <p>Build a professional resume with live A4 layout styling and instant PDF export capabilities.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🏢</div>
              <div className={styles.featureMeta}>
                <h4>For Recruiters</h4>
                <p>Upload up to 20 resumes in bulk, rank applicants automatically, and filter profiles by skill match.</p>
              </div>
            </div>
          </div>

          <div className={styles.testimonial}>
            <p className={styles.quote}>
              "Creating an account on HireFlow took less than a minute, and I optimized my resume for three major roles the very same day."
            </p>
            <p className={styles.author}>— Frontend Developer, HireFlow User</p>
          </div>
        </div>
      </div>

      {/* Right-side Auth Form Container */}
      <div className={styles.formContainer}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Create account</h1>
            <p className={styles.sub}>Join HireFlow — it's free</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

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
                  placeholder="Min. 6 characters"
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

            <div className="form-group">
              <label className="form-label">I am a…</label>
              <div className={styles.roleToggle}>
                {['candidate', 'recruiter'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`${styles.roleBtn} ${form.role === r ? styles.roleBtnActive : ''}`}
                    onClick={() => setForm({ ...form, role: r })}
                  >
                    {r === 'candidate' ? '👤 Candidate' : '🏢 Recruiter'}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className={styles.footer}>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
