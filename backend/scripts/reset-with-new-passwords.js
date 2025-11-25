const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

async function resetWithNewPasswords() {
    try {
        console.log('🔄 Reset sistem dengan password baru...');
        
        // Create database
        await connection.promise().execute('CREATE DATABASE IF NOT EXISTS visitor_management');
        await connection.promise().execute('USE visitor_management');
        
        // Drop and recreate tables
        const tables = [
            'DROP TABLE IF EXISTS visitor_records',
            'DROP TABLE IF EXISTS tourism_locations', 
            'DROP TABLE IF EXISTS users',
            
            `CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'uptd_head') NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )`,
            
            `CREATE TABLE tourism_locations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                location_code VARCHAR(10) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                qr_code_path VARCHAR(255),
                address TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE visitor_records (
                id INT PRIMARY KEY AUTO_INCREMENT,
                record_uuid VARCHAR(36) UNIQUE NOT NULL,
                location_id INT NOT NULL,
                visitor_name VARCHAR(100),
                male_count INT DEFAULT 0,
                female_count INT DEFAULT 0,
                visitor_type ENUM('domestic', 'international') NOT NULL,
                check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                notes TEXT,
                FOREIGN KEY (location_id) REFERENCES tourism_locations(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`
        ];

        for (let sql of tables) {
            await connection.promise().execute(sql);
        }

        // Create users dengan password baru
        const users = [
            { username: 'admin', password: 'disbudpar2024', role: 'admin', name: 'Administrator', email: 'admin@disbudpar.go.id' },
            { username: 'operator', password: 'operator123', role: 'uptd_head', name: 'Operator UPTD', email: 'operator@disbudpar.go.id' },
            { username: 'pengelola', password: 'pengelola123', role: 'uptd_head', name: 'Pengelola Wisata', email: 'pengelola@disbudpar.go.id' }
        ];

        for (let user of users) {
            const hash = bcrypt.hashSync(user.password, 10);
            await connection.promise().execute(
                'INSERT INTO users (username, password_hash, role, full_name, email) VALUES (?, ?, ?, ?, ?)',
                [user.username, hash, user.role, user.name, user.email]
            );
        }

        // Create locations
        const locations = [
            ['GB', 'Gallery Bungas', 'Jl. Gallery Bungas No. 123'],
            ['PIP', 'PIP', 'Jl. PIP No. 456'],
            ['RA', 'Rumah Anno', 'Jl. Rumah Anno No. 789']
        ];

        for (let location of locations) {
            await connection.promise().execute(
                'INSERT INTO tourism_locations (location_code, name, address) VALUES (?, ?, ?)',
                location
            );
        }

        console.log('\n🎉 SISTEM DIREFRESH DENGAN PASSWORD BARU!');
        console.log('\n📋 LOGIN CREDENTIALS BARU:');
        users.forEach(user => {
            console.log(`   👤 ${user.username} - ${user.name}`);
            console.log(`      Password: ${user.password}`);
            console.log(`      Role: ${user.role}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Reset gagal:', error);
    } finally {
        connection.end();
    }
}

resetWithNewPasswords();