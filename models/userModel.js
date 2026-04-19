const pool = require('../db/connection');

class User {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, role, permissions, is_active FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0];
  }

  static async create(userData) {
    const { name, email, password_hash, role, created_by } = userData;
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash, role, created_by]
    );
    return result.rows[0];
  }

  static async update(userId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [...values, userId]
    );
    
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT id, name, email, role, is_active, created_at, last_login FROM users WHERE 1=1';
    const params = [];
    
    if (filters.search) {
      query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 2})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (filters.role) {
      query += ` AND role = $${params.length + 1}`;
      params.push(filters.role);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = User;
