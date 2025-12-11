const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'visitor_management'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    
    console.log('✅ Connected to database');
    
    // Test query users
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('❌ Query failed:', err.message);
        } else {
            console.log('📋 Users in database:');
            results.forEach(user => {
                console.log(`   👤 ${user.username} (${user.role})`);
            });
        }
        
        connection.end();
    });
});