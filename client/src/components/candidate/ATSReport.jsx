import styles from './ATSReport.module.css';

const STATUS_ICON = { pass: '✓', warn: '⚠', fail: '✕' };
const STATUS_COLOR = { pass: 'green', warn: 'amber', fail: 'red' };

export default function ATSReport({ atsScore, atsSummary, atsChecks, wordCount }) {
  const color = atsSummary?.color || 'amber';

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>ATS Compatibility Report</h3>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            How well your resume passes Applicant Tracking Systems
          </p>
        </div>
        <div className={styles.scoreBadge} data-color={color}>
          <span className={styles.scoreNum}>{atsScore}%</span>
          <span className={styles.scoreLabel}>{atsSummary?.level}</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className={styles.barWrap}>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            data-color={color}
            style={{ width: `${atsScore}%` }}
          />
        </div>
      </div>
      <p className={styles.summaryMsg}>{atsSummary?.message}</p>

      {/* Checks grid */}
      <div className={styles.grid}>
        {atsChecks?.map((check, i) => (
          <div key={i} className={styles.checkCard} data-status={check.status}>
            <div className={styles.checkHeader}>
              <span className={styles.checkIcon} data-status={check.status}>
                {STATUS_ICON[check.status]}
              </span>
              <span className={styles.checkTitle}>{check.category}</span>
              <span className={styles.checkScore}>
                {check.score}/{check.maxScore}
              </span>
            </div>
            <p className={styles.checkMsg}>{check.message}</p>
            {check.tip && (
              <p className={styles.checkTip}>💡 {check.tip}</p>
            )}
            {check.found?.length > 0 && (
              <div className={styles.tags}>
                {check.found.map((f, j) => (
                  <span key={j} className={`${styles.tag} ${styles.tagGreen}`}>{f}</span>
                ))}
              </div>
            )}
            {check.missing?.length > 0 && (
              <div className={styles.tags}>
                {check.missing.map((f, j) => (
                  <span key={j} className={`${styles.tag} ${styles.tagRed}`}>✕ {f}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className={styles.wordCount}>
        📄 Resume word count: <strong>{wordCount} words</strong>
        {wordCount < 350 ? ' — consider expanding' : wordCount > 900 ? ' — consider trimming' : ' — good length'}
      </p>
    </div>
  );
}
