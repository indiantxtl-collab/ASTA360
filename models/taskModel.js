const pool = require('../db/connection');

class Task {
  static async create(taskData) {
    const { title, description, assigned_to, assigned_by, priority, due_date } = taskData;
    const result = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, assigned_to, assigned_by, priority, due_date]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, filters = {}) {
    let query = `SELECT t.*, u.name as assigned_by_name, u2.name as assigned_to_name 
                 FROM tasks t 
                 LEFT JOIN users u ON t.assigned_by = u.id 
                 LEFT JOIN users u2 ON t.assigned_to = u2.id 
                 WHERE t.assigned_to = $1`;
    const params = [userId];
    
    if (filters.status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    if (filters.priority) {
      query += ` AND t.priority = $${params.length + 1}`;
      params.push(filters.priority);
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async updateStatus(taskId, status, completed_at = null) {
    const result = await pool.query(
      `UPDATE tasks SET status = $1, completed_at = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [status, completed_at, taskId]
    );
    return result.rows[0];
  }

  static async findById(taskId) {
    const result = await pool.query(
      `SELECT t.*, u.name as assigned_by_name, u2.name as assigned_to_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_by = u.id 
       LEFT JOIN users u2 ON t.assigned_to = u2.id 
       WHERE t.id = $1`,
      [taskId]
    );
    return result.rows[0];
  }

  static async getTeamTasks(managerId) {
    const result = await pool.query(
      `SELECT t.*, u.name as assigned_to_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_to = u.id 
       WHERE t.assigned_by = $1 OR t.assigned_to IN (
         SELECT id FROM users WHERE created_by = $1
       )
       ORDER BY t.created_at DESC`,
      [managerId]
    );
    return result.rows;
  }
}

module.exports = Task;
