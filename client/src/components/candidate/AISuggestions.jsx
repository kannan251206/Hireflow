import styles from './AISuggestions.module.css';

const PRIORITY_COLOR = { high: 'red', medium: 'amber', low: 'blue' };
const CATEGORY_ICON = {
  'Keywords': '🔑',
  'ATS Format': '🤖',
  'Experience': '💼',
  'Skills': '⚡',
  'Achievements': '🏆',
  'Summary': '📝',
};

export default function AISuggestions({ suggestions, error }) {
  if (error && (!suggestions || suggestions.length === 0)) {
    return (
      <div className={styles.wrap}>
        <h3 className={styles.title}>🤖 AI-Powered Suggestions</h3>
        <div className={styles.errorBox}>
          <p>AI suggestions unavailable — add your <code>ANTHROPIC_API_KEY</code> to <code>server/.env</code> to enable this feature.</p>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  const high   = suggestions.filter(s => s.priority === 'high');
  const medium = suggestions.filter(s => s.priority === 'medium');
  const low    = suggestions.filter(s => s.priority === 'low');
  const ordered = [...high, ...medium, ...low];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>🤖 AI-Powered Suggestions</h3>
        <span className={styles.badge}>Powered by Claude</span>
      </div>
      <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
        Personalised recommendations based on your resume and this specific job.
      </p>

      <div className={styles.list}>
        {ordered.map((s, i) => (
          <div key={i} className={styles.card} data-priority={s.priority}>
            <div className={styles.cardHeader}>
              <span className={styles.categoryIcon}>{CATEGORY_ICON[s.category] || '💡'}</span>
              <span className={styles.category}>{s.category}</span>
              <span className={styles.priority} data-color={PRIORITY_COLOR[s.priority]}>
                {s.priority}
              </span>
            </div>
            <p className={styles.suggestion}>{s.suggestion}</p>
            {s.example && (
              <div className={styles.example}>
                <span className={styles.exampleLabel}>Example:</span>
                <span className={styles.exampleText}>{s.example}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
