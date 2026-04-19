const OpenAI = require('openai');

class AIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'gpt-4-turbo'; // Using latest model
  }

  async generateContent(prompt, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        stream: options.stream || false
      });

      if (options.stream) {
        return this.handleStream(response);
      }

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error(`AI Service Error: ${error.message}`);
    }
  }

  async handleStream(stream) {
    let content = '';
    for await (const chunk of stream) {
      const chunkContent = chunk.choices[0]?.delta?.content;
      if (chunkContent) {
        content += chunkContent;
      }
    }
    return content;
  }

  // Advanced AI functions
  async analyzeSalesData(salesData) {
    const prompt = `
      Analyze this sales data and provide comprehensive insights:
      
      Sales Data: ${JSON.stringify(salesData)}
      
      Please provide:
      1. Sales trend analysis
      2. Top performing products/customers
      3. Areas of improvement
      4. Predictive insights for next quarter
      5. Recommendations for growth
      
      Format the response in structured JSON format.
    `;

    try {
      const response = await this.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Sales analysis error:', error);
      return {
        summary: "Unable to analyze sales data",
        insights: [],
        recommendations: []
      };
    }
  }

  async scoreLead(leadData) {
    const prompt = `
      Score this lead based on multiple factors (1-100):
      
      Lead Information: ${JSON.stringify(leadData)}
      
      Factors to consider:
      - Budget and financial capability
      - Decision making authority
      - Urgency and timeline
      - Fit with our product/service
      - Company size and stability
      - Communication quality
      
      Return only a number between 1-100 representing the lead quality score.
    `;

    try {
      const response = await this.generateContent(prompt);
      const score = parseInt(response.match(/\d+/)?.[0]) || 50;
      return Math.min(Math.max(score, 1), 100); // Ensure score is between 1-100
    } catch (error) {
      console.error('Lead scoring error:', error);
      return 50; // Default medium score
    }
  }

  async parseResume(resumeText, jobDescription = '') {
    const prompt = `
      Parse this resume and extract relevant information:
      
      Resume: ${resumeText}
      
      Job Description: ${jobDescription}
      
      Extract and return in JSON format:
      {
        "name": "",
        "email": "",
        "phone": "",
        "experience_years": 0,
        "skills": [],
        "education": [],
        "summary": "",
        "fit_score": 0,
        "strengths": [],
        "weaknesses": []
      }
    `;

    try {
      const response = await this.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Resume parsing error:', error);
      return {
        name: "Unable to parse",
        fit_score: 0,
        summary: "Resume parsing failed"
      };
    }
  }

  async generateMarketingContent(contentType, targetAudience, keywords) {
    const prompt = `
      Generate high-quality marketing content for:
      
      Type: ${contentType}
      Target Audience: ${targetAudience}
      Keywords: ${keywords.join(', ')}
      
      Create engaging, professional content that follows best practices.
      Make it SEO-friendly and conversion-focused.
    `;

    try {
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Marketing content generation error:', error);
      return "Unable to generate marketing content";
    }
  }

  async analyzeInventory(inventoryData) {
    const prompt = `
      Analyze this inventory data and provide recommendations:
      
      Inventory: ${JSON.stringify(inventoryData)}
      
      Provide insights about:
      1. Low stock items requiring immediate attention
      2. Overstocked items
      3. Seasonal trends
      4. Reorder recommendations
      5. Cost optimization suggestions
    `;

    try {
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Inventory analysis error:', error);
      return "Unable to analyze inventory";
    }
  }

  async generateReport(reportType, data, timeframe) {
    const prompt = `
      Generate a comprehensive ${reportType} report for the ${timeframe} period:
      
      Data: ${JSON.stringify(data)}
      
      Include:
      - Executive summary
      - Key metrics and KPIs
      - Trend analysis
      - Performance comparison
      - Actionable recommendations
      - Visual data representation suggestions
    `;

    try {
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Report generation error:', error);
      return "Unable to generate report";
    }
  }
}

module.exports = new AIService();
