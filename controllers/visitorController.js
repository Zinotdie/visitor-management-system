const Visitor = require('../models/Visitor');

const visitorController = {
    // GET /api/visitors - Get all visitors
    getAllVisitors: async (req, res) => {
        try {
            const filters = req.query;
            const result = await Visitor.findAll(filters);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Get visitors error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    },

    // GET /api/visitors/:id - Get visitor by ID
    getVisitorById: async (req, res) => {
        try {
            const visitor = await Visitor.findById(req.params.id);
            
            if (!visitor) {
                return res.status(404).json({
                    success: false,
                    error: 'Data pengunjung tidak ditemukan'
                });
            }

            res.json({
                success: true,
                data: visitor
            });
        } catch (error) {
            console.error('Get visitor error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    },

    // POST /api/visitors - Create new visitor
    createVisitor: async (req, res) => {
        try {
            const visitorData = {
                ...req.body,
                created_by: req.user?.id || 1
            };

            const visitor = await Visitor.create(visitorData);
            
            res.status(201).json({
                success: true,
                message: 'Data pengunjung berhasil disimpan',
                data: visitor
            });
        } catch (error) {
            console.error('Create visitor error:', error);
            
            if (error.message === 'Lokasi tidak ditemukan') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Gagal menyimpan data pengunjung: ' + error.message
            });
        }
    },

    // PUT /api/visitors/:id - Update visitor
    updateVisitor: async (req, res) => {
        try {
            const visitor = await Visitor.findById(req.params.id);
            
            if (!visitor) {
                return res.status(404).json({
                    success: false,
                    error: 'Data pengunjung tidak ditemukan'
                });
            }

            const updatedVisitor = await Visitor.update(req.params.id, req.body);
            
            res.json({
                success: true,
                message: 'Data pengunjung berhasil diupdate',
                data: updatedVisitor
            });
        } catch (error) {
            console.error('Update visitor error:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengupdate data pengunjung: ' + error.message
            });
        }
    },

    // DELETE /api/visitors/:id - Delete visitor
    deleteVisitor: async (req, res) => {
        try {
            const visitor = await Visitor.findById(req.params.id);
            
            if (!visitor) {
                return res.status(404).json({
                    success: false,
                    error: 'Data pengunjung tidak ditemukan'
                });
            }

            await Visitor.delete(req.params.id);
            
            res.json({
                success: true,
                message: 'Data pengunjung berhasil dihapus'
            });
        } catch (error) {
            console.error('Delete visitor error:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menghapus data pengunjung: ' + error.message
            });
        }
    },

    // POST /api/visitors/qr - Create visitor from QR form
    createVisitorFromQR: async (req, res) => {
        try {
            const { location_code, form_type, visitor_name, group_name, ...otherData } = req.body;

            if (!location_code || !form_type) {
                return res.status(400).json({
                    success: false,
                    error: 'Location code dan form type diperlukan'
                });
            }

            let final_visitor_name = visitor_name;
            if (form_type === 'group' && group_name) {
                final_visitor_name = group_name;
            }

            let male_count = parseInt(otherData.male_count) || 0;
            let female_count = parseInt(otherData.female_count) || 0;
            
            if (form_type === 'individual') {
                if (otherData.gender === 'male') {
                    male_count = 1;
                    female_count = 0;
                } else if (otherData.gender === 'female') {
                    male_count = 0;
                    female_count = 1;
                }
            }

            let visitor_type = 'domestic';
            if (form_type === 'foreign') {
                visitor_type = 'international';
            }

            let notes = otherData.notes || '';
            if (form_type === 'individual' && otherData.identity_number) {
                notes += ` NIK: ${otherData.identity_number}`;
            }
            if (form_type === 'foreign' && otherData.passport_number) {
                notes += ` Passport: ${otherData.passport_number}`;
            }

            const visitorData = {
                location_code,
                visitor_name: final_visitor_name,
                male_count,
                female_count,
                visitor_type,
                notes: notes.trim(),
                created_by: 1
            };

            const visitor = await Visitor.create(visitorData);
            
            res.status(201).json({
                success: true,
                message: 'Data pengunjung berhasil disimpan via QR',
                data: {
                    id: visitor.id,
                    location_code,
                    form_type
                }
            });
        } catch (error) {
            console.error('Create QR visitor error:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal menyimpan data pengunjung: ' + error.message
            });
        }
    },

    // GET /api/visitors/stats/daily - Daily statistics
    getDailyStats: async (req, res) => {
        try {
            const { date, location } = req.query;
            const result = await Visitor.getDailyStats(date, location);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Daily stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    },

    // GET /api/visitors/stats/monthly - Monthly statistics
    getMonthlyStats: async (req, res) => {
        try {
            const { year, location } = req.query;
            const result = await Visitor.getMonthlyStats(year, location);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Monthly stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    }
};

module.exports = visitorController;