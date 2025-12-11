const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

async function generateRealQR() {
    try {
        // Pastikan folder exists
        const qrDir = path.join(__dirname, '../public/qrcodes');
        try {
            await fs.access(qrDir);
        } catch {
            await fs.mkdir(qrDir, { recursive: true });
        }

        // Generate QR code untuk setiap lokasi
        const locations = [
            { id: 1, code: 'GB', name: 'Gallery Bungas' },
            { id: 2, code: 'PIP', name: 'PIP' },
            { id: 3, code: 'RA', name: 'Rumah Anno' }
        ];

        for (const location of locations) {
            const qrData = {
                locationId: location.id,
                locationCode: location.code,
                name: location.name,
                type: 'visitor_checkin',
                timestamp: Date.now()
            };

            const qrPath = path.join(qrDir, `location-${location.code}.png`);
            const qrUrl = `/public/qrcodes/location-${location.code}.png`;

            await QRCode.toFile(qrPath, JSON.stringify(qrData), {
                color: {
                    dark: '#1e3c72',
                    light: '#FFFFFF'
                },
                width: 300,
                margin: 2
            });

            console.log(`✅ QR code generated: ${qrUrl}`);
        }

        console.log('🎉 All QR codes generated successfully!');
        
    } catch (error) {
        console.error('❌ QR generation failed:', error);
    }
}

generateRealQR();