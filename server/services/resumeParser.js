const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extract plain text from PDF or DOCX buffer.
 * @param {Buffer} buffer   - file content
 * @param {string} filename - original filename (used to detect type)
 * @returns {Promise<string>} extracted text
 */
async function extractText(buffer, filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    try {
      const data = await pdfParse(buffer);
      if (!data.text || data.text.trim().length < 50) {
        throw new Error('PDF appears to be scanned or image-based. Text extraction returned minimal content.');
      }
      return data.text;
    } catch (err) {
      throw new Error(`PDF parsing failed: ${err.message}`);
    }
  }

  if (ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.messages.length) {
        console.warn('Mammoth warnings:', result.messages);
      }
      return result.value;
    } catch (err) {
      throw new Error(`DOCX parsing failed: ${err.message}`);
    }
  }

  throw new Error(`Unsupported file type: ${ext}. Please upload a PDF or DOCX.`);
}

module.exports = { extractText };
