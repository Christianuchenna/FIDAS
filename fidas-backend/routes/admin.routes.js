const express = require('express');
const router = express.Router();
const { adminLogin, getClearedStudents, createAdmin } = require('../controllers/admin.controller');
const { protectAdmin } = require('../middleware/auth.middleware');

router.post('/login', adminLogin);
router.post('/create', createAdmin); // Protected by secret key in body

// Protected admin routes
router.get('/cleared-students', protectAdmin, getClearedStudents);

module.exports = router;
