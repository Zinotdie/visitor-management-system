const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Create connection dengan database langsung
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'visitor_management' // Specify database langsung
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
    fixPasswords();
});

async function fixPasswords() {
    try {
        console.log('🔄 Memperbaiki password...');
        
        // Generate hash yang benar untuk password
        const passwords = [
            { username: 'admin', password: 'password' },
            { username: 'uptd_head', password: 'password' },
            { username: 'operator', password: 'password' }
        ];
        
        for (const item of passwords) {
            const hash = bcrypt.hashSync(item.password, 10);
            
            // Gunakan query biasa, bukan prepared statement
            connection.query(
                'UPDATE users SET password_hash = ? WHERE username = ?',
                [hash, item.username],
                (error, results) => {
                    if (error) {
                        console.error(`❌ Error updating ${item.username}:`, error.message);
                    } else {
                        console.log(`✅ Password ${item.username} diperbaiki: ${item.password}`);
                    }
                }
            );
        }
        
        // Tunggu sebentar lalu verifikasi
        setTimeout(() => {
            verifyPasswords();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Gagal memperbaiki password:', error);
        connection.end();
    }
}

function verifyPasswords() {
    console.log('\n📋 Verifikasi password:');
    
    connection.query('SELECT username, password_hash FROM users', (error, results) => {
        if (error) {
            console.error('❌ Verifikasi gagal:', error.message);
        } else {
            for (const user of results) {
                const isValid = bcrypt.compareSync('password', user.password_hash);
                console.log(`   ${user.username}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
            }
            
            console.log('\n🎉 Password berhasil diperbaiki!');
            console.log('\n📋 LOGIN CREDENTIALS:');
            console.log('   👤 admin / password');
            console.log('   👤 uptd_head / password');
            console.log('   👤 operator / password');
        }
        
        connection.end();
    });
}