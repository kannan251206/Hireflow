import ScoreCard from '../shared/ScoreCard';
import ATSReport from './ATSReport';
import AISuggestions from './AISuggestions';
import styles from './AnalysisResult.module.css';

export default function AnalysisResult({ data }) {
  const {
    matchScore, atsScore, overallScore,
    atsSummary, atsChecks, wordCount,
    matchedKeywords, missingKeywords,
    suggestions, aiSuggestions, aiError,
  } = data;

  return (
    <div className={`fade-up ${styles.wrap}`}>
      <h2 className={styles.heading}>Analysis Results</h2>

      {/* 3 Score Cards */}
      <div className={styles.scoreGrid}>
        <ScoreCard score={overallScore || matchScore} label="Overall Score" />
        <ScoreCard score={matchScore} label="Keyword Match" small />
        <ScoreCard score={atsScore || 0} label="ATS Score" small />
      </div>

      {/* Keywords */}
      <div className={styles.kwGrid}>
        <KeywordSection title="✓ Matched Keywords" keywords={matchedKeywords} variant="matched" empty="No matching keywords found." />
        <KeywordSection title="✕ Missing Keywords" keywords={missingKeywords} variant="missing" empty="No missing keywords — great coverage!" />
      </div>

      {/* Basic suggestions */}
      {suggestions?.length > 0 && (
        <div className={styles.suggestions}>
          <h3 className={styles.sectionTitle}><span className={styles.sectionIcon}>💡</span> Quick Suggestions</h3>
          <ul className={styles.suggList}>
            {suggestions.map((s, i) => (
              <li key={i} className={styles.suggItem}>
                <span className={styles.suggBullet}>{i + 1}</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ATS Report */}
      {atsChecks?.length > 0 && (
        <ATSReport
          atsScore={atsScore}
          atsSummary={atsSummary}
          atsChecks={atsChecks}
          wordCount={wordCount}
        />
      )}

      {/* AI Suggestions */}
      <AISuggestions suggestions={aiSuggestions} error={aiError} />
    </div>
  );
}

function KeywordSection({ title, keywords, variant, empty }) {
  return (
    <div className={styles.kwSection}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {keywords?.length === 0 ? (
        <p className="text-muted">{empty}</p>
      ) : (
        <div className={styles.pills}>
          {keywords?.map((kw, i) => (
            <span key={i} className={`kw-pill kw-pill-${variant}`}>{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}
