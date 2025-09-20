const { GoogleGenerativeAI } = require('@google/generative-ai');
const UsageMonitor = require('../utils/usageMonitor');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 4000, // Allow for comprehensive 2-page reports
        temperature: 0.4, // Balanced creativity and precision
      }
    });
    
    // Rate limiting tracking
    this.requestCount = 0;
    this.dailyRequestCount = 0;
    this.lastRequestTime = 0;
    this.dailyResetTime = this.getNextDayReset();
    
    // Free tier limits
    this.MAX_REQUESTS_PER_MINUTE = 10; // Conservative limit (actual is 15)
    this.MAX_DAILY_REQUESTS = 1400; // Conservative limit (actual is 1500)
    this.MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests (10 per minute)
    
    // Usage monitoring
    this.usageMonitor = new UsageMonitor();
  }

  getNextDayReset() {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  async checkRateLimits() {
    const now = Date.now();
    
    // Check current usage from persistent storage
    const usageStatus = this.usageMonitor.isWithinLimits();
    if (!usageStatus.withinDailyLimit) {
      throw new Error(`Daily request limit reached. Remaining: ${usageStatus.remainingRequests} requests. Quota resets at midnight UTC.`);
    }
    
    // Reset daily counter if new day
    if (now >= this.dailyResetTime) {
      this.dailyRequestCount = 0;
      this.dailyResetTime = this.getNextDayReset();
    }
    
    // Check rate limiting (time between requests)
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.dailyRequestCount++;
  }

  async generateSecurityReport(attackData) {
    try {
      // Check rate limits before making request
      await this.checkRateLimits();
      
      const prompt = this.buildOptimizedPrompt(attackData);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Track usage silently for monitoring
      let inputTokens = Math.ceil(prompt.length / 4);
      let outputTokens = Math.ceil(responseText.length / 4);
      let totalTokens = inputTokens + outputTokens;
      
      if (result.response.usageMetadata) {
        const usage = result.response.usageMetadata;
        inputTokens = usage.promptTokenCount || inputTokens;
        outputTokens = usage.candidatesTokenCount || outputTokens;
        totalTokens = usage.totalTokenCount || totalTokens;
      }
      
      // Track usage for monitoring (silent)
      this.usageMonitor.logRequest(inputTokens, outputTokens, totalTokens);
      
      return responseText;
    } catch (error) {
      console.error('Error generating report with Gemini:', error);
      if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('API quota exceeded. Report generation will use fallback mode.');
      }
      throw new Error('Failed to generate AI-powered report');
    }
  }

  // Comprehensive prompt for professional security reports (ignoring token limits)
  buildOptimizedPrompt(attackData) {
    // Extract and structure attack data
    const query = attackData.query || attackData.rawData || {};
    const maliciousOperators = [];
    const queryStr = JSON.stringify(query);
    
    if (queryStr.includes('$ne')) maliciousOperators.push('$ne (not equal bypass)');
    if (queryStr.includes('$gt')) maliciousOperators.push('$gt (greater than bypass)');
    if (queryStr.includes('$lt')) maliciousOperators.push('$lt (less than bypass)');
    if (queryStr.includes('$regex')) maliciousOperators.push('$regex (pattern matching exploit)');
    if (queryStr.includes('$where')) maliciousOperators.push('$where (JavaScript code injection)');
    if (queryStr.includes('$or')) maliciousOperators.push('$or (logic bypass)');
    if (queryStr.includes('$and')) maliciousOperators.push('$and (condition manipulation)');

    const riskLevel = maliciousOperators.includes('$where') ? 'CRITICAL' : 'HIGH';
    const currentTime = new Date().toLocaleString();

    return `You are a senior cybersecurity analyst creating a comprehensive incident report for a detected NoSQL injection attack. This report will be distributed to technical teams, management, and potentially external stakeholders.

**INCIDENT DETAILS:**
- Attack Type: NoSQL Injection Attack
- Target Database Collection: ${attackData.collection || 'users'}
- Source IP Address: ${attackData.sourceIP || 'Unknown'}
- User Agent: ${attackData.userAgent || 'Unknown'}
- Detection Timestamp: ${attackData.detectedAt || currentTime}
- Incident ID: ${attackData.documentId || 'AUTO-GENERATED'}
- Risk Level: ${riskLevel}

**MALICIOUS PAYLOAD ANALYSIS:**
Raw Query Detected: ${JSON.stringify(query, null, 2)}
Malicious Operators Found: ${maliciousOperators.join(', ') || 'NoSQL injection operators detected'}

**INSTRUCTIONS:**
Create a professional, comprehensive 2-page security incident report with the following detailed sections. Write in clear, authoritative language suitable for both technical staff and executive leadership.

**EXECUTIVE SUMMARY**
Write a 4-5 sentence executive summary that explains:
- What happened in business terms
- The immediate threat level and potential impact
- Current status of the incident
- Key actions being taken

**INCIDENT ANALYSIS**
Provide a focused technical analysis including:
- Specific analysis of the malicious operators used in this attack
- How this attack could bypass normal authentication/authorization
- Potential data that could have been compromised
- Comparison to known attack patterns

**IMPACT ASSESSMENT**
Analyze the potential business and technical impact:
- Data confidentiality risks
- System availability threats
- Compliance and regulatory implications
- Financial impact estimates

**IMMEDIATE RESPONSE ACTIONS**
Detail the emergency response measures:
- Immediate containment steps taken
- System isolation procedures implemented
- User account security reviews
- Database access auditing
- Communication protocols activated

**ROOT CAUSE ANALYSIS**
Investigate how this attack was possible:
- Input validation weaknesses
- Authentication mechanism flaws
- Database configuration issues
- Application security gaps
- Monitoring blind spots

**REMEDIATION RECOMMENDATIONS**
Provide specific, actionable recommendations with priority levels:

HIGH PRIORITY (Implement within 24 hours):
- Specific code changes needed
- Database security configurations
- Access control improvements
- Monitoring enhancements

MEDIUM PRIORITY (Implement within 1 week):
- Additional security controls
- Process improvements
- Training requirements
- Security testing procedures

LOW PRIORITY (Implement within 1 month):
- Long-term architectural improvements
- Policy updates
- Compliance enhancements

**APPENDIX**
- Technical timeline of the attack
- Detailed payload analysis
- Related security events
- Reference materials and best practices

Write this report in a professional, authoritative tone. Include specific technical details while remaining accessible to non-technical stakeholders. Focus on actionable insights and concrete next steps. 

IMPORTANT: Do NOT include general explanations of NoSQL injection attacks, do NOT assess whether this was automated vs targeted, and do NOT discuss reputation/customer trust concerns. Focus on the specific incident, its impact, and concrete remediation steps.

Format the response with clear section headers using only the sections requested above. Do not use ** or other markdown formatting symbols.`;
  }

  // Legacy method for backward compatibility
  buildPrompt(attackData) {
    return this.buildOptimizedPrompt(attackData);
  }
}

module.exports = GeminiService;
