const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, getMe, updateProfile, changePassword } = require('../controllers/auth.controller');
const { protectStudent } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protectStudent, getMe);
router.patch('/me', protectStudent, updateProfile);
router.patch('/change-password', protectStudent, changePassword);

module.exports = router;