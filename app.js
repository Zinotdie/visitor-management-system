const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Import routes
const authRoutes = require('./routes/auth');
const visitorRoutes = require('./routes/visitors');
const locationRoutes = require('./routes/locations');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/locations', locationRoutes);

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
        version: '1.0.0',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                test: 'GET /api/auth/test'
            },
            visitors: {
                list: 'GET /api/visitors',
                create: 'POST /api/visitors',
                stats_daily: 'GET /api/visitors/stats/daily',
                stats_monthly: 'GET /api/visitors/stats/monthly',
                qr_entry: 'POST /api/visitors/qr'
            },
            locations: {
                list: 'GET /api/locations',
                create: 'POST /api/locations',
                get_by_code: 'GET /api/locations/:code',
                generate_qr: 'POST /api/locations/:id/generate-qr'
            },
            system: {
                health: 'GET /api/health',
                info: 'GET /api'
            }
        },
        timestamp: new Date().toISOString()
    });
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
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        suggestion: 'Visit /api to see all available endpoints'
    });
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
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
================================================
🚀 Visitor Management System Backend
================================================
📡 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base: http://localhost:${PORT}/api
❤️  Health Check: http://localhost:${PORT}/api/health
📚 Documentation: http://localhost:${PORT}/api
================================================
📊 Database: MySQL
👤 Authentication: JWT Token
🔐 Login: POST /api/auth/login
================================================
    `);
    
    // Show initial credentials if not in production
    if (process.env.NODE_ENV !== 'production') {
        console.log(`
🔑 INITIAL CREDENTIALS (for testing):
   👤 Admin: 
      Username: admin
      Password: password
      
   👤 Operator (optional):
      Username: operator
      Password: password
      
⚠️  IMPORTANT: Change passwords in production!
        `);
    }
    
    console.log('✅ Server is ready and waiting for connections...\n');
});