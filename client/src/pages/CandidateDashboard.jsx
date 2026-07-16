import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { analyzeResume } from '../services/api';
import FileDropzone from '../components/shared/FileDropzone';
import AnalysisResult from '../components/candidate/AnalysisResult';
import HistoryPanel from '../components/candidate/HistoryPanel';
import ResumeBuilder from '../components/candidate/ResumeBuilder';
import styles from './CandidateDashboard.module.css';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'analyze');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setTab(t);
  }, [searchParams]);


  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setResumeFile(accepted[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) { setError('Please upload your resume.'); return; }
    if (!jobDesc.trim()) { setError('Please paste the job description.'); return; }
    setError(''); setResult(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      fd.append('jobDescription', jobDesc);
      fd.append('jobTitle', jobTitle);
      const res = await analyzeResume(fd);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResumeFile(null); setJobDesc(''); setJobTitle(''); setResult(null); setError(''); };

  return (
    <div className={tab === 'builder' ? 'page-content-wide' : 'page-content'}>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Resume Analyzer & Builder</h1>
          <p className={styles.pageSub}>Welcome back, <strong>{user.name}</strong></p>
        </div>
        {result && tab === 'analyze' && <button className="btn btn-secondary" onClick={handleReset}>↩ Analyze another</button>}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'analyze' ? styles.tabActive : ''}`} onClick={() => setTab('analyze')}>
          ✨ Analyze Resume
        </button>
        <button className={`${styles.tab} ${tab === 'builder' ? styles.tabActive : ''}`} onClick={() => setTab('builder')}>
          📝 Resume Builder
        </button>
        <button className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`} onClick={() => setTab('history')}>
          🕓 History
        </button>
      </div>

      {tab === 'history' ? (
        <div className="card" style={{ marginTop: 16 }}>
          <HistoryPanel />
        </div>
      ) : tab === 'builder' ? (
        <ResumeBuilder />
      ) : !result ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="card">
            <h2 className={styles.sectionTitle}><span>1</span> Upload your resume</h2>
            <FileDropzone onDrop={onDrop} files={resumeFile ? [resumeFile] : []} />
          </div>
          <div className="card">
            <h2 className={styles.sectionTitle}><span>2</span> Paste the job description</h2>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Job title (optional)</label>
              <input className="form-input" type="text" placeholder="e.g. Senior React Developer"
                value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Job description *</label>
              <textarea className="form-textarea" placeholder="Paste the full job description here…"
                value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={8} required />
            </div>
          </div>
          {error && <div className={styles.errorBanner}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg w-full"
            disabled={loading || !resumeFile || !jobDesc.trim()}>
            {loading ? <><span className="spinner" /> Analyzing — this may take a moment…</> : '✨ Analyze my resume'}
          </button>
          {loading && (
            <p className={styles.loadingNote}>
              🤖 Running keyword match, ATS check, and AI suggestions…
            </p>
          )}
        </form>
      ) : (
        <AnalysisResult data={result} />
      )}
    </div>
  );
}
