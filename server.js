const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// Initialize app
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

// Middleware for authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and is active
    const userQuery = await pool.query(
      'SELECT id, email, role, permissions FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = userQuery.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// RBAC middleware
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

// Role-based permissions
const rolePermissions = {
  'Founder/CEO': ['read', 'write', 'delete', 'admin'],
  'Admin': ['read', 'write', 'manage_users'],
  'Manager': ['read', 'write', 'manage_team'],
  'Employee': ['read', 'write_own'],
  'Client': ['read_own']
};

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, invitedBy, inviteCode } = req.body;
    
    // Validate invite code for non-admin registration
    if (req.body.role !== 'Founder/CEO') {
      const inviteCheck = await pool.query(
        'SELECT * FROM invite_codes WHERE code = $1 AND is_used = false',
        [inviteCode]
      );
      
      if (inviteCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired invite code' });
      }
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, req.body.role || 'Employee', invitedBy || null]
    );

    // Mark invite code as used
    if (inviteCode) {
      await pool.query(
        'UPDATE invite_codes SET is_used = true WHERE code = $1',
        [inviteCode]
      );
    }

    // Log activity
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [result.rows[0].id, 'USER_REGISTERED', `User ${name} registered`]
    );

    res.status(201).json({
      success: true,
      user: result.rows[0],
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log login activity
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [user.id, 'USER_LOGIN', `User ${user.name} logged in`]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// User management routes (Admin/CEO only)
app.get('/api/users', authenticateToken, checkRole(['Founder/CEO', 'Admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, role, is_active, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM users';
    const countResult = await pool.query(countQuery);

    res.json({
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
        totalUsers: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Generate invite code (Admin/CEO only)
app.post('/api/invites/generate', authenticateToken, checkRole(['Founder/CEO', 'Admin']), async (req, res) => {
  try {
    const { role, expiresAt, createdBy } = req.body;
    
    const crypto = require('crypto');
    const inviteCode = crypto.randomBytes(20).toString('hex');

    const result = await pool.query(
      `INSERT INTO invite_codes (code, role, expires_at, created_by, created_for)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING code, role, expires_at`,
      [inviteCode, role, expiresAt, req.user.id, createdBy]
    );

    res.json({ success: true, inviteCode: result.rows[0] });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// Main dashboard data (role-specific)
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    
    let dashboardData = {};
    
    switch (role) {
      case 'Founder/CEO':
        dashboardData = await getCEODashboardData(pool);
        break;
      case 'Admin':
        dashboardData = await getAdminDashboardData(pool, req.user.id);
        break;
      case 'Manager':
        dashboardData = await getManagerDashboardData(pool, req.user.id);
        break;
      case 'Employee':
        dashboardData = await getEmployeeDashboardData(pool, req.user.id);
        break;
      default:
        dashboardData = await getDefaultDashboardData(pool, req.user.id);
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// AI Integration Service
class AIService {
  constructor() {
    this.openai = require('openai');
    this.client = new this.openai.OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateContent(prompt, model = 'gpt-4') {
    try {
      const response = await this.client.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  async analyzeSalesData(salesData) {
    const prompt = `Analyze this sales data and provide insights: ${JSON.stringify(salesData)}`;
    return await this.generateContent(prompt);
  }

  async scoreLead(leadData) {
    const prompt = `Score this lead based on quality factors: ${JSON.stringify(leadData)}. Return a score between 1-100.`;
    const response = await this.generateContent(prompt);
    return parseInt(response.match(/\d+/)?.[0]) || 50;
  }
}

const aiService = new AIService();

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  // Authenticate socket connection
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });

  // Real-time notifications
  socket.on('join-room', (room) => {
    socket.join(room);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ASTA360 server running on port ${PORT}`);
});

module.exports = { app, pool, authenticateToken, checkRole, aiService };
