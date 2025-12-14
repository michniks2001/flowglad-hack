// Service definitions with pricing
export const SERVICES = {
  'security-audit': {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'Comprehensive security assessment and vulnerability scanning',
    price: 8000,
    timeline: '2 weeks',
    included: [
      'Full code security review',
      'Dependency vulnerability scan',
      'Penetration testing',
      'Security best practices report',
      'Remediation recommendations',
    ],
  },
  'performance-optimization': {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    description: 'Identify and fix performance bottlenecks',
    price: 10000,
    timeline: '3 weeks',
    included: [
      'Performance profiling',
      'Database query optimization',
      'Caching strategy implementation',
      'Load testing',
      'Performance improvement report',
    ],
  },
  'tech-stack-migration': {
    id: 'tech-stack-migration',
    name: 'Tech Stack Migration',
    description: 'Modernize your technology stack',
    price: 15000,
    timeline: '6-8 weeks',
    included: [
      'Migration planning',
      'Code refactoring',
      'Testing and QA',
      'Deployment strategy',
      'Team training',
    ],
  },
  'monthly-retainer-basic': {
    id: 'monthly-retainer-basic',
    name: 'Monthly Retainer - Basic',
    description: 'Ongoing support and maintenance',
    price: 3000,
    timeline: 'Monthly',
    included: [
      '20 hours/month consulting',
      'Code reviews',
      'Technical support',
      'Monthly strategy session',
    ],
  },
  'monthly-retainer-premium': {
    id: 'monthly-retainer-premium',
    name: 'Monthly Retainer - Premium',
    description: 'Comprehensive ongoing support',
    price: 7500,
    timeline: 'Monthly',
    included: [
      '50 hours/month consulting',
      'Priority support',
      'Architecture reviews',
      'Team mentoring',
      'Weekly strategy sessions',
    ],
  },
};

export function mapServicesToProposal(analysis: {
  issues: Array<{ recommendedService: string }>;
  opportunities: Array<{ recommendedService: string }>;
}) {
  const serviceIds = new Set<string>();
  
  analysis.issues.forEach((issue) => {
    if (issue.recommendedService) {
      serviceIds.add(issue.recommendedService);
    }
  });
  
  analysis.opportunities.forEach((opp) => {
    if (opp.recommendedService) {
      serviceIds.add(opp.recommendedService);
    }
  });

  return Array.from(serviceIds).map((id) => SERVICES[id as keyof typeof SERVICES]).filter(Boolean);
}

