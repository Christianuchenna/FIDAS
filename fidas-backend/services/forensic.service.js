const axios = require('axios');
const path = require('path');

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * Send a document file to the Python forensic microservice.
 * Returns the structured forensic report JSON.
 */
const analyseDocument = async ({ filePath, matricNo, docType }) => {
  try {
    const response = await axios.post(
      `${PYTHON_URL}/analyse`,
      {
        file_path: path.resolve(filePath),
        matric_no: matricNo,
        doc_type: docType,
      },
      { timeout: 30000 } // 30 second timeout for forensic processing
    );

// console.log(response.data)


    return { success: true, report: response.data };
  } catch (error) {
    // If the Python service is unavailable, return a safe fallback
    console.error('Forensic microservice error:', error.message);
    return {
      success: false,
      report: null,
      error: error.message,
    };
  }
};

module.exports = { analyseDocument };
