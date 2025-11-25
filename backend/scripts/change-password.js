const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function changePassword() {
    try {
        const username = 'admin'; // Ganti dengan username yang ingin diubah
        const newPassword = 'admin123'; // Password baru
        
        // Generate hash untuk password baru
        const hash = bcrypt.hashSync(newPassword, 10);
        
        // Update password di database
        await db.execute(
            'UPDATE users SET password_hash = ? WHERE username = ?',
            [hash, username]
        );
        
        console.log('✅ Password berhasil diubah!');
        console.log(`📋 Username: ${username}`);
        console.log(`🔐 Password baru: ${newPassword}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal mengubah password:', error);
        process.exit(1);
    }
}

changePassword();