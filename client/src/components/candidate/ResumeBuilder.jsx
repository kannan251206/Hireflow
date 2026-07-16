import styles from './ResumeBuilder.module.css';

export default function ResumeBuilder() {
  return (
    <div className={styles.iframeContainer}>
      <iframe
        src="/resume-builder/index.html"
        title="Resume Builder"
        className={styles.iframe}
      />
    </div>
  );
}
