import { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { rankResumes } from '../services/api';
import { useDropzone } from 'react-dropzone';
import RankingTable from '../components/recruiter/RankingTable';
import styles from './RecruiterDashboard.module.css';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [resumeFiles, setResumeFiles] = useState([]);
  const [jobDesc, setJobDesc] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    setResumeFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const newFiles = accepted.filter((f) => !names.has(f.name));
      return [...prev, ...newFiles].slice(0, 20);
    });
  }, []);

  const removeFile = (i) => setResumeFiles((prev) => prev.filter((_, idx) => idx !== i));

  function MultiDropzone() {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      },
      multiple: true,
    });
    return (
      <div>
        <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
          <input {...getInputProps()} />
          <div className={styles.dropzoneIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 16V8m0 0l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16.5A3.5 3.5 0 0 0 7.5 20H17a4 4 0 0 0 .8-7.92A6 6 0 1 0 4 16.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {isDragActive ? (
            <p className={styles.dropzoneHint}>Drop resumes here…</p>
          ) : (
            <>
              <p className={styles.dropzoneHint}><strong>Click to upload</strong> or drag and drop</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                PDF or DOCX · max 5 MB · up to 20 files · click multiple times to add more
              </p>
            </>
          )}
        </div>

        {resumeFiles.length > 0 && (
          <ul className={styles.fileList}>
            {resumeFiles.map((f, i) => (
              <li key={i} className={styles.fileItem}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className={styles.fileName}>{f.name}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                <button type="button" className={styles.removeBtn} onClick={() => removeFile(i)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resumeFiles.length === 0) { setError('Upload at least one resume.'); return; }
    if (!jobDesc.trim()) { setError('Please paste the job description.'); return; }

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const fd = new FormData();
      resumeFiles.forEach((f) => fd.append('resumes', f));
      fd.append('jobDescription', jobDesc);
      fd.append('jobTitle', jobTitle);

      const res = await rankResumes(fd);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Ranking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResumeFiles([]);
    setJobDesc('');
    setJobTitle('');
    setResult(null);
    setError('');
  };

  return (
    <div className="page-content">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Candidate Ranker</h1>
          <p className={styles.pageSub}>Welcome, <strong>{user.name}</strong> — upload resumes and rank them against a job description.</p>
        </div>
        {result && (
          <button className="btn btn-secondary" onClick={handleReset}>
            ↩ New ranking
          </button>
        )}
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Resume upload */}
          <div className="card">
            <h2 className={styles.sectionTitle}>
              <span>1</span> Upload resumes
              <span className={styles.count}>{resumeFiles.length}/20</span>
            </h2>
            <MultiDropzone />
          </div>

          {/* Job description */}
          <div className="card">
            <h2 className={styles.sectionTitle}>
              <span>2</span> Enter job description
            </h2>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Job title (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Job description *</label>
              <textarea
                className="form-textarea"
                placeholder="Paste the full job description here…"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={8}
                required
              />
            </div>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading || resumeFiles.length === 0 || !jobDesc.trim()}
          >
            {loading
              ? <><span className="spinner" /> Ranking {resumeFiles.length} candidate{resumeFiles.length !== 1 ? 's' : ''}…</>
              : `🏆 Rank ${resumeFiles.length || ''} candidate${resumeFiles.length !== 1 ? 's' : ''}`}
          </button>
        </form>
      ) : (
        <RankingTable rankings={result.rankings} jobTitle={result.jobTitle} />
      )}
    </div>
  );
}
