const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Create connection tanpa database dulu
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL');
    hardReset();
});

function hardReset() {
    console.log('🔄 Hard reset sistem...');
    
    // Step 1: Create database jika belum ada
    connection.query('CREATE DATABASE IF NOT EXISTS visitor_management', (err) => {
        if (err) {
            console.error('❌ Create database failed:', err.message);
            connection.end();
            return;
        }
        console.log('✅ Database created/verified');
        
        // Step 2: Use database
        connection.query('USE visitor_management', (err) => {
            if (err) {
                console.error('❌ Use database failed:', err.message);
                connection.end();
                return;
            }
            console.log('✅ Database selected');
            
            // Step 3: Drop tables
            dropTables();
        });
    });
}

function dropTables() {
    const tables = ['visitor_records', 'tourism_locations', 'users'];
    let completed = 0;
    
    tables.forEach(table => {
        connection.query(`DROP TABLE IF EXISTS ${table}`, (err) => {
            if (err) {
                console.error(`❌ Drop table ${table} failed:`, err.message);
            } else {
                console.log(`✅ Table ${table} dropped`);
            }
            
            completed++;
            if (completed === tables.length) {
                createTables();
            }
        });
    });
}

function createTables() {
    console.log('📦 Creating tables...');
    
    const tablesSQL = [
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
    
    let completed = 0;
    
    tablesSQL.forEach(sql => {
        connection.query(sql, (err) => {
            if (err) {
                console.error('❌ Create table failed:', err.message);
            } else {
                console.log('✅ Table created');
            }
            
            completed++;
            if (completed === tablesSQL.length) {
                insertData();
            }
        });
    });
}

function insertData() {
    console.log('👥 Inserting default data...');
    
    // Insert users
    const users = [
        { username: 'admin', password: 'password', role: 'admin', name: 'Administrator', email: 'admin@disbudpar.go.id' },
        { username: 'operator', password: 'password', role: 'uptd_head', name: 'Operator UPTD', email: 'operator@disbudpar.go.id' }
    ];
    
    let usersCompleted = 0;
    
    users.forEach(user => {
        const hash = bcrypt.hashSync(user.password, 10);
        
        connection.query(
            'INSERT INTO users (username, password_hash, role, full_name, email) VALUES (?, ?, ?, ?, ?)',
            [user.username, hash, user.role, user.name, user.email],
            (err) => {
                if (err) {
                    console.error(`❌ Insert user ${user.username} failed:`, err.message);
                } else {
                    console.log(`✅ User ${user.username} created`);
                }
                
                usersCompleted++;
                if (usersCompleted === users.length) {
                    insertLocations();
                }
            }
        );
    });
}

function insertLocations() {
    const locations = [
        ['GB', 'Gallery Bungas', 'Jl. Gallery Bungas No. 123'],
        ['PIP', 'PIP', 'Jl. PIP No. 456'],
        ['RA', 'Rumah Anno', 'Jl. Rumah Anno No. 789']
    ];
    
    let locationsCompleted = 0;
    
    locations.forEach(location => {
        connection.query(
            'INSERT INTO tourism_locations (location_code, name, address) VALUES (?, ?, ?)',
            location,
            (err) => {
                if (err) {
                    console.error(`❌ Insert location ${location[0]} failed:`, err.message);
                } else {
                    console.log(`✅ Location ${location[0]} created`);
                }
                
                locationsCompleted++;
                if (locationsCompleted === locations.length) {
                    finishReset();
                }
            }
        );
    });
}

function finishReset() {
    console.log('\n🎉 HARD RESET BERHASIL!');
    console.log('\n📋 GUNAKAN LOGIN INI:');
    console.log('   👤 admin / password');
    console.log('   👤 operator / password');
    console.log('\n🚀 Sekarang start backend dan test login!');
    
    connection.end();
}