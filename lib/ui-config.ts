import type { RepoAnalysis, UiConfiguration, UiVisualization, Severity, UiSection } from '@/lib/types/proposal';

const DEFAULT_SECTIONS: UiSection[] = [
  { id: 'executive', order: 1, style: 'prominent' },
  { id: 'visualizations', order: 2, style: 'compact' },
  { id: 'issues', order: 3, style: 'cards' },
  { id: 'opportunities', order: 4, style: 'list' },
];

// Deterministic pseudo-random helpers (stable variation per proposal).
// This gives us "randomness" without changing layout every refresh.
function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let x = seed || 123456789;
  return () => {
    // xorshift32
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    // 0..1
    return ((x >>> 0) & 0xffffffff) / 0xffffffff;
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function shuffleInPlace<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickWeighted<T extends string>(weights: Record<T, number>, rand: () => number): T {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0) || 1;
  let r = rand() * total;
  for (const [k, w0] of entries) {
    const w = Math.max(0, w0);
    r -= w;
    if (r <= 0) return k;
  }
  return entries[0][0];
}

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

function baseUiFromHeuristics(analysis: RepoAnalysis): UiConfiguration {
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

export function normalizeUiConfiguration(input: any, analysis: RepoAnalysis, seedSource?: string): UiConfiguration {
  const fallback = baseUiFromHeuristics(analysis);
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

function applyUiVariation(
  ui: UiConfiguration,
  analysis: RepoAnalysis,
  seedSource: string,
  intensity: number
): UiConfiguration {
  const t = clamp01(intensity);
  if (t <= 0) return ui;

  const seed = fnv1a32(`${seedSource}|${analysis.techStack.join(',')}|${analysis.issues.length}|${analysis.opportunities.length}`);
  const rand = makeRng(seed);

  const criticalCount = analysis.issues.filter((i) => i.severity === 'critical').length;
  const highCount = analysis.issues.filter((i) => i.severity === 'high').length;
  const issuesCount = analysis.issues.length;
  const oppCount = analysis.opportunities.length;
  const techStackComplexity = analysis.techStack.length;
  const modernizationOpps = analysis.opportunities.filter((o) => o.recommendedService === 'tech-stack-migration').length;

  // Guardrails: prevent "too cute" layouts for very risky projects.
  const lockedRisky = criticalCount >= 4 || highCount >= 6;
  const tinyProject = issuesCount <= 2 && oppCount <= 2 && techStackComplexity <= 4;

  const allowedLayouts: UiConfiguration['layout'][] = lockedRisky
    ? ['dashboard', 'tabbed']
    : tinyProject
      ? ['linear', 'timeline']
      : ['dashboard', 'linear', 'tabbed', 'timeline'];

  // Weighted choice + noise (noise increases with intensity).
  const baseWeights: Record<UiConfiguration['layout'], number> = {
    dashboard: 1 + criticalCount * 1.8 + highCount * 1.1,
    tabbed: 1 + Math.max(0, techStackComplexity - 4) * 0.9 + (issuesCount >= 10 ? 2.5 : 0),
    timeline: 1 + modernizationOpps * 1.6 + (oppCount >= 3 ? 1.0 : 0) + (issuesCount <= 6 ? 0.8 : 0),
    linear: 1 + (issuesCount <= 6 ? 1.2 : 0) + (techStackComplexity <= 4 ? 0.8 : 0),
  };

  const noisyWeights = { ...baseWeights } as Record<UiConfiguration['layout'], number>;
  (Object.keys(noisyWeights) as UiConfiguration['layout'][]).forEach((k) => {
    const jitter = 1 + (rand() - 0.5) * 2 * (0.65 * t); // up to ±65% at t=1
    noisyWeights[k] = noisyWeights[k] * jitter;
  });

  // Zero-out disallowed layouts.
  (Object.keys(noisyWeights) as UiConfiguration['layout'][]).forEach((k) => {
    if (!allowedLayouts.includes(k)) noisyWeights[k] = 0;
  });

  const shouldRerollLayout = rand() < 0.55 * t; // more intensity => more rerolls
  const layout = shouldRerollLayout ? pickWeighted(noisyWeights, rand) : ui.layout;
  const finalLayout: UiConfiguration['layout'] = allowedLayouts.includes(layout) ? layout : allowedLayouts[0];

  // Emphasis can vary slightly on non-risky projects.
  const emphasize: UiConfiguration['emphasize'] =
    lockedRisky
      ? 'critical-issues'
      : rand() < 0.35 * t
        ? (pickWeighted(
            {
              'critical-issues': criticalCount > 0 ? 2 : 0.5,
              opportunities: oppCount >= issuesCount ? 1.7 : 1.0,
              balanced: 1.3,
            },
            rand
          ) as UiConfiguration['emphasize'])
        : ui.emphasize;

  // Color scheme: keep red-alert if any critical/high density suggests risk.
  let colorScheme: UiConfiguration['colorScheme'] = ui.colorScheme;
  if (!lockedRisky && criticalCount === 0) {
    if (rand() < 0.45 * t) {
      colorScheme = pickWeighted(
        {
          balanced: 1.4,
          'opportunity-green': oppCount >= 2 ? 1.2 : 0.6,
          'red-alert': 0,
        } as any,
        rand
      ) as UiConfiguration['colorScheme'];
    }
  } else {
    colorScheme = 'red-alert';
  }

  // Sections: choose among templates per layout for variation.
  const sectionTemplates: Record<UiConfiguration['layout'], UiSection[][]> = {
    dashboard: [
      [
        { id: 'metrics', order: 1, style: 'prominent' },
        { id: 'visualizations', order: 2, style: 'compact' },
        { id: 'issues', order: 3, style: 'grid' },
        { id: 'opportunities', order: 4, style: 'compact' },
      ],
      [
        { id: 'executive', order: 1, style: 'prominent' },
        { id: 'metrics', order: 2, style: 'compact' },
        { id: 'issues', order: 3, style: 'grid' },
        { id: 'visualizations', order: 4, style: 'compact' },
        { id: 'opportunities', order: 5, style: 'compact' },
      ],
    ],
    linear: [
      DEFAULT_SECTIONS,
      [
        { id: 'executive', order: 1, style: 'prominent' },
        { id: 'issues', order: 2, style: 'cards' },
        { id: 'visualizations', order: 3, style: 'compact' },
        { id: 'opportunities', order: 4, style: 'list' },
      ],
      [
        { id: 'executive', order: 1, style: 'prominent' },
        { id: 'visualizations', order: 2, style: 'compact' },
        { id: 'issues', order: 3, style: 'list' },
        { id: 'opportunities', order: 4, style: 'cards' },
      ],
    ],
    tabbed: [
      [
        { id: 'executive', order: 1, style: 'prominent' },
        { id: 'visualizations', order: 2, style: 'compact' },
        { id: 'issues', order: 3, style: 'cards' },
        { id: 'opportunities', order: 4, style: 'list' },
        { id: 'services', order: 5, style: 'list' },
      ],
    ],
    timeline: [
      [
        { id: 'executive', order: 1, style: 'prominent' },
        { id: 'visualizations', order: 2, style: 'prominent' },
        { id: 'opportunities', order: 3, style: 'list' },
        { id: 'issues', order: 4, style: 'compact' },
      ],
      [
        { id: 'executive', order: 1, style: 'prominent' },
        { id: 'opportunities', order: 2, style: 'cards' },
        { id: 'visualizations', order: 3, style: 'compact' },
        { id: 'issues', order: 4, style: 'compact' },
      ],
    ],
  };

  let sections = ui.sections;
  if (rand() < 0.75 * t) {
    const options = sectionTemplates[finalLayout] || [ui.sections];
    sections = options[Math.floor(rand() * options.length)];
  }

  // Visualizations: shuffle order a bit (and sometimes limit to 2 for cleaner layouts).
  let visualizations = ui.visualizations?.slice() ?? [];
  if (visualizations.length > 1 && rand() < 0.7 * t) {
    visualizations = shuffleInPlace(visualizations, rand);
  }
  if (visualizations.length > 2 && rand() < 0.4 * t) {
    visualizations = visualizations.slice(0, 2);
  }

  // CTA message minor variation (keep type stable unless non-risky).
  const callToAction =
    lockedRisky
      ? { type: 'urgent' as const, message: ui.callToAction?.message || 'Critical risks detected — address high-severity issues first.' }
      : rand() < 0.4 * t
        ? {
            type: emphasize === 'opportunities' ? 'educational' : ui.callToAction.type,
            message:
              emphasize === 'opportunities'
                ? 'A few targeted upgrades can unlock major wins — choose the improvements that fit your roadmap.'
                : 'Pick the recommended services to convert this proposal into an execution plan.',
          }
        : ui.callToAction;

  return {
    ...ui,
    layout: finalLayout,
    emphasize,
    colorScheme,
    sections,
    visualizations,
    callToAction,
  };
}

export function finalizeUiConfiguration(input: any, analysis: RepoAnalysis, seedSource?: string): UiConfiguration {
  const seed = seedSource || 'default';
  const base = input ? normalizeUiConfiguration(input, analysis, seed) : baseUiFromHeuristics(analysis);
  // If Gemini provided a config, vary a bit; if not, vary more.
  const intensity = input ? 0.28 : 0.55;
  return applyUiVariation(base, analysis, seed, intensity);
}

export function buildDefaultUiConfiguration(analysis: RepoAnalysis, seedSource?: string): UiConfiguration {
  return finalizeUiConfiguration(null, analysis, seedSource);
}


