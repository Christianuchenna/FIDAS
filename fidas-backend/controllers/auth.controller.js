const crypto = require('crypto');
const Student = require('../models/Student');
const { generateToken } = require('../utils/token.util');
const { sendPasswordResetEmail } = require('../services/email.service');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { full_name, matric_no, department, email, password, confirm_password } = req.body;

    // Basic field validation
    if (!full_name || !matric_no || !department || !email || !password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Registration year check — first 4 numeric digits must be ≤ 2021
    const digits = matric_no.replace(/\D/g, '');
    const year = parseInt(digits.substring(0, 4), 10);
    if (year > 2021) {
      return res.status(403).json({
        success: false,
        message: `Only final-year students (registration year 2021 or earlier) can register. Your registration year appears to be ${year}.`,
      });
    }

    // Check for duplicates
    const existingEmail = await Student.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const existingMatric = await Student.findOne({ matric_no });
    if (existingMatric) {
      return res.status(409).json({ success: false, message: 'An account with this registration number already exists.' });
    }

    // Create student (password will be hashed by pre-save hook)
    const student = await Student.create({
      full_name,
      matric_no,
      department,
      email: email.toLowerCase(),
      password_hash: password,
    });

    const token = generateToken(student._id, 'student');

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      student: {
        id: student._id,
        full_name: student.full_name,
        matric_no: student.matric_no,
        department: student.department,
        email: student.email,
      },
    });
  } catch (error) {
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Explicitly include password_hash (it has select: false on the model)
    const student = await Student.findOne({ email: email.toLowerCase() }).select('+password_hash');

    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(student._id, 'student');

    // Extract first name for the dashboard welcome message
    const firstName = student.full_name.split(' ')[0];

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      student: {
        id: student._id,
        full_name: student.full_name,
        first_name: firstName,
        matric_no: student.matric_no,
        department: student.department,
        email: student.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });

    // Always respond the same way to prevent email enumeration
    if (!student) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    student.reset_password_token = hashedToken;
    student.reset_password_expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await student.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: student.email,
        studentName: student.full_name.split(' ')[0],
        resetUrl,
      });
    } catch (emailError) {
      // Roll back token if email fails
      student.reset_password_token = undefined;
      student.reset_password_expires = undefined;
      await student.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    if (!password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'Both password fields are required.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const student = await Student.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: Date.now() },
    }).select('+password_hash');

    if (!student) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    student.password_hash = password; // Will be hashed by pre-save hook
    student.reset_password_token = undefined;
    student.reset_password_expires = undefined;
    await student.save();

    return res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── GET LOGGED-IN STUDENT ────────────────────────────────────────────────────
const getMe = async (req, res) => {
  return res.status(200).json({ success: true, student: req.student });
};

// ─── UPDATE PROFILE ────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { full_name, email, department, matric_no } = req.body;
    const studentId = req.student._id;

    const updates = {};

    if (full_name) updates.full_name = full_name;
    if (department) updates.department = department;

    if (email && email.toLowerCase() !== req.student.email) {
      const existingEmail = await Student.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'This email is already in use by another account.' });
      }
      updates.email = email.toLowerCase();
    }

    if (matric_no && matric_no !== req.student.matric_no) {
      const digits = matric_no.replace(/\D/g, '');
      const year = parseInt(digits.substring(0, 4), 10);
      if (year > 2021) {
        return res.status(403).json({
          success: false,
          message: `Only final-year students (registration year 2021 or earlier) are eligible. Your registration year appears to be ${year}.`,
        });
      }
      const existingMatric = await Student.findOne({ matric_no });
      if (existingMatric) {
        return res.status(409).json({ success: false, message: 'This registration number is already in use by another account.' });
      }
      updates.matric_no = matric_no;
    }

    const updated = await Student.findByIdAndUpdate(studentId, updates, {
      new: true,
      runValidators: true,
    }).select('-password_hash');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      student: updated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── CHANGE PASSWORD ───────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_new_password } = req.body;

    if (!current_password || !new_password || !confirm_new_password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (new_password !== confirm_new_password) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const student = await Student.findById(req.student._id).select('+password_hash');

    const isMatch = await student.comparePassword(current_password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    student.password_hash = new_password; // Hashed automatically by pre-save hook
    await student.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, getMe, updateProfile, changePassword };
