const router = require('express').Router();
const { auth } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Analytics endpoints
router.get('/dashboard', auth, analyticsController.getDashboard);
router.get('/contacts', auth, analyticsController.getContacts);
router.get('/campaigns', auth, analyticsController.getCampaigns);
router.get('/projects', auth, analyticsController.getProjects);
router.get('/best-times', auth, analyticsController.getBestTimes);
router.get('/export', auth, analyticsController.exportAnalytics);

module.exports = router;