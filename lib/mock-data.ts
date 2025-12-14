import { SERVICES } from './flowglad';
import { buildDefaultUiConfiguration } from '@/lib/ui-config';

export function getMockProposal() {
  const proposal = {
    id: 'demo',
    clientName: 'Acme Corp',
    repoUrl: 'https://github.com/acme/app',
    analysis: {
      techStack: ['React', 'Node.js', 'MongoDB', 'Express'],
      issues: [
        {
          id: '1',
          title: 'No Rate Limiting on API Endpoints',
          severity: 'critical' as const,
          description:
            'Your API endpoints lack rate limiting, making them vulnerable to DDoS attacks and abuse. This could lead to service disruption and unexpected costs.',
          impact: 'Vulnerable to DDoS attacks, could cost $50k+ in downtime and infrastructure costs',
          recommendedService: 'security-audit',
        },
        {
          id: '2',
          title: 'Missing Environment Variable Validation',
          severity: 'high' as const,
          description:
            'The application does not validate required environment variables at startup, which could lead to runtime errors in production.',
          impact: 'Potential production outages and poor developer experience',
          recommendedService: 'security-audit',
        },
        {
          id: '3',
          title: 'Inefficient Database Queries',
          severity: 'medium' as const,
          description:
            'Several database queries lack proper indexing and use N+1 query patterns, causing slow response times under load.',
          impact: 'Poor user experience, higher infrastructure costs, scalability issues',
          recommendedService: 'performance-optimization',
        },
        {
          id: '4',
          title: 'Outdated Dependencies',
          severity: 'low' as const,
          description:
            'Multiple dependencies are outdated and may contain security vulnerabilities.',
          impact: 'Security risks and missing new features',
          recommendedService: 'monthly-retainer-basic',
        },
      ],
      opportunities: [
        {
          title: 'TypeScript Migration',
          description:
            'Migrating to TypeScript would improve type safety, developer experience, and catch bugs at compile time.',
          recommendedService: 'tech-stack-migration',
        },
        {
          title: 'CI/CD Pipeline Implementation',
          description:
            'Implementing automated testing and deployment would reduce manual errors and speed up releases.',
          recommendedService: 'monthly-retainer-premium',
        },
      ],
    },
    services: [
      SERVICES['security-audit'],
      SERVICES['performance-optimization'],
      SERVICES['tech-stack-migration'],
      SERVICES['monthly-retainer-basic'],
      SERVICES['monthly-retainer-premium'],
    ],
    generatedAt: new Date().toISOString(),
  };
  return { ...proposal, uiConfiguration: buildDefaultUiConfiguration(proposal.analysis, proposal.id) };
}

