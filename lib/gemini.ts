import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RepoAnalysis, UiConfiguration } from '@/lib/types/proposal';
import { normalizeUiConfiguration, buildDefaultUiConfiguration } from '@/lib/ui-config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeRepository(repoData: {
  repoName: string;
  readme: string;
  dependencies: string[];
  techStack: string[];
  url?: string; // Optional URL for website analysis
  source?: 'github' | 'website'; // Source type
}): Promise<RepoAnalysis & { uiConfiguration?: UiConfiguration }> {
  // If no API key, return mock data for demo
  if (!process.env.GEMINI_API_KEY) {
    return getMockAnalysis();
  }

  // Configure model with web access for website analysis
  const modelConfig: any = { model: 'gemini-2.5-flash-lite' };
  
  // Enable web search/grounding for website URLs
  if (repoData.source === 'website' && repoData.url) {
    modelConfig.tools = [{
      googleSearchRetrieval: {}
    }];
  }

  const model = genAI.getGenerativeModel(modelConfig);

  // Prepare the prompt with repository data
  const readmeContent = repoData.readme.substring(0, 4000); // Increased limit for flash-lite
  const dependenciesList = repoData.dependencies.slice(0, 50).join(', '); // Limit dependencies

  // Build prompt based on source type
  let prompt = '';
  
  if (repoData.source === 'website' && repoData.url) {
    // For websites, instruct Gemini to fetch and analyze the website using web search
    prompt = `You are an expert technical consultant analyzing a website for a consulting proposal.

Website URL to analyze: ${repoData.url}
Website Title: ${repoData.repoName}
Detected Tech Stack: ${repoData.techStack.join(', ')}

CRITICAL INSTRUCTIONS:
1. Use Google Search to fetch and analyze the actual live website at ${repoData.url}
2. Visit the website and examine its current state, code, and implementation
3. Analyze the website's technical implementation, not just the provided summary

Examine the website for:
- Security vulnerabilities (missing HTTPS, insecure headers, XSS risks, CSRF protection)
- Performance issues (slow loading, unoptimized images, missing caching, render-blocking resources)
- SEO problems (missing meta tags, poor structure, missing sitemap, no structured data)
- Accessibility issues (missing alt text, poor contrast, keyboard navigation, ARIA labels)
- Code quality (outdated libraries, inline styles, poor structure, missing minification)
- Mobile responsiveness (viewport issues, touch targets, responsive design)
- Modern web standards (PWA features, service workers, modern APIs, browser compatibility)

Current Content Summary (use as reference, but analyze the actual live website):
${readmeContent}

IMPORTANT: Your analysis should be based on the actual live website content fetched via Google Search, not just the summary above.

Analyze this website and identify:
1. Critical security issues (focus on vulnerabilities, missing security measures, insecure configurations)
2. Performance bottlenecks (slow loading, inefficient code, missing caching, unoptimized assets)
3. Scalability concerns (architecture limitations, resource constraints, traffic handling)
4. Technical debt (outdated dependencies, code quality issues, legacy code)
5. Missing best practices (testing, documentation, CI/CD, monitoring, SEO, accessibility)

For each issue found, provide:
- A unique ID (use format: "issue-1", "issue-2", etc.)
- Title (concise, actionable)
- Severity: "critical", "high", "medium", or "low"
- Description (2-3 sentences explaining the issue)
- Impact (business impact in 1 sentence)
- Recommended service: "security-audit", "performance-optimization", "tech-stack-migration", "monthly-retainer-basic", or "monthly-retainer-premium"

Also identify 2-3 opportunities for improvement (optimizations, modernizations, enhancements).

After generating issues and opportunities, ALSO determine the optimal UI presentation for the proposal.

UI RULES (use intelligent defaults):
- If there are 3+ critical issues (or security risks), use layout "dashboard" with colorScheme "red-alert"
- If the project is a simple static site with few issues, prefer "linear"
- If tech stack is complex (many technologies), use "tabbed"
- If there are significant modernization opportunities, include a "roadmap-timeline" visualization and use layout "timeline"
- If technical debt is high, include a "tech-debt-chart" visualization
- If security risks are severe, include a "risk-matrix" visualization
- If unsure, default layout "linear" and colorScheme "balanced"

Return ONLY valid JSON (no markdown, no code blocks, no explanations) with this exact structure:
{
  "techStack": ["React", "Node.js"],
  "issues": [
    {
      "id": "issue-1",
      "title": "Issue title",
      "severity": "critical",
      "description": "Detailed description of the issue",
      "impact": "Business impact statement",
      "recommendedService": "security-audit"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Description of the opportunity",
      "recommendedService": "tech-stack-migration"
    }
  ],
  "uiConfiguration": {
    "layout": "dashboard",
    "emphasize": "critical-issues",
    "visualizations": [
      { "type": "risk-matrix", "data": { "items": [ { "name": "SQL Injection", "severity": 9, "likelihood": 8 } ] } }
    ],
    "sections": [
      { "id": "executive", "order": 1, "style": "prominent" },
      { "id": "issues", "order": 2, "style": "cards" },
      { "id": "opportunities", "order": 3, "style": "compact" }
    ],
    "colorScheme": "red-alert",
    "callToAction": { "type": "urgent", "message": "Critical vulnerabilities require immediate attention" }
  }
}

CRITICAL: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanations.`;
  } else {
    // For GitHub repos, use the provided README content
    prompt = `You are an expert technical consultant analyzing a software project for a consulting proposal.

Repository: ${repoData.repoName}
Tech Stack Detected: ${repoData.techStack.join(', ')}
README Content:
${readmeContent}
Dependencies (first 50): ${dependenciesList}

Analyze this project and identify:
1. Critical security issues (focus on vulnerabilities, missing security measures)
2. Performance bottlenecks (slow queries, inefficient code, missing caching)
3. Scalability concerns (architecture limitations, resource constraints)
4. Technical debt (outdated dependencies, code quality issues)
5. Missing best practices (testing, documentation, CI/CD, monitoring)

For each issue found, provide:
- A unique ID (use format: "issue-1", "issue-2", etc.)
- Title (concise, actionable)
- Severity: "critical", "high", "medium", or "low"
- Description (2-3 sentences explaining the issue)
- Impact (business impact in 1 sentence)
- Recommended service: "security-audit", "performance-optimization", "tech-stack-migration", "monthly-retainer-basic", or "monthly-retainer-premium"

Also identify 2-3 opportunities for improvement (optimizations, modernizations, enhancements).

After generating issues and opportunities, ALSO determine the optimal UI presentation for the proposal.

UI RULES (use intelligent defaults):
- If there are 3+ critical issues (or security risks), use layout "dashboard" with colorScheme "red-alert"
- If the project is simple with few issues, prefer "linear"
- If tech stack is complex (many technologies), use "tabbed"
- If there are significant modernization opportunities, include a "roadmap-timeline" visualization and use layout "timeline"
- If technical debt is high, include a "tech-debt-chart" visualization
- If security risks are severe, include a "risk-matrix" visualization
- If unsure, default layout "linear" and colorScheme "balanced"

Return ONLY valid JSON (no markdown, no code blocks, no explanations) with this exact structure:
{
  "techStack": ["React", "Node.js"],
  "issues": [
    {
      "id": "issue-1",
      "title": "Issue title",
      "severity": "critical",
      "description": "Detailed description of the issue",
      "impact": "Business impact statement",
      "recommendedService": "security-audit"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Description of the opportunity",
      "recommendedService": "tech-stack-migration"
    }
  ],
  "uiConfiguration": {
    "layout": "dashboard",
    "emphasize": "critical-issues",
    "visualizations": [
      { "type": "risk-matrix", "data": { "items": [ { "name": "SQL Injection", "severity": 9, "likelihood": 8 } ] } }
    ],
    "sections": [
      { "id": "executive", "order": 1, "style": "prominent" },
      { "id": "issues", "order": 2, "style": "cards" },
      { "id": "opportunities", "order": 3, "style": "compact" }
    ],
    "colorScheme": "red-alert",
    "callToAction": { "type": "urgent", "message": "Critical vulnerabilities require immediate attention" }
  }
}

CRITICAL: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanations.`;
  }

  try {
    console.log('Calling Gemini API with model: gemini-2.5-flash-lite');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('Gemini raw response length:', text.length);
    console.log('Gemini raw response preview:', text.substring(0, 200));

    // Clean up response (remove markdown code blocks if present)
    let cleanJson = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    // Extract JSON object if it's wrapped in other text
    if (!cleanJson.startsWith('{')) {
      const jsonStart = cleanJson.indexOf('{');
      if (jsonStart !== -1) {
        cleanJson = cleanJson.substring(jsonStart);
      }
    }
    
    // Find the matching closing brace
    if (cleanJson.startsWith('{')) {
      let braceCount = 0;
      let endIndex = -1;
      for (let i = 0; i < cleanJson.length; i++) {
        if (cleanJson[i] === '{') braceCount++;
        if (cleanJson[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex !== -1) {
        cleanJson = cleanJson.substring(0, endIndex);
      }
    }

    // If still not valid JSON, try to extract JSON from the response
    if (!cleanJson.startsWith('{')) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validate the structure
    if (!parsed.techStack || !Array.isArray(parsed.techStack)) {
      parsed.techStack = repoData.techStack;
    }
    if (!parsed.issues || !Array.isArray(parsed.issues)) {
      parsed.issues = [];
    }
    if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
      parsed.opportunities = [];
    }

    // Ensure all issues have required fields
    parsed.issues = parsed.issues.map((issue: any, index: number) => ({
      id: issue.id || `issue-${index + 1}`,
      title: issue.title || 'Untitled Issue',
      severity: issue.severity || 'medium',
      description: issue.description || 'No description provided',
      impact: issue.impact || 'Unknown impact',
      recommendedService: issue.recommendedService || 'monthly-retainer-basic',
    }));

    // Ensure all opportunities have required fields
    parsed.opportunities = parsed.opportunities.map((opp: any) => ({
      title: opp.title || 'Untitled Opportunity',
      description: opp.description || 'No description provided',
      recommendedService: opp.recommendedService || 'monthly-retainer-basic',
    }));

    // Validate/normalize UI configuration (fallback to heuristic defaults)
    try {
      parsed.uiConfiguration = normalizeUiConfiguration(parsed.uiConfiguration, {
        techStack: parsed.techStack,
        issues: parsed.issues,
        opportunities: parsed.opportunities,
      });
    } catch (e) {
      parsed.uiConfiguration = buildDefaultUiConfiguration({
        techStack: parsed.techStack,
        issues: parsed.issues,
        opportunities: parsed.opportunities,
      });
    }

    console.log('Successfully parsed Gemini response:', {
      techStack: parsed.techStack.length,
      issues: parsed.issues.length,
      opportunities: parsed.opportunities.length,
    });

    return parsed;
  } catch (error: any) {
    console.error('Gemini API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    
    // Fallback to mock data
    console.warn('Falling back to mock analysis data');
    return getMockAnalysis();
  }
}

function getMockAnalysis(): RepoAnalysis & { uiConfiguration?: UiConfiguration } {
  const analysis: RepoAnalysis = {
    techStack: ['React', 'Node.js', 'MongoDB', 'Express'],
    issues: [
      {
        id: '1',
        title: 'No Rate Limiting on API Endpoints',
        severity: 'critical',
        description: 'Your API endpoints lack rate limiting, making them vulnerable to DDoS attacks and abuse. This could lead to service disruption and unexpected costs.',
        impact: 'Vulnerable to DDoS attacks, could cost $50k+ in downtime and infrastructure costs',
        recommendedService: 'security-audit',
      },
      {
        id: '2',
        title: 'Missing Environment Variable Validation',
        severity: 'high',
        description: 'The application does not validate required environment variables at startup, which could lead to runtime errors in production.',
        impact: 'Potential production outages and poor developer experience',
        recommendedService: 'security-audit',
      },
      {
        id: '3',
        title: 'Inefficient Database Queries',
        severity: 'medium',
        description: 'Several database queries lack proper indexing and use N+1 query patterns, causing slow response times under load.',
        impact: 'Poor user experience, higher infrastructure costs, scalability issues',
        recommendedService: 'performance-optimization',
      },
    ],
    opportunities: [
      {
        title: 'TypeScript Migration',
        description: 'Migrating to TypeScript would improve type safety, developer experience, and catch bugs at compile time.',
        recommendedService: 'tech-stack-migration',
      },
      {
        title: 'CI/CD Pipeline Implementation',
        description: 'Implementing automated testing and deployment would reduce manual errors and speed up releases.',
        recommendedService: 'monthly-retainer-premium',
      },
    ],
  };
  return { ...analysis, uiConfiguration: buildDefaultUiConfiguration(analysis) };
}

