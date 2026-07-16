import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './LandingPage.module.css';

const features = [
  {
    icon: '📄',
    title: 'Resume Analysis',
    desc: 'Upload your resume and a job description to get an instant match score with keyword breakdown.',
  },
  {
    icon: '🎯',
    title: 'Smart Scoring',
    desc: 'Our NLP engine extracts and compares skills, tools, and technologies from both documents.',
  },
  {
    icon: '💡',
    title: 'Tailored Suggestions',
    desc: 'Get actionable, grouped recommendations to improve your resume for each specific role.',
  },
  {
    icon: '🏆',
    title: 'Candidate Ranking',
    desc: 'Recruiters can upload multiple resumes and get an instant ranked shortlist for any job.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  const showCandidate = !user || user.role === 'candidate';
  const showBuilder = !user || user.role === 'candidate';
  const showRecruiter = !user || user.role === 'recruiter';

  const visibleCardsCount = (showCandidate ? 1 : 0) + (showBuilder ? 1 : 0) + (showRecruiter ? 1 : 0);

  const getRolesClassName = () => {
    if (visibleCardsCount === 2) return `${styles.roles} ${styles.roles_2cols}`;
    if (visibleCardsCount === 1) return `${styles.roles} ${styles.roles_1col}`;
    return styles.roles;
  };

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Smart hiring, powered by NLP</div>
        <h1 className={styles.heroTitle}>
          Match the right talent<br />to the right role
        </h1>
        <p className={styles.heroSub}>
          HireFlow helps candidates tailor their resumes and helps recruiters
          rank applicants — all powered by a shared intelligent scoring engine.
        </p>
        <div className={styles.heroCta}>
          {user ? (
            <Link to={user.role === 'recruiter' ? '/recruiter' : '/candidate'} className="btn btn-primary btn-lg">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get started free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Role cards */}
      <section className={getRolesClassName()}>
        {showCandidate && (
          <RoleCard
            emoji="👤"
            title="For Candidates"
            color="green"
            items={[
              'Upload your resume (PDF or DOCX)',
              'Paste any job description',
              'Get a match score instantly',
              'See missing keywords & suggestions',
            ]}
            cta="Analyze my resume"
            href="/candidate"
          />
        )}
        {showBuilder && (
          <RoleCard
            emoji="📝"
            title="Resume Builder"
            color="green"
            items={[
              'Build professional resumes online',
              'Live A4 preview as you type',
              'Save & load draft configurations',
              'Export to PDF for applications',
            ]}
            cta="Build my resume"
            href="/candidate?tab=builder"
          />
        )}
        {showRecruiter && (
          <RoleCard
            emoji="🏢"
            title="For Recruiters"
            color="green"
            items={[
              'Upload up to 20 resumes at once',
              'Paste the job description',
              'Get candidates ranked by fit',
              'Drill into each candidate\'s gaps',
            ]}
            cta="Rank candidates"
            href="/recruiter"
          />
        )}
      </section>




      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.featureGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RoleCard({ emoji, title, color, items, cta, href }) {
  const { user } = useAuth();
  return (
    <div className={`${styles.roleCard} ${styles[`roleCard_${color}`]}`}>
      <div className={styles.roleEmoji}>{emoji}</div>
      <h2 className={styles.roleTitle}>{title}</h2>
      <ul className={styles.roleList}>
        {items.map((item, i) => (
          <li key={i} className={styles.roleItem}>
            <span className={styles.roleCheck}>✓</span>
            {item}
          </li>
        ))}
      </ul>
      {user && cta && href && (
        <Link to={href} className={`btn btn-primary ${styles.roleCta}`}>{cta}</Link>
      )}
    </div>
  );
}
