const path = require('path');
const Document = require('../models/Document');
const ClearanceRecord = require('../models/ClearanceRecord');
const { analyseDocument } = require('../services/forensic.service');
const { resolveForensicResult } = require('../utils/xai.util');
const { sendClearanceEmail } = require('../services/email.service');

const ALL_DOC_TYPES = ['school_fees', 'departmental', 'sug', 'medical', 'library'];

// ─── UPLOAD & ANALYSE DOCUMENT ────────────────────────────────────────────────
const uploadDocument = async (req, res) => {
  try {
    const { doc_type } = req.body;

    if (!doc_type || !ALL_DOC_TYPES.includes(doc_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid document type. Must be one of: ${ALL_DOC_TYPES.join(', ')}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const studentId = req.student._id;

    // Upsert: replace existing doc of same type if it exists
    let doc = await Document.findOneAndUpdate(
      { student_id: studentId, doc_type },
      {
        file_path: req.file.path,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        status: 'processing',
        forensic_report: null,
        xai_message: null,
        upload_time: new Date(),
        verified_at: null,
      },
      { upsert: true, new: true }
    );

    // Trigger Python forensic microservice asynchronously
    // (don't await — respond immediately, let frontend poll for status)
    runForensicAnalysis(doc._id, req.file.path, req.student.matric_no, doc_type);

    return res.status(202).json({
      success: true,
      message: 'Document uploaded. Forensic analysis started.',
      document: {
        id: doc._id,
        doc_type: doc.doc_type,
        status: doc.status,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
};

// Runs in background — updates document record when forensic result arrives
const runForensicAnalysis = async (docId, filePath, matricNo, docType) => {
  try {
    const { success, report } = await analyseDocument({ filePath, matricNo, docType });

    if (!success || !report) {
      await Document.findByIdAndUpdate(docId, {
        status: 'pending',
        xai_message: 'Forensic analysis could not be completed. Please try re-uploading.',
      });
      return;
    }

    const { status, xai_message } = resolveForensicResult(report);

    await Document.findByIdAndUpdate(docId, {
      status,
      forensic_report: report,
      xai_message,
      verified_at: status === 'authenticated' ? new Date() : null,
    });
  } catch (err) {
    console.error('Background forensic analysis error:', err);
    await Document.findByIdAndUpdate(docId, {
      status: 'pending',
      xai_message: 'An error occurred during verification. Please try re-uploading.',
    });
  }
};

// ─── GET DOCUMENT STATUSES (for dashboard) ────────────────────────────────────
const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ student_id: req.student._id }).select(
      'doc_type status xai_message upload_time verified_at'
    );

    // Return a full status map for all 5 types, even unsubmitted ones
    const statusMap = ALL_DOC_TYPES.map((type) => {
      const doc = docs.find((d) => d.doc_type === type);
      return {
        doc_type: type,
        status: doc ? doc.status : 'not_uploaded',
        xai_message: doc ? doc.xai_message : null,
        upload_time: doc ? doc.upload_time : null,
        verified_at: doc ? doc.verified_at : null,
      };
    });

    const authenticatedCount = statusMap.filter((d) => d.status === 'authenticated').length;

    return res.status(200).json({
      success: true,
      documents: statusMap,
      authenticated_count: authenticatedCount,
      total_required: ALL_DOC_TYPES.length,
      all_cleared: authenticatedCount === ALL_DOC_TYPES.length,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch document statuses.' });
  }
};

// ─── FINALIZE CLEARANCE ───────────────────────────────────────────────────────
const finalizeClearance = async (req, res) => {
  try {
    const studentId = req.student._id;

    // Verify all 5 documents are authenticated
    const docs = await Document.find({ student_id: studentId });

    const authenticatedTypes = docs
      .filter((d) => d.status === 'authenticated')
      .map((d) => d.doc_type);

    const missing = ALL_DOC_TYPES.filter((t) => !authenticatedTypes.includes(t));

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Not all documents are verified. The following are still pending or flagged: ${missing.join(', ')}.`,
      });
    }

// Check if already cleared
const existing = await ClearanceRecord.findOne({ student_id: studentId });
if (existing && existing.overall_status === 'cleared') {
  // If the email failed previously, retry it now instead of just confirming
  if (!existing.email_sent) {
    try {
      await sendClearanceEmail({
        to: req.student.email,
        studentName: req.student.full_name,
        matricNo: req.student.matric_no,
        department: req.student.department,
      });
      existing.email_sent = true;
      existing.email_sent_at = new Date();
      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'You are already cleared. The confirmation email has now been sent successfully.',
        email_sent: true,
        already_cleared: true,
      });
    } catch (emailErr) {
      console.error('Retry clearance email failed:', emailErr.message);
      return res.status(200).json({
        success: true,
        message: 'You are already cleared, but we could not send the confirmation email. Please contact Student Affairs.',
        email_sent: false,
        already_cleared: true,
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: 'You have already been cleared. Check your email for the clearance confirmation.',
    email_sent: true,
    already_cleared: true,
  });
}

    // Build documents summary
    const docsSummary = docs.map((d) => ({
      doc_type: d.doc_type,
      status: d.status,
      verified_at: d.verified_at,
    }));

    // Create or update clearance record
    const clearanceRecord = await ClearanceRecord.findOneAndUpdate(
      { student_id: studentId },
      {
        overall_status: 'cleared',
        documents_summary: docsSummary,
        cleared_at: new Date(),
        email_sent: false,
      },
      { upsert: true, new: true }
    );

    // Send clearance email
    try {
      await sendClearanceEmail({
        to: req.student.email,
        studentName: req.student.full_name,
        matricNo: req.student.matric_no,
        department: req.student.department,
      });

      clearanceRecord.email_sent = true;
      clearanceRecord.email_sent_at = new Date();
      await clearanceRecord.save();
    } catch (emailErr) {
      console.error('Clearance email failed:', emailErr.message);
      // Don't fail the whole request — clearance is still recorded
    }

    return res.status(200).json({
      success: true,
      message: clearanceRecord.email_sent
        ? 'Congratulations! You have successfully completed your final year clearance. A confirmation has been sent to your email.'
        : 'Congratulations! You have successfully completed your final year clearance. However, we could not send the confirmation email — please check with the Student Affairs office.',
      email_sent: clearanceRecord.email_sent,
      cleared_at: clearanceRecord.cleared_at,
    });
  } catch (error) {
    console.error('Finalize clearance error:', error);
    return res.status(500).json({ success: false, message: 'Server error during finalization.' });
  }
};

module.exports = { uploadDocument, getMyDocuments, finalizeClearance };
