const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    matric_no: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      // Format: 2021/269405  or  2021293925
      validate: {
        validator: function (v) {
          // Extract the first 4 digits (the year portion)
          const digits = v.replace(/\D/g, '');
          const year = parseInt(digits.substring(0, 4), 10);
          return year <= 2021;
        },
        message:
          'Only final-year students (registration year 2021 or earlier) can register.',
      },
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
    },
    password_hash: {
      type: String,
      required: true,
      select: false, // Never returned in queries by default
    },
    // Password reset
    reset_password_token: { type: String, select: false },
    reset_password_expires: { type: Date, select: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Hash password before saving
studentSchema.pre('save', async function () {
  if (!this.isModified('password_hash')) return;
  const salt = await bcrypt.genSalt(
    parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12
  );
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Method to compare passwords
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('Student', studentSchema);
