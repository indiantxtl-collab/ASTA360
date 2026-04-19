const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiService } = require('../services/aiService');
const AnalyticsService = require('../services/analyticsService');

// AI Chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Enhanced context-aware AI responses
    const enhancedPrompt = `
      You are ASTA360 AI Assistant. User context: ${JSON.stringify(context)}
      
      Message: ${message}
      
      Provide a helpful, context-aware response that's relevant to the user's role (${context.userRole}).
      If asked about business metrics, refer to the company's data.
      Keep responses professional and actionable.
    `;
    
    const response = await aiService.generateContent(enhancedPrompt);
    
    res.json({
      success: true,
      response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'AI service temporarily unavailable'
    });
  }
});

// AI-powered sales analysis
router.get('/sales-analysis', authenticateToken, async (req, res) => {
  try {
    const salesData = await AnalyticsService.getFinancialAnalytics();
    const analysis = await aiService.analyzeSalesData(salesData);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Sales analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sales data'
    });
  }
});

// AI-powered lead scoring
router.post('/score-lead', authenticateToken, async (req, res) => {
  try {
    const { leadData } = req.body;
    const score = await aiService.scoreLead(leadData);
    
    res.json({
      success: true,
      score
    });
  } catch (error) {
    console.error('Lead scoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to score lead'
    });
  }
});

// AI-powered resume parsing
router.post('/parse-resume', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const parsedData = await aiService.parseResume(resumeText, jobDescription);
    
    res.json({
      success: true,
      parsedData
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse resume'
    });
  }
});

// AI-powered marketing content generation
router.post('/generate-marketing-content', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const { contentType, targetAudience, keywords } = req.body;
    const content = await aiService.generateMarketingContent(contentType, targetAudience, keywords);
    
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Marketing content generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate marketing content'
    });
  }
});

// AI-powered inventory analysis
router.get('/inventory-analysis', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const inventoryData = await pool.query('SELECT * FROM inventory');
    const analysis = await aiService.analyzeInventory(inventoryData.rows);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Inventory analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze inventory'
    });
  }
});

// AI-powered report generation
router.post('/generate-report', authenticateToken, checkRole(['Founder/CEO', 'Admin']), async (req, res) => {
  try {
    const { reportType, data, timeframe } = req.body;
    const report = await aiService.generateReport(reportType, data, timeframe);
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

module.exports = router;
