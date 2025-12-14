import type { RepoAnalysis, UiConfiguration, UiVisualization, Severity, UiSection } from '@/lib/types/proposal';

const DEFAULT_SECTIONS: UiSection[] = [
  { id: 'executive', order: 1, style: 'prominent' },
  { id: 'visualizations', order: 2, style: 'compact' },
  { id: 'issues', order: 3, style: 'cards' },
  { id: 'opportunities', order: 4, style: 'list' },
];

function severityScore(sev: Severity): number {
  switch (sev) {
    case 'critical':
      return 10;
    case 'high':
      return 8;
    case 'medium':
      return 5;
    case 'low':
      return 2;
    default:
      return 5;
  }
}

export function buildDefaultUiConfiguration(analysis: RepoAnalysis): UiConfiguration {
  const criticalCount = analysis.issues.filter((i) => i.severity === 'critical').length;
  const highCount = analysis.issues.filter((i) => i.severity === 'high').length;
  const issuesCount = analysis.issues.length;
  const oppCount = analysis.opportunities.length;
  const techStackComplexity = analysis.techStack.length;

  let layout: UiConfiguration['layout'] = 'linear';
  if (criticalCount >= 3 || highCount >= 5) layout = 'dashboard';
  else if (oppCount >= 3 && issuesCount <= 4) layout = 'timeline';
  else if (techStackComplexity >= 6 || issuesCount >= 10) layout = 'tabbed';

  const emphasize: UiConfiguration['emphasize'] =
    criticalCount > 0 ? 'critical-issues' : oppCount > issuesCount ? 'opportunities' : 'balanced';

  const colorScheme: UiConfiguration['colorScheme'] =
    criticalCount > 0 ? 'red-alert' : emphasize === 'opportunities' ? 'opportunity-green' : 'balanced';

  const visualizations: UiVisualization[] = [];

  // If security risks look severe, include a risk matrix.
  if (criticalCount > 0 || highCount > 0) {
    visualizations.push({
      type: 'risk-matrix',
      data: {
        items: analysis.issues
          .filter((i) => i.severity === 'critical' || i.severity === 'high')
          .slice(0, 8)
          .map((i) => ({
            name: i.title,
            severity: severityScore(i.severity),
            likelihood: i.severity === 'critical' ? 8 : 6,
          })),
      },
    });
  }

  // If technical debt seems high, include a tech debt chart.
  if (issuesCount >= 6) {
    const bySeverity = analysis.issues.reduce<Record<string, number>>((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {});
    visualizations.push({
      type: 'tech-debt-chart',
      data: {
        items: [
          { label: 'Critical', value: bySeverity.critical || 0 },
          { label: 'High', value: bySeverity.high || 0 },
          { label: 'Medium', value: bySeverity.medium || 0 },
          { label: 'Low', value: bySeverity.low || 0 },
        ],
      },
    });
  }

  // If there are modernization opportunities, include a roadmap timeline.
  const modernizationOpps = analysis.opportunities.filter((o) => o.recommendedService === 'tech-stack-migration');
  if (modernizationOpps.length > 0 || layout === 'timeline') {
    visualizations.push({
      type: 'roadmap-timeline',
      data: {
        phases: [
          {
            name: 'Quick Wins',
            duration: '2 weeks',
            items: analysis.issues
              .filter((i) => i.severity === 'low' || i.severity === 'medium')
              .slice(0, 4)
              .map((i) => i.title),
          },
          {
            name: 'Core Improvements',
            duration: '3–6 weeks',
            items: analysis.issues
              .filter((i) => i.severity === 'high' || i.severity === 'critical')
              .slice(0, 4)
              .map((i) => i.title),
          },
          {
            name: 'Modernization',
            duration: '6–10 weeks',
            items: modernizationOpps.slice(0, 4).map((o) => o.title),
          },
        ].filter((p) => Array.isArray(p.items) && p.items.length > 0),
      },
    });
  }

  const callToAction =
    colorScheme === 'red-alert'
      ? {
          type: 'urgent' as const,
          message:
            criticalCount > 0
              ? 'Critical risks detected — address high-severity issues before shipping new features.'
              : 'High-severity issues detected — prioritize remediation to reduce risk and downtime.',
        }
      : emphasize === 'opportunities'
        ? {
            type: 'educational' as const,
            message: 'Unlock growth with targeted improvements — pick the services that match your roadmap.',
          }
        : {
            type: 'standard' as const,
            message: 'Select recommended services below to turn this proposal into an actionable engagement.',
          };

  return {
    layout,
    emphasize,
    visualizations,
    sections:
      layout === 'dashboard'
        ? [
            { id: 'metrics', order: 1, style: 'prominent' },
            { id: 'visualizations', order: 2, style: 'compact' },
            { id: 'issues', order: 3, style: 'grid' },
            { id: 'opportunities', order: 4, style: 'compact' },
          ]
        : DEFAULT_SECTIONS,
    colorScheme,
    callToAction,
  };
}

export function normalizeUiConfiguration(input: any, analysis: RepoAnalysis): UiConfiguration {
  const fallback = buildDefaultUiConfiguration(analysis);
  if (!input || typeof input !== 'object') return fallback;

  const layout = ['dashboard', 'linear', 'tabbed', 'timeline'].includes(input.layout) ? input.layout : fallback.layout;
  const emphasize = ['critical-issues', 'opportunities', 'balanced'].includes(input.emphasize)
    ? input.emphasize
    : fallback.emphasize;
  const colorScheme = ['red-alert', 'balanced', 'opportunity-green'].includes(input.colorScheme)
    ? input.colorScheme
    : fallback.colorScheme;

  const visualizations: UiVisualization[] = Array.isArray(input.visualizations)
    ? input.visualizations
        .map((v: any) => {
          if (!v || typeof v !== 'object') return null;
          if (v.type === 'risk-matrix' || v.type === 'tech-debt-chart' || v.type === 'roadmap-timeline') {
            return { type: v.type, data: v.data ?? {} } as UiVisualization;
          }
          return null;
        })
        .filter((v: UiVisualization | null): v is UiVisualization => Boolean(v))
    : fallback.visualizations;

  const sections: UiSection[] = Array.isArray(input.sections)
    ? input.sections
        .map((s: any) => {
          if (!s || typeof s !== 'object') return null;
          const id = typeof s.id === 'string' ? s.id : null;
          const order = Number.isFinite(s.order) ? s.order : null;
          const style = typeof s.style === 'string' ? s.style : null;
          if (!id || order == null || !style) return null;
          return { id, order, style } as UiSection;
        })
        .filter((s: UiSection | null): s is UiSection => Boolean(s))
        .sort((a: UiSection, b: UiSection) => a.order - b.order)
    : fallback.sections;

  const callToAction =
    input.callToAction && typeof input.callToAction === 'object'
      ? {
          type: ['urgent', 'standard', 'educational'].includes(input.callToAction.type)
            ? input.callToAction.type
            : fallback.callToAction.type,
          message:
            typeof input.callToAction.message === 'string' && input.callToAction.message.trim().length > 0
              ? input.callToAction.message
              : fallback.callToAction.message,
        }
      : fallback.callToAction;

  return { layout, emphasize, visualizations, sections, colorScheme, callToAction };
}


