const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const visitorController = require('../controllers/visitorController');

const router = express.Router();

// Public routes (untuk QR form)
router.post('/qr', visitorController.createVisitorFromQR);

// Protected routes
router.get('/', authenticateToken, visitorController.getAllVisitors);
router.post('/', authenticateToken, visitorController.createVisitor);
router.get('/:id', authenticateToken, visitorController.getVisitorById);
router.put('/:id', authenticateToken, visitorController.updateVisitor);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), visitorController.deleteVisitor);
router.get('/stats/daily', authenticateToken, visitorController.getDailyStats);
router.get('/stats/monthly', authenticateToken, visitorController.getMonthlyStats);

module.exports = router;