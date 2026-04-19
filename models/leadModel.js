const pool = require('../db/connection');

class Lead {
  static async create(leadData) {
    const { name, email, phone, company, source, assigned_to, notes } = leadData;
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, company, source, assigned_to, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, phone, company, source, assigned_to, notes]
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT l.*, u.name as assigned_to_name 
                 FROM leads l 
                 LEFT JOIN users u ON l.assigned_to = u.id 
                 WHERE 1=1`;
    const params = [];
    
    if (filters.status) {
      query += ` AND l.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    if (filters.source) {
      query += ` AND l.source = $${params.length + 1}`;
      params.push(filters.source);
    }
    
    if (filters.assigned_to) {
      query += ` AND l.assigned_to = $${params.length + 1}`;
      params.push(filters.assigned_to);
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(leadId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(
      `UPDATE leads SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, leadId]
    );
    
    return result.rows[0];
  }

  static async findById(leadId) {
    const result = await pool.query(
      `SELECT l.*, u.name as assigned_to_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.id = $1`,
      [leadId]
    );
    return result.rows[0];
  }

  static async getStats() {
    const stats = {};
    
    // Total leads
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM leads');
    stats.totalLeads = parseInt(totalResult.rows[0].count);
    
    // Status breakdown
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `);
    stats.statusBreakdown = statusResult.rows;
    
    // Source breakdown
    const sourceResult = await pool.query(`
      SELECT source, COUNT(*) as count 
      FROM leads 
      GROUP BY source
    `);
    stats.sourceBreakdown = sourceResult.rows;
    
    return stats;
  }
}

module.exports = Lead;
