const db = require('../config/database');

class Location {
    // Get all locations
    static async findAll() {
        const [locations] = await db.execute(
            'SELECT * FROM tourism_locations WHERE is_active = TRUE ORDER BY name'
        );
        return locations;
    }

    // Find location by ID
    static async findById(id) {
        const [locations] = await db.execute(
            'SELECT * FROM tourism_locations WHERE id = ? AND is_active = TRUE',
            [id]
        );
        return locations[0] || null;
    }

    // Find location by code
    static async findByCode(location_code) {
        const [locations] = await db.execute(
            'SELECT * FROM tourism_locations WHERE location_code = ? AND is_active = TRUE',
            [location_code]
        );
        return locations[0] || null;
    }

    // Create new location
    static async create(locationData) {
        const { location_code, name, address, description = '' } = locationData;

        // Check duplicate
        const existing = await this.findByCode(location_code);
        if (existing) {
            throw new Error('Location code sudah digunakan');
        }

        const [result] = await db.execute(
            `INSERT INTO tourism_locations (location_code, name, address) 
             VALUES (?, ?, ?)`,
            [location_code.toUpperCase(), name, address]
        );

        return await this.findById(result.insertId);
    }

    // Update location
    static async update(id, locationData) {
        const { name, address, is_active } = locationData;

        await db.execute(
            `UPDATE tourism_locations 
             SET name = ?, address = ?, is_active = ?
             WHERE id = ?`,
            [name, address, is_active, id]
        );

        return await this.findById(id);
    }

    // Delete location (soft delete)
    static async delete(id) {
        const [result] = await db.execute(
            'UPDATE tourism_locations SET is_active = FALSE WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Location;