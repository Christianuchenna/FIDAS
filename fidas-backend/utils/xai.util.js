/**
 * XAI Mapping Logic
 * Translates forensic flags from the Python microservice
 * into plain-English messages shown on the student dashboard.
 */

const XAI_MESSAGES = {
  LOW_QUALITY:
    'Your document image is too blurry or low resolution. Please retake the photo or upload the original digital file.',

  METADATA_EDITING_SOFTWARE:
    'Security alert: This file contains traces of image editing software (e.g. Photoshop, Canva). Please upload the original unedited document.',

  METADATA_NO_PROVENANCE:
    'This file has no verifiable origin data. Please upload the original file directly from your device or scanner.',

  ELA_PIXEL_TAMPERING:
    'Verification failed: Pixel-level inconsistencies were detected in your document. This may indicate the image has been digitally altered. Please upload the original.',

  OCR_RRR_NOT_FOUND:
    'The payment reference number on this document could not be found in the university\'s financial records. Please verify you uploaded the correct receipt.',

  OCR_OWNERSHIP_MISMATCH:
    'The registration number on this document does not match your account. Please ensure you upload your own receipt.',

  OCR_VALUE_MISMATCH:
    'The payment amount on this document does not match the amount in the university\'s records. Please upload the original unaltered receipt.',

  OCR_EXTRACTION_FAILED:
    'We could not read the text on your document clearly. Please upload a clearer image or the original PDF.',

  AUTHENTICATED:
    'Document verified successfully. All forensic checks passed.',

    DOC_TYPE_MISMATCH: (docType) => {
      const labels = {
        school_fees: 'School Fees',
        departmental: 'Departmental Dues',
        sug: 'SUG',
        medical: 'Medical',
        library: 'Library',
      };
      return `This does not appear to be the correct document. Please upload only your ${labels[docType] || docType} receipt in this slot.`;
    },
  };
/**
 * Determine the XAI message and final status from a forensic report.
 * Returns { status, xai_message }
 */
const resolveForensicResult = (report) => {
  // Step 1: Image quality gate
  if (report.low_quality_flag) {
    return { status: 'rejected', xai_message: XAI_MESSAGES.LOW_QUALITY };
  }

  // Step 2: Metadata provenance gate
  if (report.provenance_flag) {
    if (report.detected_software) {
      return {
        status: 'flagged',
        xai_message: XAI_MESSAGES.METADATA_EDITING_SOFTWARE,
      };
    }
    return {
      status: 'flagged',
      xai_message: XAI_MESSAGES.METADATA_NO_PROVENANCE,
    };
  }

  // Step 3: ELA pixel forensics gate
  if (report.ela_flagged) {
    return { status: 'flagged', xai_message: XAI_MESSAGES.ELA_PIXEL_TAMPERING };
  }
// Step 3.5: Document type verification
if (report.doc_type_mismatch) {
  return { status: 'flagged', xai_message: XAI_MESSAGES.DOC_TYPE_MISMATCH(report.doc_type) };
}

  // Step 4: OCR + DB cross-reference gates
  if (report.db_existence === false) {
    return { status: 'flagged', xai_message: XAI_MESSAGES.OCR_RRR_NOT_FOUND };
  }
  if (report.db_ownership === false) {
    return {
      status: 'flagged',
      xai_message: XAI_MESSAGES.OCR_OWNERSHIP_MISMATCH,
    };
  }
  if (report.ocr_rrr_number === null && report.db_existence === null) {
    return {
      status: 'flagged',
      xai_message: XAI_MESSAGES.OCR_EXTRACTION_FAILED,
    };
  }

  // All layers passed
  return { status: 'authenticated', xai_message: XAI_MESSAGES.AUTHENTICATED };
};

module.exports = { resolveForensicResult, XAI_MESSAGES };