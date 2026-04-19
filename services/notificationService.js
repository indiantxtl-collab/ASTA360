const pool = require('../db/connection');
const socketService = require('./socketService');

class NotificationService {
  static async createNotification(userId, type, title, message, priority = 'normal') {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, priority, is_read)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING *`,
        [userId, type, title, message, priority]
      );

      // Emit real-time notification
      socketService.emitToUser(userId, 'notification', result.rows[0]);

      return result.rows[0];
    } catch (error) {
      console.error('Notification creation error:', error);
    }
  }

  static async getUserNotifications(userId, filters = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (filters.read !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      params.push(filters.read);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async markAsRead(notificationId) {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [notificationId]
    );
  }

  static async sendBulkNotification(userIds, type, title, message) {
    for (const userId of userIds) {
      await this.createNotification(userId, type, title, message);
    }
  }

  static async sendTaskReminder() {
    // Find overdue tasks
    const overdueTasks = await pool.query(`
      SELECT t.*, u.name as user_name, u.email
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.due_date < NOW() AND t.status != 'completed'
    `);

    for (const task of overdueTasks.rows) {
      await this.createNotification(
        task.assigned_to,
        'task_overdue',
        'Overdue Task Alert',
        `Task "${task.title}" is overdue. Please complete it as soon as possible.`,
        'high'
      );
    }
  }

  static async sendLeadFollowupAlerts() {
    // Find leads needing follow-up
    const leadsNeedingFollowup = await pool.query(`
      SELECT l.*, u.name as user_name
      FROM leads l
      JOIN users u ON l.assigned_to = u.id
      WHERE l.updated_at < NOW() - INTERVAL '7 days' AND l.status = 'contacted'
    `);

    for (const lead of leadsNeedingFollowup.rows) {
      await this.createNotification(
        lead.assigned_to,
        'lead_followup',
        'Lead Follow-up Needed',
        `Lead ${lead.name} requires follow-up. Last contact was 7 days ago.`,
        'medium'
      );
    }
  }
}

module.exports = NotificationService;
