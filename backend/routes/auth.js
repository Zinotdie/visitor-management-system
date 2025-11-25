const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.get('/test', authController.test);

module.exports = router;