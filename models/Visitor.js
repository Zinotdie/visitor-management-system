const db = require('../config/database');

class Visitor {
    // Get all visitors dengan filter
    static async findAll(filters = {}) {
        const { page = 1, limit = 50, location, startDate, endDate, type } = filters;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                vr.*, 
                tl.name as location_name, 
                tl.location_code,
                u.full_name as created_by_name
            FROM visitor_records vr
            LEFT JOIN tourism_locations tl ON vr.location_id = tl.id
            LEFT JOIN users u ON vr.created_by = u.id
            WHERE 1=1
        `;
        
        let countQuery = `
            SELECT COUNT(*) as total
            FROM visitor_records vr
            LEFT JOIN tourism_locations tl ON vr.location_id = tl.id
            WHERE 1=1
        `;
        
        const params = [];
        const countParams = [];

        if (location) {
            query += ' AND tl.location_code = ?';
            countQuery += ' AND tl.location_code = ?';
            params.push(location);
            countParams.push(location);
        }

        if (startDate) {
            query += ' AND DATE(vr.check_in_time) >= ?';
            countQuery += ' AND DATE(vr.check_in_time) >= ?';
            params.push(startDate);
            countParams.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(vr.check_in_time) <= ?';
            countQuery += ' AND DATE(vr.check_in_time) <= ?';
            params.push(endDate);
            countParams.push(endDate);
        }

        if (type && type !== 'all') {
            query += ' AND vr.visitor_type = ?';
            countQuery += ' AND vr.visitor_type = ?';
            params.push(type);
            countParams.push(type);
        }

        query += ' ORDER BY vr.check_in_time DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [records] = await db.execute(query, params);
        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        return {
            records,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Find visitor by ID
    static async findById(id) {
        const [records] = await db.execute(
            `SELECT vr.*, tl.name as location_name, tl.location_code 
             FROM visitor_records vr 
             LEFT JOIN tourism_locations tl ON vr.location_id = tl.id 
             WHERE vr.id = ?`,
            [id]
        );
        return records[0] || null;
    }

    // Create new visitor
    static async create(visitorData) {
        const { location_code, visitor_name, male_count = 0, female_count = 0, visitor_type = 'domestic', notes = '', created_by = 1 } = visitorData;

        // Cari location_id
        const [locations] = await db.execute(
            'SELECT id FROM tourism_locations WHERE location_code = ? AND is_active = TRUE',
            [location_code]
        );

        if (locations.length === 0) {
            throw new Error('Lokasi tidak ditemukan');
        }

        const location_id = locations[0].id;
        const record_uuid = require('crypto').randomUUID();

        const [result] = await db.execute(
            `INSERT INTO visitor_records 
             (record_uuid, location_id, visitor_name, male_count, female_count, 
              visitor_type, notes, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [record_uuid, location_id, visitor_name, male_count, female_count, visitor_type, notes, created_by]
        );

        return await this.findById(result.insertId);
    }

    // Update visitor
    static async update(id, visitorData) {
        const { visitor_name, male_count, female_count, visitor_type, notes } = visitorData;

        await db.execute(
            `UPDATE visitor_records 
             SET visitor_name = ?, male_count = ?, female_count = ?, 
                 visitor_type = ?, notes = ?
             WHERE id = ?`,
            [visitor_name, male_count, female_count, visitor_type, notes, id]
        );

        return await this.findById(id);
    }

    // Delete visitor
    static async delete(id) {
        const [result] = await db.execute(
            'DELETE FROM visitor_records WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Get daily statistics
    static async getDailyStats(date, location = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        let query = `
            SELECT 
                tl.location_code,
                tl.name as location_name,
                COUNT(vr.id) as total_visits,
                SUM(vr.male_count) as total_male,
                SUM(vr.female_count) as total_female,
                SUM(vr.male_count + vr.female_count) as total_visitors,
                COUNT(CASE WHEN vr.visitor_type = 'international' THEN 1 END) as international_visits
            FROM tourism_locations tl
            LEFT JOIN visitor_records vr ON tl.id = vr.location_id AND DATE(vr.check_in_time) = ?
            WHERE tl.is_active = TRUE
        `;
        const params = [targetDate];
        
        if (location) {
            query += ' AND tl.location_code = ?';
            params.push(location);
        }
        
        query += ' GROUP BY tl.id, tl.location_code, tl.name';
        
        const [stats] = await db.execute(query, params);
        return { date: targetDate, statistics: stats };
    }

    // Get monthly statistics
    static async getMonthlyStats(year, location = null) {
        const targetYear = year || new Date().getFullYear();
        
        let query = `
            SELECT 
                MONTH(vr.check_in_time) as month,
                tl.location_code,
                tl.name as location_name,
                COUNT(vr.id) as total_visits,
                SUM(vr.male_count) as total_male,
                SUM(vr.female_count) as total_female,
                SUM(vr.male_count + vr.female_count) as total_visitors,
                COUNT(CASE WHEN vr.visitor_type = 'international' THEN 1 END) as international_visits
            FROM visitor_records vr
            LEFT JOIN tourism_locations tl ON vr.location_id = tl.id
            WHERE YEAR(vr.check_in_time) = ? AND tl.is_active = TRUE
        `;
        const params = [targetYear];
        
        if (location) {
            query += ' AND tl.location_code = ?';
            params.push(location);
        }
        
        query += ' GROUP BY MONTH(vr.check_in_time), tl.id, tl.location_code, tl.name ORDER BY month';
        
        const [stats] = await db.execute(query, params);
        return { year: targetYear, statistics: stats };
    }
}

module.exports = Visitor;