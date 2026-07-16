import { useState } from 'react';
import styles from './RankingTable.module.css';

function ScoreBar({ score }) {
  const color = score >= 75 ? '#1a6b4a' : score >= 50 ? '#b45309' : '#dc2626';
  return (
    <div className={styles.barWrap}>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className={styles.barLabel} style={{ color }}>{score}%</span>
    </div>
  );
}

export default function RankingTable({ rankings, jobTitle }) {
  const [expanded, setExpanded] = useState(null);

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <div className={`fade-up ${styles.wrap}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Candidate Rankings</h2>
          <p className="text-muted mt-4">
            {rankings.length} candidate{rankings.length !== 1 ? 's' : ''} ranked for <strong>{jobTitle || 'this role'}</strong>
          </p>
        </div>
        <span className="badge badge-green">{rankings.length} processed</span>
      </div>

      <div className={styles.table}>
        {rankings.map((r, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.rowMain} onClick={() => toggle(i)}>
              <span className={`${styles.rank} ${i === 0 ? styles.rankTop : ''}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>

              <div className={styles.candidate}>
                <div className={styles.candidateAvatar}>
                  {r.candidateName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className={styles.candidateName}>{r.candidateName}</p>
                  <p className="text-muted" style={{ fontSize: 12 }}>
                    {r.matchedKeywords?.length || 0} matched · {r.missingKeywords?.length || 0} missing
                  </p>
                </div>
              </div>

              <div className={styles.scoreCol}>
                <ScoreBar score={r.matchScore} />
              </div>

              <button className={styles.expandBtn}>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ transform: expanded === i ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {expanded === i && (
              <div className={styles.detail}>
                <div className={styles.kwGrid}>
                  <div>
                    <p className={styles.kwTitle}>✓ Matched</p>
                    <div className={styles.pills}>
                      {r.matchedKeywords?.length > 0
                        ? r.matchedKeywords.map((kw, j) => (
                            <span key={j} className="kw-pill kw-pill-matched">{kw}</span>
                          ))
                        : <span className="text-muted">None</span>
                      }
                    </div>
                  </div>
                  <div>
                    <p className={styles.kwTitle}>✕ Missing</p>
                    <div className={styles.pills}>
                      {r.missingKeywords?.length > 0
                        ? r.missingKeywords.map((kw, j) => (
                            <span key={j} className="kw-pill kw-pill-missing">{kw}</span>
                          ))
                        : <span className="text-muted">None</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
