const mongoose = require('mongoose');

const clearanceRecordSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true, // One clearance record per student
    },
    overall_status: {
      type: String,
      enum: ['in_progress', 'cleared'],
      default: 'in_progress',
    },
    // Snapshot of document statuses at clearance time
    documents_summary: [
      {
        doc_type: String,
        status: String,
        verified_at: Date,
      },
    ],
    cleared_at: {
      type: Date,
      default: null,
    },
    admin_note: {
      type: String,
      default: null,
    },
    // Track whether the clearance email + certificate was sent
    email_sent: {
      type: Boolean,
      default: false,
    },
    email_sent_at: {
      type: Date,
      default: null,
    },
    // Reference to the admin who reviewed (if any)
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('ClearanceRecord', clearanceRecordSchema);
