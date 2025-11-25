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

        // SIMPLE AUTHENTICATION - tanpa database
        if (username === 'admin' && password === 'password') {
            const token = 'demo-jwt-token-' + Date.now();
            
            console.log('✅ Login successful for admin');
            
            res.json({
                success: true,
                token: token,
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    full_name: 'Administrator DISBUDPORAPAR',
                    email: 'admin@disbudpar.go.id'
                }
            });
        } else if (username === 'operator' && password === 'password') {
            const token = 'demo-jwt-token-' + Date.now();
            
            console.log('✅ Login successful for operator');
            
            res.json({
                success: true,
                token: token,
                user: {
                    id: 2,
                    username: 'operator',
                    role: 'uptd_head',
                    full_name: 'Operator UPTD',
                    email: 'operator@disbudpar.go.id'
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

        // Simple token verification for demo
        if (token.includes('demo-jwt-token')) {
            res.json({ 
                success: true,
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    full_name: 'Administrator DISBUDPORAPAR',
                    email: 'admin@disbudpar.go.id'
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

// GET /api/visitors - Get all visitors dengan pagination
app.get('/api/visitors', async (req, res) => {
    try {
        const { page = 1, limit = 10, location, startDate, endDate } = req.query;
        
        // Data dummy untuk demo
        const demoVisitors = [
            {
                id: 1,
                record_uuid: 'uuid-1',
                location_name: 'Gallery Bungas',
                location_code: 'GB',
                visitor_name: 'Grup Sekolah SMA 1',
                male_count: 5,
                female_count: 3,
                visitor_type: 'domestic',
                check_in_time: new Date('2024-01-05T08:30:00Z'),
                created_by_name: 'Operator UPTD',
                notes: 'Rombongan studi wisata'
            },
            {
                id: 2,
                record_uuid: 'uuid-2', 
                location_name: 'PIP',
                location_code: 'PIP',
                visitor_name: 'Keluarga Budi',
                male_count: 2,
                female_count: 2,
                visitor_type: 'domestic',
                check_in_time: new Date('2024-01-05T10:15:00Z'),
                created_by_name: 'Operator UPTD',
                notes: 'Keluarga dengan 2 anak'
            },
            {
                id: 3,
                record_uuid: 'uuid-3',
                location_name: 'Rumah Anno',
                location_code: 'RA',
                visitor_name: 'Turis Jepang',
                male_count: 1,
                female_count: 1, 
                visitor_type: 'international',
                check_in_time: new Date('2024-01-04T14:20:00Z'),
                created_by_name: 'Administrator',
                notes: 'Turis asal Tokyo'
            }
        ];

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

        // Simulasi save ke database
        const newRecord = {
            id: Date.now(),
            record_uuid: 'uuid-' + Date.now(),
            location_name: 'Gallery Bungas', // Hardcode untuk demo
            location_code: 'GB',
            visitor_name: visitorName,
            male_count: maleCount || 0,
            female_count: femaleCount || 0,
            visitor_type: visitorType || 'domestic',
            check_in_time: new Date(),
            created_by_name: 'System',
            notes: notes
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
        const locations = [
            {
                id: 1,
                location_code: 'GB',
                name: 'Gallery Bungas',
                address: 'Jl. Gallery Bungas No. 123',
                qr_code_path: null,
                is_active: true
            },
            {
                id: 2,
                location_code: 'PIP',
                name: 'PIP', 
                address: 'Jl. PIP No. 456',
                qr_code_path: null,
                is_active: true
            },
            {
                id: 3,
                location_code: 'RA',
                name: 'Rumah Anno',
                address: 'Jl. Rumah Anno No. 789',
                qr_code_path: null,
                is_active: true
            }
        ];

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
        
        // Get location data
        const locations = {
            1: { code: 'GB', name: 'Gallery Bungas' },
            2: { code: 'PIP', name: 'PIP' },
            3: { code: 'RA', name: 'Rumah Anno' }
        };
        
        const location = locations[locationId];
        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }

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
                dark: '#1e3c72', // Warna biru DISBUDPORAPAR
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
            qrCodeDataURL: qrDataURL, // Kirim sebagai data URL
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
        const demoStats = [
            {
                location_code: 'GB',
                location_name: 'Gallery Bungas',
                total_visits: 15,
                total_male: 8,
                total_female: 7,
                total_visitors: 15,
                international_visits: 2
            },
            {
                location_code: 'PIP',
                location_name: 'PIP',
                total_visits: 10,
                total_male: 5,
                total_female: 5,
                total_visitors: 10,
                international_visits: 1
            },
            {
                location_code: 'RA',
                location_name: 'Rumah Anno',
                total_visits: 8,
                total_male: 4,
                total_female: 4,
                total_visitors: 8,
                international_visits: 0
            }
        ];
        
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
        const demoStats = {
            year: currentYear,
            total_visitors: 1256,
            total_locations: 3,
            monthly_data: [
                { month: 'Jan', visitors: 89 },
                { month: 'Feb', visitors: 102 },
                { month: 'Mar', visitors: 145 },
                { month: 'Apr', visitors: 98 },
                { month: 'Mei', visitors: 156 },
                { month: 'Jun', visitors: 203 },
                { month: 'Jul', visitors: 187 },
                { month: 'Ags', visitors: 165 },
                { month: 'Sep', visitors: 142 },
                { month: 'Okt', visitors: 3 },
                { month: 'Nov', visitors: 0 },
                { month: 'Des', visitors: 0 }
            ]
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
        const demoStats = {
            year: currentYear,
            total_visitors: 1256,
            total_locations: 3,
            monthly_data: [
                { month: 'Jan', visitors: 89 },
                { month: 'Feb', visitors: 102 },
                { month: 'Mar', visitors: 145 },
                { month: 'Apr', visitors: 98 },
                { month: 'Mei', visitors: 156 },
                { month: 'Jun', visitors: 203 },
                { month: 'Jul', visitors: 187 },
                { month: 'Ags', visitors: 165 },
                { month: 'Sep', visitors: 142 },
                { month: 'Okt', visitors: 3 },
                { month: 'Nov', visitors: 0 },
                { month: 'Des', visitors: 0 }
            ]
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
        const notifications = [
            {
                id: 1,
                title: 'Selamat datang di Sistem DISBUDPORAPAR',
                message: 'Sistem rekapitulasi pengunjung DISBUDPORAPAR',
                type: 'info',
                date: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Sistem siap digunakan',
                message: 'Semua fitur sudah dapat diakses',
                type: 'success', 
                date: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Total pengunjung bulan ini',
                message: 'Telah tercatat 3 pengunjung bulan ini',
                type: 'info',
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
    console.log('   👤 Operator: username=operator, password=password');
});