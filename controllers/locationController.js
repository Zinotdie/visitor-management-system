const Location = require('../models/Location');
const QRCode = require('qrcode');

const locationController = {
    // GET /api/locations - Get all locations
    getAllLocations: async (req, res) => {
        try {
            const locations = await Location.findAll();
            
            res.json({
                success: true,
                data: locations
            });
        } catch (error) {
            console.error('Get locations error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    },

    // GET /api/locations/:id - Get location by ID
    getLocationById: async (req, res) => {
        try {
            const location = await Location.findById(req.params.id);
            
            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'Lokasi tidak ditemukan'
                });
            }

            res.json({
                success: true,
                data: location
            });
        } catch (error) {
            console.error('Get location error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    },

    // POST /api/locations - Create location
    createLocation: async (req, res) => {
        try {
            const location = await Location.create(req.body);
            
            res.status(201).json({
                success: true,
                message: 'Lokasi berhasil dibuat',
                data: location
            });
        } catch (error) {
            console.error('Create location error:', error);
            
            if (error.message === 'Location code sudah digunakan') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Gagal membuat lokasi: ' + error.message
            });
        }
    },

    // PUT /api/locations/:id - Update location
    updateLocation: async (req, res) => {
        try {
            const location = await Location.findById(req.params.id);
            
            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'Lokasi tidak ditemukan'
                });
            }

            const updatedLocation = await Location.update(req.params.id, req.body);
            
            res.json({
                success: true,
                message: 'Lokasi berhasil diupdate',
                data: updatedLocation
            });
        } catch (error) {
            console.error('Update location error:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengupdate lokasi: ' + error.message
            });
        }
    },

    // DELETE /api/locations/:id - Delete location
    deleteLocation: async (req, res) => {
        try {
            const location = await Location.findById(req.params.id);
            
            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'Lokasi tidak ditemukan'
                });
            }

            await Location.delete(req.params.id);
            
            res.json({
                success: true,
                message: 'Lokasi berhasil dihapus'
            });
        } catch (error) {
            console.error('Delete location error:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus lokasi: ' + error.message
            });
        }
    },

    // POST /api/locations/:id/generate-qr - Generate QR code
    generateQRCode: async (req, res) => {
        try {
            const location = await Location.findById(req.params.id);
            
            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'Location not found'
                });
            }

            const qrData = {
                locationId: location.id,
                locationCode: location.location_code,
                name: location.name,
                baseUrl: `${req.protocol}://${req.get('host')}`,
                timestamp: Date.now()
            };

            const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
                color: {
                    dark: '#1e3c72',
                    light: '#FFFFFF'
                },
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H'
            });

            res.json({
                success: true,
                message: 'QR code berhasil digenerate',
                qrCodeDataURL: qrDataURL,
                location: {
                    id: location.id,
                    name: location.name,
                    code: location.location_code
                }
            });
        } catch (error) {
            console.error('QR generation error:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal generate QR code: ' + error.message
            });
        }
    }
};

module.exports = locationController;