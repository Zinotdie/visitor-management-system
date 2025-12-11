const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function changeAllPasswords() {
    try {
        const passwordChanges = [
            { username: 'admin', newPassword: 'admin123' },
            { username: 'uptd_head', newPassword: 'uptd123' },
            { username: 'test', newPassword: 'test123' }
        ];
        
        for (const change of passwordChanges) {
            const hash = bcrypt.hashSync(change.newPassword, 10);
            
            await db.execute(
                'UPDATE users SET password_hash = ? WHERE username = ?',
                [hash, change.username]
            );
            
            console.log(`✅ Password ${change.username} diubah: ${change.newPassword}`);
        }
        
        console.log('\n🎉 Semua password berhasil diubah!');
        console.log('\n📋 LOGIN CREDENTIALS BARU:');
        passwordChanges.forEach(change => {
            console.log(`   👤 ${change.username}: ${change.newPassword}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal mengubah password:', error);
        process.exit(1);
    }
}

changeAllPasswords();