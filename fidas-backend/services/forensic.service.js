const axios = require('axios');
const path = require('path');

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * Send a document file to the Python forensic microservice.
 * Returns the structured forensic report JSON.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analyseDocument = async ({ filePath, matricNo, docType }) => {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(
        `${PYTHON_URL}/analyse`,
        {
          file_path: filePath,
          matric_no: matricNo,
          doc_type: docType,
        },
        { timeout: 45000 } // 45 seconds — enough for a cold-start wake-up
      );

      return { success: true, report: response.data };
    } catch (error) {
      const isColdStartLikely =
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.code === 'ECONNABORTED';

      console.error(
        `Forensic microservice error (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        error.message
      );

      // If this looks like a cold-start issue and we have attempts left, wait and retry
      if (isColdStartLikely && attempt < MAX_ATTEMPTS) {
        await sleep(8000); // give the free instance time to finish waking up
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
