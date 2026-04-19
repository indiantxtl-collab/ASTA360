const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const User = require('../models/userModel');
const Task = require('../models/taskModel');
const Lead = require('../models/leadModel');
const { aiService } = require('../services/aiService');

// Tasks routes
router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, assigned_to, priority, due_date } = req.body;
    
    // Only admin/manager can assign tasks to others
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      if (assigned_to && assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Cannot assign tasks to other users' });
      }
    }
    
    const task = await Task.create({
      title,
      description,
      assigned_to: assigned_to || req.user.id,
      assigned_by: req.user.id,
      priority: priority || 'medium',
      due_date
    });
    
    res.json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.query;
    
    let filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assigned_to) filters.assigned_to = assigned_to;
    
    let tasks;
    
    if (req.user.role === 'Manager') {
      // Managers can see their team's tasks
      tasks = await Task.getTeamTasks(req.user.id);
    } else {
      // Regular users see only their own tasks
      tasks = await Task.findByUserId(req.user.id, filters);
    }
    
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.put('/tasks/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Only the assigned user or manager/admin can update status
    if (task.assigned_to !== req.user.id && 
        req.user.role !== 'Admin' && 
        req.user.role !== 'Manager') {
      return res.status(403).json({ error: 'Not authorized to update task status' });
    }
    
    const updatedTask = await Task.updateStatus(id, status, status === 'completed' ? new Date() : null);
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Leads routes
router.post('/leads', authenticateToken, checkRole(['Admin', 'Manager', 'Employee']), async (req, res) => {
  try {
    const { name, email, phone, company, source, assigned_to, notes } = req.body;
    
    // Only admin/manager can assign leads to others
    if (req.user.role === 'Employee') {
      if (assigned_to && assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Employees cannot assign leads to others' });
      }
    }
    
    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      source: source || 'web',
      assigned_to: assigned_to || req.user.id,
      notes
    });
    
    // Score the lead using AI
    const leadData = {
      name,
      email,
      phone,
      company,
      source,
      notes
    };
    
    try {
      const aiScore = await aiService.scoreLead(leadData);
      await pool.query('UPDATE leads SET score = $1 WHERE id = $2', [aiScore, lead.id]);
      lead.score = aiScore;
    } catch (aiError) {
      console.error('AI scoring error:', aiError);
      // Continue without AI score
    }
    
    res.json({ success: true, lead });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.get('/leads', authenticateToken, async (req, res) => {
  try {
    const { status, source, assigned_to } = req.query;
    
    let filters = {};
    if (status) filters.status = status;
    if (source) filters.source = source;
    if (assigned_to) filters.assigned_to = assigned_to;
    
    // Only show leads assigned to current user or their team
    if (req.user.role === 'Employee') {
      filters.assigned_to = req.user.id;
    }
    
    const leads = await Lead.findAll(filters);
    res.json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.get('/leads/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Lead.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get leads stats error:', error);
    res.status(500).json({ error: 'Failed to fetch leads statistics' });
  }
});

// HR/Candidate routes
router.post('/hr/candidates', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    // This would handle resume uploads and parsing
    // For now, we'll simulate the AI processing
    const { name, email, phone, position, experience, skills, resume_text } = req.body;
    
    // Simulate AI resume analysis
    const analysis = await aiService.generateContent(
      `Analyze this candidate resume and provide a score out of 100. Resume: ${resume_text}. Position: ${position}`
    );
    
    const score = parseInt(analysis.match(/\d+/)?.[0]) || 50;
    
    const candidate = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      position,
      experience,
      skills,
      score,
      applied_date: new Date()
    };
    
    res.json({ success: true, candidate });
  } catch (error) {
    console.error('Process candidate error:', error);
    res.status(500).json({ error: 'Failed to process candidate' });
  }
});

// Finance routes
router.post('/finance/records', authenticateToken, checkRole(['Admin', 'Founder/CEO']), async (req, res) => {
  try {
    const { type, amount, description, category, date, related_user_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO finance_records (type, amount, description, category, date, related_user_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [type, amount, description, category, date, related_user_id, req.user.id]
    );
    
    res.json({ success: true, record: result.rows[0] });
  } catch (error) {
    console.error('Create finance record error:', error);
    res.status(500).json({ error: 'Failed to create finance record' });
  }
});

router.get('/finance/records', authenticateToken, checkRole(['Admin', 'Founder/CEO']), async (req, res) => {
  try {
    const { type, date_from, date_to, category } = req.query;
    
    let query = 'SELECT * FROM finance_records WHERE 1=1';
    const params = [];
    
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    if (date_from) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(date_from);
    }
    
    if (date_to) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(date_to);
    }
    
    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await pool.query(query, params);
    res.json({ records: result.rows });
  } catch (error) {
    console.error('Get finance records error:', error);
    res.status(500).json({ error: 'Failed to fetch finance records' });
  }
});

// Inventory routes
router.post('/inventory/items', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { name, sku, quantity, price, category, supplier } = req.body;
    
    const result = await pool.query(
      `INSERT INTO inventory (name, sku, quantity, price, category, supplier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, sku, quantity, price, category, supplier]
    );
    
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

router.get('/inventory/items', authenticateToken, async (req, res) => {
  try {
    const { category, low_stock_only } = req.query;
    
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    
    if (low_stock_only === 'true') {
      query += ' AND quantity <= min_stock_level';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

module.exports = router;
