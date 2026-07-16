import { useDropzone } from 'react-dropzone';
import styles from './FileDropzone.module.css';

export default function FileDropzone({ onDrop, accept, multiple = false, files = [] }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`${styles.zone} ${isDragActive ? styles.active : ''}`}
      >
        <input {...getInputProps()} />
        <div className={styles.icon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V8m0 0l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16.5A3.5 3.5 0 0 0 7.5 20H17a4 4 0 0 0 .8-7.92A6 6 0 1 0 4 16.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {isDragActive ? (
          <p className={styles.hint}>Drop it here…</p>
        ) : (
          <>
            <p className={styles.hint}>
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              PDF or DOCX · max 5 MB{multiple ? ' · up to 20 files' : ''}
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((f, i) => (
            <li key={i} className={styles.fileItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{f.name}</span>
              <span className="text-muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
