const pool = require('../db/connection');

class AnalyticsService {
  static async getCompanyOverview() {
    const overview = {};

    // Get basic metrics
    overview.totalUsers = await this.getTotalUsers();
    overview.totalTasks = await this.getTotalTasks();
    overview.totalLeads = await this.getTotalLeads();
    overview.totalRevenue = await this.getTotalRevenue();
    overview.activeUsers = await this.getActiveUsers();

    return overview;
  }

  static async getTotalUsers() {
    const result = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    return parseInt(result.rows[0].count);
  }

  static async getTotalTasks() {
    const result = await pool.query('SELECT COUNT(*) as count FROM tasks');
    return parseInt(result.rows[0].count);
  }

  static async getTotalLeads() {
    const result = await pool.query('SELECT COUNT(*) as count FROM leads');
    return parseInt(result.rows[0].count);
  }

  static async getTotalRevenue() {
    const result = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM finance_records 
      WHERE type = 'income'
    `);
    return parseFloat(result.rows[0].total);
  }

  static async getActiveUsers() {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE last_login > NOW() - INTERVAL '7 days'
    `);
    return parseInt(result.rows[0].count);
  }

  static async getWeeklyActivity() {
    const activity = {};

    // Weekly task completion
    const weeklyTasks = await pool.query(`
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        COUNT(*) as count
      FROM tasks
      WHERE created_at > NOW() - INTERVAL '3 months'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week
    `);
    activity.weeklyTasks = weeklyTasks.rows;

    // Weekly lead generation
    const weeklyLeads = await pool.query(`
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        COUNT(*) as count
      FROM leads
      WHERE created_at > NOW() - INTERVAL '3 months'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week
    `);
    activity.weeklyLeads = weeklyLeads.rows;

    return activity;
  }

  static async getUserPerformance(userId) {
    const performance = {};

    // User's task completion rate
    const taskStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks
      WHERE assigned_to = $1
    `, [userId]);

    const stats = taskStats.rows[0];
    performance.completionRate = stats.total_tasks > 0 ? 
      (stats.completed_tasks / stats.total_tasks * 100).toFixed(2) : 0;

    // User's lead conversion rate
    const leadStats = await pool.query(`
      SELECT 
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_leads
      FROM leads
      WHERE assigned_to = $1
    `, [userId]);

    const leadStat = leadStats.rows[0];
    performance.conversionRate = leadStat.total_leads > 0 ? 
      (leadStat.converted_leads / leadStat.total_leads * 100).toFixed(2) : 0;

    return performance;
  }

  static async getFinancialAnalytics() {
    const analytics = {};

    // Monthly revenue
    const monthlyRevenue = await pool.query(`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total_revenue
      FROM finance_records
      WHERE type = 'income' AND date > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month
    `);
    analytics.monthlyRevenue = monthlyRevenue.rows;

    // Expense breakdown
    const expenses = await pool.query(`
      SELECT 
        category,
        SUM(amount) as total_amount
      FROM finance_records
      WHERE type = 'expense'
      GROUP BY category
    `);
    analytics.expenses = expenses.rows;

    return analytics;
  }

  static async getTopPerformers(limit = 5) {
    const performers = await pool.query(`
      SELECT 
        u.name,
        COUNT(t.id) as completed_tasks,
        AVG(t.score) as avg_task_score
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status = 'completed'
      WHERE u.is_active = true
      GROUP BY u.id, u.name
      ORDER BY completed_tasks DESC
      LIMIT $1
    `, [limit]);

    return performers.rows;
  }
}

module.exports = AnalyticsService;
