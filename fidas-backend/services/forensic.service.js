const axios = require('axios');
const path = require('path');

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * Send a document file to the Python forensic microservice.
 * Returns the structured forensic report JSON.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analyseDocument = async ({ filePath, matricNo, docType }) => {
  const MAX_ATTEMPTS = 2; // Reduced — retries queue up behind each other on single-worker gunicorn
  const REQUEST_TIMEOUT = 110000; // 110s — just under gunicorn's own 120s timeout

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(
        `${PYTHON_URL}/analyse`,
        {
          file_path: filePath,
          matric_no: matricNo,
          doc_type: docType,
        },
        { timeout: REQUEST_TIMEOUT }
      );

      return { success: true, report: response.data };
    } catch (error) {
      // Only retry on a genuine connection-level failure (service actually down/cold),
      // never on a timeout — since the previous attempt may still be processing
      // on the single-worker server, and retrying would just queue up behind it.
      const isConnectionFailure =
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.response?.status === 502 ||
        error.response?.status === 503;

      console.error(
        `Forensic microservice error (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        error.message
      );

      if (isConnectionFailure && attempt < MAX_ATTEMPTS) {
        await sleep(15000); // wait for a genuinely down service to wake up
        continue;
      }

      return {
        success: false,
        report: null,
        error: error.message,
      };
    }
  }
};

module.exports = { analyseDocument };
