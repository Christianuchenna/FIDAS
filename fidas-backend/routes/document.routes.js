const express = require('express');
const router = express.Router();
const { uploadDocument, getMyDocuments, finalizeClearance } = require('../controllers/document.controller');
const { protectStudent } = require('../middleware/auth.middleware');
const { upload, handleUploadError } = require('../middleware/upload.middleware');

// All document routes require student auth
router.use(protectStudent);

router.get('/status', getMyDocuments);
router.post('/upload', upload.single('document'), handleUploadError, uploadDocument);
router.post('/finalize', finalizeClearance);

module.exports = router;
