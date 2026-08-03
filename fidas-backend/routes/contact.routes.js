const express = require('express');
const router = express.Router();
const { submitContactMessage } = require('../controllers/contact.controller');

// Public route — no login required, anyone on the landing page can use it
router.post('/', submitContactMessage);

module.exports = router;