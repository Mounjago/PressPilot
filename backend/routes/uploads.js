const router = require('express').Router();
const { auth } = require('../middleware/auth');
const uploadsController = require('../controllers/uploadsController');

// Upload endpoints with multer middleware (already configured in controller)
router.post('/avatar', auth, uploadsController.avatarUpload, uploadsController.uploadAvatar);
router.post('/cover', auth, uploadsController.coverUpload, uploadsController.uploadCover);
router.post('/attachments', auth, uploadsController.attachmentsUpload, uploadsController.uploadAttachments);
router.post('/audio', auth, uploadsController.audioUpload, uploadsController.uploadAudio);
router.post('/documents', auth, uploadsController.documentUpload, uploadsController.uploadDocument);

// Static routes BEFORE param routes
router.get('/stats', auth, uploadsController.getUploadStats);
router.get('/info/:category/:filename', auth, uploadsController.getFileInfo);
router.get('/list/:category', auth, uploadsController.listFiles);

// Delete
router.delete('/:category/:filename', auth, uploadsController.deleteFile);

module.exports = router;