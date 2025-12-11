const db = require('../config/database');

class User {
    // Find user by username
    static async findByUsername(username) {
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );
        return users[0] || null;
    }

    // Find user by ID
    static async findById(id) {
        const [users] = await db.execute(
            'SELECT id, username, role, full_name, email, last_login FROM users WHERE id = ?',
            [id]
        );
        return users[0] || null;
    }

    // Update last login
    static async updateLastLogin(id) {
        await db.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }
}

module.exports = User;