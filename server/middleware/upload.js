const multer = require('multer');

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage(); // store in memory as Buffer

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed.'), false);
  }
};

// Single file upload (candidate)
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('resume');

// Multiple file upload (recruiter — up to 20 resumes)
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).array('resumes', 20);

// Middleware wrapper with error handling
const handleSingleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const handleMultipleUpload = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = { handleSingleUpload, handleMultipleUpload };
