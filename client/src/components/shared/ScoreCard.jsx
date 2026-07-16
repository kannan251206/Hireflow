import { useEffect, useRef } from 'react';
import styles from './ScoreCard.module.css';

function getScoreColor(score) {
  if (score >= 75) return '#1a6b4a';
  if (score >= 50) return '#b45309';
  return '#dc2626';
}
function getScoreLabel(score) {
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Partial';
  if (score >= 30) return 'Weak';
  return 'Poor';
}

export default function ScoreCard({ score, label = 'Match Score', small = false }) {
  const circleRef = useRef(null);
  const radius = small ? 36 : 54;
  const size = small ? 88 : 130;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    const offset = circumference - (score / 100) * circumference;
    circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    circle.style.strokeDashoffset = offset;
  }, [score, circumference]);

  if (small) {
    return (
      <div className={styles.smallWrap}>
        <div className={styles.ringWrap}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e4e2db" strokeWidth="7" />
            <circle ref={circleRef} cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference}
              transform={`rotate(-90 ${size/2} ${size/2})`}
            />
          </svg>
          <div className={styles.label}>
            <span className={styles.scoreSmall} style={{ color }}>{score}%</span>
          </div>
        </div>
        <span className={styles.smallLabel}>{label}</span>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.ringWrap}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e4e2db" strokeWidth="10" />
          <circle ref={circleRef} cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </svg>
        <div className={styles.label}>
          <span className={styles.score} style={{ color }}>{score}%</span>
          <span className={styles.sublabel}>Score</span>
        </div>
      </div>
      <div className={styles.meta}>
        <p className={styles.labelText}>{label}</p>
        <span className={`badge ${score >= 75 ? 'badge-green' : score >= 50 ? 'badge-amber' : 'badge-red'}`}>
          {getScoreLabel(score)} match
        </span>
        <p className="text-muted mt-8" style={{ fontSize: 13 }}>
          {score >= 75 ? 'Your resume is well-aligned with this role.'
            : score >= 50 ? 'Some gaps — review missing keywords below.'
            : 'Significant gaps — tailor your resume to the job.'}
        </p>
      </div>
    </div>
  );
}
