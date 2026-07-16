import { useState, useEffect } from 'react';
import { getHistory } from '../../services/api';
import styles from './HistoryPanel.module.css';

export default function HistoryPanel({ onSelect }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(res => setHistory(res.data.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}><span className="spinner" /> Loading history…</div>;
  if (history.length === 0) return (
    <div className={styles.empty}>
      <span style={{ fontSize: 32 }}>📂</span>
      <p>No past analyses yet.</p>
      <p className="text-muted" style={{ fontSize: 13 }}>Your results will appear here after you analyze a resume.</p>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>Past Analyses</h3>
      <div className={styles.list}>
        {history.map((r, i) => {
          const score = r.overallScore || r.matchScore;
          const color = score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red';
          return (
            <div key={i} className={styles.item} onClick={() => onSelect && onSelect(r)}>
              <div className={styles.scoreRing} data-color={color}>{score}%</div>
              <div className={styles.info}>
                <p className={styles.fileName}>{r.originalFileName || r.resumeId?.originalName || 'Resume'}</p>
                <p className={styles.jobTitle}>{r.jobTitle || r.jobDescriptionId?.title || 'Untitled Position'}</p>
                <p className={styles.date}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className={styles.scores}>
                <span className={styles.scoreTag} data-color={color}>Match {r.matchScore}%</span>
                {r.atsScore > 0 && <span className={styles.scoreTag} data-color="blue">ATS {r.atsScore}%</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
