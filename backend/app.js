const express = require('express');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
    console.log(`📍 ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// ===== ROUTES =====

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({ 
        message: 'Visitor Management API is running!',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                test: 'GET /api/auth/test'
            },
            visitors: 'GET /api/visitors',
            locations: 'GET /api/locations',
            health: 'GET /api/health'
        },
        timestamp: new Date().toISOString()
    });
});

// ===== AUTH ROUTES =====
app.get('/api/auth/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Auth route is working!',
        timestamp: new Date().toISOString()
    });
});

// POST /api/auth/login - SIMPLE VERSION
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('📨 Login request received:', req.body);
        
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username dan password diperlukan' 
            });
        }

        // HAPUS DATA DUMMY - Simple authentication
        // Hanya validasi dasar, tanpa data dummy
        if (username === 'admin' && password === 'password') {
            const token = 'jwt-token-' + Date.now();
            
            console.log('✅ Login successful for admin');
            
            res.json({
                success: true,
                token: token,
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    full_name: 'Administrator',
                    email: 'admin@example.com'
                }
            });
        } else {
            console.log('❌ Login failed - invalid credentials');
            res.status(401).json({ 
                success: false,
                error: 'Username atau password salah' 
            });
        }

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Terjadi kesalahan server'
        });
    }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Token required' 
            });
        }

        // Simple token verification
        if (token.includes('jwt-token')) {
            res.json({ 
                success: true,
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    full_name: 'Administrator',
                    email: 'admin@example.com'
                }
            });
        } else {
            res.status(401).json({ 
                success: false,
                error: 'Invalid token' 
            });
        }

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// ===== VISITORS MANAGEMENT =====

// GET /api/visitors - Get all visitors
app.get('/api/visitors', async (req, res) => {
    try {
        const { page = 1, limit = 10, location, startDate, endDate } = req.query;
        
        // HAPUS DATA DUMMY - array kosong
        const demoVisitors = [];

        res.json({
            success: true,
            records: demoVisitors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: demoVisitors.length
            }
        });

    } catch (error) {
        console.error('Get visitors error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// POST /api/visitors/manual - Input data pengunjung manual
app.post('/api/visitors/manual', async (req, res) => {
    try {
        console.log('📝 Manual visitor entry:', req.body);
        
        const { locationId, visitorName, maleCount, femaleCount, visitorType, notes } = req.body;

        if (!visitorName) {
            return res.status(400).json({
                success: false,
                error: 'Nama pengunjung diperlukan'
            });
        }

        // Simulasi save ke database
        const newRecord = {
            id: Date.now(),
            record_uuid: 'uuid-' + Date.now(),
            location_name: 'Lokasi ' + locationId,
            location_code: 'LOC' + locationId,
            visitor_name: visitorName,
            male_count: maleCount || 0,
            female_count: femaleCount || 0,
            visitor_type: visitorType || 'domestic',
            check_in_time: new Date(),
            created_by_name: 'System',
            notes: notes || ''
        };

        res.json({
            success: true,
            message: 'Data pengunjung berhasil disimpan',
            record: newRecord
        });

    } catch (error) {
        console.error('Manual entry error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal menyimpan data pengunjung' 
        });
    }
});

// ===== LOCATIONS MANAGEMENT =====

// GET /api/locations - Get all locations
app.get('/api/locations', async (req, res) => {
    try {
        // HAPUS DATA DUMMY - array kosong
        const locations = [];

        res.json({
            success: true,
            locations: locations
        });

    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// POST /api/locations/:id/generate-qr - Generate QR code as Data URL
app.post('/api/locations/:id/generate-qr', async (req, res) => {
    try {
        const locationId = req.params.id;
        
        console.log(`🎯 Generating QR code for location ${locationId}`);

        // HAPUS DATA DUMMY LOKASI
        const location = {
            code: `LOC${locationId}`,
            name: `Lokasi ${locationId}`
        };

        // QR code data
        const qrData = {
            locationId: parseInt(locationId),
            locationCode: location.code,
            name: location.name,
            type: 'visitor_checkin',
            timestamp: Date.now(),
            uuid: 'qr-' + Date.now()
        };

        // Generate QR code as Data URL (base64)
        const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            color: {
                dark: '#1e3c72',
                light: '#FFFFFF'
            },
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H'
        });

        console.log(`✅ QR code generated as Data URL for ${location.name}`);

        res.json({
            success: true,
            message: 'QR code berhasil digenerate',
            qrCodeDataURL: qrDataURL,
            locationId: locationId,
            locationName: location.name,
            locationCode: location.code
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal generate QR code: ' + error.message
        });
    }
});

// ===== STATISTICS =====

// GET /api/visitors/stats/daily - Stats harian
app.get('/api/visitors/stats/daily', async (req, res) => {
    try {
        // HAPUS DATA DUMMY - array kosong
        const demoStats = [];
        
        res.json({
            success: true,
            date: new Date().toISOString().split('T')[0],
            statistics: demoStats
        });

    } catch (error) {
        console.error('Daily stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// GET /api/visitors/stats/monthly - Stats bulanan
app.get('/api/visitors/stats/monthly', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        // HAPUS DATA DUMMY - data kosong
        const demoStats = {
            year: currentYear,
            total_visitors: 0,
            total_locations: 0,
            monthly_data: Array.from({ length: 12 }, (_, i) => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                return {
                    month: monthNames[i],
                    visitors: 0
                };
            })
        };
        
        res.json({
            success: true,
            statistics: demoStats
        });

    } catch (error) {
        console.error('Monthly stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// GET /api/visitors/stats/yearly - Stats tahunan
app.get('/api/visitors/stats/yearly', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        // HAPUS DATA DUMMY - data kosong
        const demoStats = {
            year: currentYear,
            total_visitors: 0,
            total_locations: 0,
            monthly_data: Array.from({ length: 12 }, (_, i) => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                return {
                    month: monthNames[i],
                    visitors: 0
                };
            })
        };
        
        res.json({
            success: true,
            statistics: demoStats
        });

    } catch (error) {
        console.error('Yearly stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// GET /api/notifications - Get notifications
app.get('/api/notifications', async (req, res) => {
    try {
        // HAPUS DATA DUMMY - hanya notifikasi sistem
        const notifications = [
            {
                id: 1,
                title: 'Sistem VISITOR MANAGEMENT',
                message: 'Sistem siap digunakan. Database kosong, silakan tambah data.',
                type: 'info',
                date: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Belum ada data',
                message: 'Tidak ada data pengunjung yang tercatat',
                type: 'warning',
                date: new Date().toISOString()
            }
        ];
        
        res.json({
            success: true,
            notifications: notifications
        });

    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Visitor Management System Backend',
        version: '1.0.0',
        documentation: 'Visit /api for API information'
    });
});

// Custom 404 handler for API routes
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ 
            success: false,
            error: 'API endpoint not found',
            path: req.originalUrl,
            method: req.method,
            available_endpoints: [
                'GET  /api/health',
                'GET  /api',
                'GET  /api/auth/test',
                'POST /api/auth/login', 
                'GET  /api/auth/me',
                'GET  /api/visitors',
                'POST /api/visitors/manual',
                'GET  /api/visitors/stats/daily',
                'GET  /api/visitors/stats/monthly',
                'GET  /api/visitors/stats/yearly',
                'GET  /api/locations',
                'POST /api/locations/:id/generate-qr',
                'GET  /api/notifications'
            ]
        });
    } else {
        next();
    }
});

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🚨 Error:', err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Something went wrong!',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth Test: http://localhost:${PORT}/api/auth/test`);
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   👤 Admin: username=admin, password=password');
    console.log('   👤 Operator: Tidak tersedia - hanya admin saja');
});