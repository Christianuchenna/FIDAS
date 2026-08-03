const mongoose = require('mongoose');

const DOC_TYPES = ['school_fees', 'departmental', 'sug', 'medical', 'library'];
const DOC_STATUSES = ['pending', 'processing', 'authenticated', 'flagged', 'rejected'];

const forensicReportSchema = new mongoose.Schema(
  {
    // Layer 1 — Metadata
    provenance_flag: { type: Boolean, default: false },
    detected_software: { type: String, default: null },

    // Layer 2 — ELA
    ela_variance_score: { type: Number, default: null },
    ela_flagged: { type: Boolean, default: false },

    // Layer 3 — OCR
    ocr_rrr_number: { type: String, default: null },
    ocr_amount: { type: String, default: null },
    ocr_student_name: { type: String, default: null },
    ocr_date: { type: String, default: null },

    // DB cross-reference results
    db_existence: { type: Boolean, default: null },
    db_ownership: { type: Boolean, default: null },
    db_value_match: { type: Boolean, default: null },
    // Document type verification
    detected_doc_type: { type: String, default: null },
    doc_type_mismatch: { type: Boolean, default: false },

    // Overall composite score (0–1)
    tamper_score: { type: Number, default: null },

    // Image quality
    laplacian_variance: { type: Number, default: null },
    low_quality_flag: { type: Boolean, default: false },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    doc_type: {
      type: String,
      enum: DOC_TYPES,
      required: [true, 'Document type is required'],
    },
    file_path: {
      type: String,
      required: true,
    },
    original_filename: {
      type: String,
    },
    file_size: {
      type: Number, // bytes
    },
    mime_type: {
      type: String,
    },
    status: {
      type: String,
      enum: DOC_STATUSES,
      default: 'pending',
    },
    forensic_report: {
      type: forensicReportSchema,
      default: null,
    },
    // XAI plain-language message shown to student
    xai_message: {
      type: String,
      default: null,
    },
    upload_time: {
      type: Date,
      default: Date.now,
    },
    verified_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// A student can only have one document of each type at a time
documentSchema.index({ student_id: 1, doc_type: 1 }, { unique: true });

module.exports = mongoose.model('Document', documentSchema);
module.exports.DOC_TYPES = DOC_TYPES;
