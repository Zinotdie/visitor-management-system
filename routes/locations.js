const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const locationController = require('../controllers/locationController');

const router = express.Router();

router.get('/', authenticateToken, locationController.getAllLocations);
router.post('/', authenticateToken, authorizeRoles('admin'), locationController.createLocation);
router.get('/:id', authenticateToken, locationController.getLocationById);
router.put('/:id', authenticateToken, authorizeRoles('admin'), locationController.updateLocation);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), locationController.deleteLocation);
router.post('/:id/generate-qr', authenticateToken, authorizeRoles('admin'), locationController.generateQRCode);

module.exports = router;