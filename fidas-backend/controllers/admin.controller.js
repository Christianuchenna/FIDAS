const Admin = require('../models/Admin');
const ClearanceRecord = require('../models/ClearanceRecord');
const { generateToken } = require('../utils/token.util');

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password_hash');

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(admin._id, admin.role);

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET ALL CLEARED STUDENTS ─────────────────────────────────────────────────
const getClearedStudents = async (req, res) => {
  try {
    const records = await ClearanceRecord.find({ overall_status: 'cleared' })
      .populate('student_id', 'full_name matric_no department email')
      .sort({ cleared_at: 1 });

    const students = records.map((r) => ({
      clearance_id: r._id,
      full_name: r.student_id?.full_name,
      matric_no: r.student_id?.matric_no,
      department: r.student_id?.department,
      email: r.student_id?.email,
      cleared_at: r.cleared_at,
      email_sent: r.email_sent,
    }));

    return res.status(200).json({
      success: true,
      total_cleared: students.length,
      students,
    });
  } catch (error) {
    console.error('Get cleared students error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cleared students.' });
  }
};

// ─── CREATE ADMIN (protected by secret key) ────────────────────────────────────
const createAdmin = async (req, res) => {
  try {
    const { full_name, email, password, secret } = req.body;

    if (secret !== process.env.ADMIN_REGISTRATION_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid admin registration secret.' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Admin with this email already exists.' });
    }

    const admin = await Admin.create({
      full_name,
      email: email.toLowerCase(),
      password_hash: password,
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created.',
      admin: { id: admin._id, full_name: admin.full_name, email: admin.email },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { adminLogin, getClearedStudents, createAdmin };
