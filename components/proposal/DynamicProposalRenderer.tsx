'use client';

import { useMemo, useState } from 'react';
import type { Proposal, UiConfiguration, Severity, Issue, Opportunity } from '@/lib/types/proposal';
import { buildDefaultUiConfiguration, normalizeUiConfiguration } from '@/lib/ui-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Lightbulb, Sparkles, Calendar, LayoutDashboard, Rows3, PanelsTopLeft, Timer } from 'lucide-react';
import { RiskMatrix } from '@/components/proposal/visualizations/RiskMatrix';
import { TechDebtChart } from '@/components/proposal/visualizations/TechDebtChart';
import { RoadmapTimeline } from '@/components/proposal/visualizations/RoadmapTimeline';

function severityVariant(sev: Severity): any {
  return sev;
}

function ctaClasses(colorScheme: UiConfiguration['colorScheme']) {
  switch (colorScheme) {
    case 'red-alert':
      return 'border-red-200 bg-red-50 text-red-900';
    case 'opportunity-green':
      return 'border-green-200 bg-green-50 text-green-900';
    default:
      return 'border-gray-200 bg-white text-gray-900';
  }
}

function layoutBadge(layout: UiConfiguration['layout']) {
  switch (layout) {
    case 'dashboard':
      return { label: 'Dashboard', Icon: LayoutDashboard };
    case 'tabbed':
      return { label: 'Tabbed', Icon: PanelsTopLeft };
    case 'timeline':
      return { label: 'Timeline', Icon: Timer };
    default:
      return { label: 'Linear', Icon: Rows3 };
  }
}

function ServiceToggle({
  service,
  checked,
  onToggle,
}: {
  service: Proposal['services'][number];
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox checked={checked} onChange={onToggle} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{service.name}</p>
              <p className="text-sm text-gray-600">{service.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-lg text-gray-900">${service.price.toLocaleString()}</p>
              <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3" />
                {service.timeline}
              </p>
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}

function IssuesBlock({
  proposal,
  issues,
  style,
  selectedServices,
  onServiceToggle,
  title,
  tone,
}: {
  proposal: Proposal;
  issues: Issue[];
  style: 'grid' | 'list' | 'cards' | 'compact' | 'prominent';
  selectedServices: Set<string>;
  onServiceToggle: (serviceId: string) => void;
  title: string;
  tone: 'red' | 'orange' | 'gray';
}) {
  const border = tone === 'red' ? 'border-l-red-500' : tone === 'orange' ? 'border-l-orange-500' : 'border-l-gray-300';
  const iconColor = tone === 'red' ? 'text-red-600' : tone === 'orange' ? 'text-orange-600' : 'text-gray-700';
  const Icon = AlertTriangle;

  const wrapperClass =
    style === 'grid'
      ? 'grid gap-4 md:grid-cols-2'
      : 'space-y-4';

  return (
    <Card className={`border-0 shadow-lg border-l-4 ${border}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${iconColor}`}>
          <Icon className="w-5 h-5" />
          {title} ({issues.length})
        </CardTitle>
        <CardDescription className="text-gray-600">
          Prioritized findings based on severity and impact.
        </CardDescription>
      </CardHeader>
      <CardContent className={wrapperClass}>
        {issues.map((issue) => {
          const service = proposal.services.find((s) => s.id === issue.recommendedService);
          const base =
            issue.severity === 'critical'
              ? 'bg-red-50 border-red-200'
              : issue.severity === 'high'
                ? 'bg-orange-50 border-orange-200'
                : issue.severity === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200';
          return (
            <div key={issue.id} className={`p-4 rounded-lg border ${base}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                    <Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{issue.description}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Impact:</strong> {issue.impact}
                  </p>
                </div>
              </div>
              {service && (
                <ServiceToggle
                  service={service}
                  checked={selectedServices.has(service.id)}
                  onToggle={() => onServiceToggle(service.id)}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function OpportunitiesBlock({
  proposal,
  opportunities,
  style,
  selectedServices,
  onServiceToggle,
}: {
  proposal: Proposal;
  opportunities: Opportunity[];
  style: 'grid' | 'list' | 'cards' | 'compact' | 'prominent';
  selectedServices: Set<string>;
  onServiceToggle: (serviceId: string) => void;
}) {
  const wrapperClass = style === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4';
  return (
    <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Lightbulb className="w-5 h-5" />
          Opportunities ({opportunities.length})
        </CardTitle>
        <CardDescription className="text-gray-600">
          High-leverage improvements that can increase reliability, performance, and maintainability.
        </CardDescription>
      </CardHeader>
      <CardContent className={wrapperClass}>
        {opportunities.map((opp) => {
          const service = proposal.services.find((s) => s.id === opp.recommendedService);
          return (
            <div key={opp.title} className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{opp.title}</h3>
                  <p className="text-gray-700">{opp.description}</p>
                </div>
              </div>
              {service && (
                <ServiceToggle
                  service={service}
                  checked={selectedServices.has(service.id)}
                  onToggle={() => onServiceToggle(service.id)}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function VisualizationsBlock({ ui }: { ui: UiConfiguration }) {
  if (!ui.visualizations || ui.visualizations.length === 0) return null;

  return (
    <div className="space-y-4">
      {ui.visualizations.map((viz, idx) => {
        if (viz.type === 'risk-matrix') return <RiskMatrix key={`${viz.type}-${idx}`} data={viz.data} />;
        if (viz.type === 'tech-debt-chart') return <TechDebtChart key={`${viz.type}-${idx}`} data={viz.data} />;
        if (viz.type === 'roadmap-timeline') return <RoadmapTimeline key={`${viz.type}-${idx}`} data={viz.data} />;
        return null;
      })}
    </div>
  );
}

function ExecutiveSummary({ proposal, ui }: { proposal: Proposal; ui: UiConfiguration }) {
  const criticalCount = proposal.analysis.issues.filter((i) => i.severity === 'critical').length;
  const highCount = proposal.analysis.issues.filter((i) => i.severity === 'high').length;
  const { Icon, label } = layoutBadge(ui.layout);

  return (
    <Card className={`border ${ctaClasses(ui.colorScheme)} shadow-sm`}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Executive Summary</span>
          </div>
          <Badge variant="outline" className="bg-white/60">
            <Icon className="w-3.5 h-3.5 mr-1" />
            {label} layout
          </Badge>
        </CardTitle>
        <CardDescription className="text-gray-700">
          {ui.callToAction?.message ?? 'A tailored proposal generated from project analysis.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {proposal.analysis.techStack.slice(0, 10).map((tech) => (
            <Badge key={tech} variant="secondary" className="bg-white/70">
              {tech}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-700">
          <Badge variant="critical">Critical: {criticalCount}</Badge>
          <Badge variant="high">High: {highCount}</Badge>
          <Badge variant="outline">Issues: {proposal.analysis.issues.length}</Badge>
          <Badge variant="outline">Opportunities: {proposal.analysis.opportunities.length}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricsRow({ proposal }: { proposal: Proposal }) {
  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const i of proposal.analysis.issues) c[i.severity] += 1;
    return c;
  }, [proposal.analysis.issues]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Critical</CardDescription>
          <CardTitle className="text-3xl text-red-600">{counts.critical}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>High</CardDescription>
          <CardTitle className="text-3xl text-orange-600">{counts.high}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Issues</CardDescription>
          <CardTitle className="text-3xl text-gray-900">{proposal.analysis.issues.length}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Opportunities</CardDescription>
          <CardTitle className="text-3xl text-gray-900">{proposal.analysis.opportunities.length}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

function ServicesCatalog({
  proposal,
  selectedServices,
  onServiceToggle,
}: {
  proposal: Proposal;
  selectedServices: Set<string>;
  onServiceToggle: (serviceId: string) => void;
}) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>Select services to include in checkout.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {proposal.services.map((service) => (
          <div key={service.id} className="p-3 rounded-lg border border-gray-200 bg-white">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={selectedServices.has(service.id)} onChange={() => onServiceToggle(service.id)} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-gray-900">${service.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{service.timeline}</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DynamicProposalRenderer({
  proposal,
  uiConfig,
  onServiceToggle,
  selectedServices,
}: {
  proposal: Proposal;
  uiConfig?: UiConfiguration;
  onServiceToggle: (serviceId: string) => void;
  selectedServices: Set<string>;
}) {
  const ui = useMemo(() => {
    if (!uiConfig) return buildDefaultUiConfiguration(proposal.analysis);
    return normalizeUiConfiguration(uiConfig, proposal.analysis);
  }, [uiConfig, proposal.analysis]);

  const criticalIssues = useMemo(() => proposal.analysis.issues.filter((i) => i.severity === 'critical'), [proposal]);
  const highIssues = useMemo(() => proposal.analysis.issues.filter((i) => i.severity === 'high'), [proposal]);
  const otherIssues = useMemo(
    () => proposal.analysis.issues.filter((i) => i.severity === 'medium' || i.severity === 'low'),
    [proposal]
  );

  const [tab, setTab] = useState<'overview' | 'issues' | 'opportunities' | 'services'>('overview');

  // Tabbed layout gets a custom chrome; other layouts follow ui.sections ordering.
  if (ui.layout === 'tabbed') {
    return (
      <div className="space-y-6">
        <ExecutiveSummary proposal={proposal} ui={ui} />
        <div className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm p-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'issues', label: 'Issues' },
                { id: 'opportunities', label: 'Opportunities' },
                { id: 'services', label: 'Services' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-sm rounded-lg transition ${
                  tab === t.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <MetricsRow proposal={proposal} />
            <VisualizationsBlock ui={ui} />
          </div>
        )}

        {tab === 'issues' && (
          <div className="space-y-6">
            {criticalIssues.length > 0 && (
              <IssuesBlock
                proposal={proposal}
                issues={criticalIssues}
                style="cards"
                selectedServices={selectedServices}
                onServiceToggle={onServiceToggle}
                title="Critical Issues"
                tone="red"
              />
            )}
            {highIssues.length > 0 && (
              <IssuesBlock
                proposal={proposal}
                issues={highIssues}
                style="cards"
                selectedServices={selectedServices}
                onServiceToggle={onServiceToggle}
                title="High Priority Issues"
                tone="orange"
              />
            )}
            {otherIssues.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Other Issues</CardTitle>
                  <CardDescription>Medium/low priority improvements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {otherIssues.map((issue) => (
                    <div key={issue.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{issue.title}</h4>
                        <Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === 'opportunities' && (
          <OpportunitiesBlock
            proposal={proposal}
            opportunities={proposal.analysis.opportunities}
            style="list"
            selectedServices={selectedServices}
            onServiceToggle={onServiceToggle}
          />
        )}

        {tab === 'services' && (
          <ServicesCatalog proposal={proposal} selectedServices={selectedServices} onServiceToggle={onServiceToggle} />
        )}
      </div>
    );
  }

  // Non-tabbed layouts: order sections according to ui.sections, with safe fallbacks.
  const orderedSectionIds = (ui.sections?.length ? ui.sections : buildDefaultUiConfiguration(proposal.analysis).sections)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id);

  const sectionStyleById = new Map(ui.sections?.map((s) => [s.id, s.style]));

  const renderSection = (id: string) => {
    const style = (sectionStyleById.get(id) as any) ?? 'cards';

    if (id === 'executive') return <ExecutiveSummary key={id} proposal={proposal} ui={ui} />;
    if (id === 'metrics') return <MetricsRow key={id} proposal={proposal} />;
    if (id === 'visualizations') return <VisualizationsBlock key={id} ui={ui} />;

    if (id === 'issues' || id === 'critical-issues') {
      if (ui.layout === 'dashboard') {
        // dashboard: unify issues into a grid and let severity badges speak.
        return (
          <IssuesBlock
            key={id}
            proposal={proposal}
            issues={proposal.analysis.issues}
            style="grid"
            selectedServices={selectedServices}
            onServiceToggle={onServiceToggle}
            title="Issues"
            tone={ui.colorScheme === 'red-alert' ? 'red' : 'gray'}
          />
        );
      }

      // linear/timeline: split critical/high for scannability.
      return (
        <div key={id} className="space-y-6">
          {criticalIssues.length > 0 && (
            <IssuesBlock
              proposal={proposal}
              issues={criticalIssues}
              style={style}
              selectedServices={selectedServices}
              onServiceToggle={onServiceToggle}
              title="Critical Issues"
              tone="red"
            />
          )}
          {highIssues.length > 0 && (
            <IssuesBlock
              proposal={proposal}
              issues={highIssues}
              style={style}
              selectedServices={selectedServices}
              onServiceToggle={onServiceToggle}
              title="High Priority Issues"
              tone="orange"
            />
          )}
          {otherIssues.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Other Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {otherIssues.map((issue) => (
                  <div key={issue.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{issue.title}</h4>
                      <Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{issue.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (id === 'opportunities') {
      return (
        <OpportunitiesBlock
          key={id}
          proposal={proposal}
          opportunities={proposal.analysis.opportunities}
          style={ui.layout === 'dashboard' ? 'grid' : style}
          selectedServices={selectedServices}
          onServiceToggle={onServiceToggle}
        />
      );
    }

    if (id === 'services') {
      return (
        <ServicesCatalog
          key={id}
          proposal={proposal}
          selectedServices={selectedServices}
          onServiceToggle={onServiceToggle}
        />
      );
    }

    // Unknown section ids: ignore safely.
    return null;
  };

  return (
    <div className="space-y-6">
      {/* CTA banner */}
      <div className={`rounded-xl border p-4 ${ctaClasses(ui.colorScheme)} shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-semibold">{ui.callToAction?.type === 'urgent' ? 'Action required' : 'Next step'}</div>
          <Badge variant="outline" className="bg-white/60">
            {ui.emphasize.replace('-', ' ')}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-gray-700">{ui.callToAction?.message}</p>
      </div>

      {ui.layout === 'timeline' && (
        <>
          {/* Prefer timeline visualization first */}
          <div className="space-y-4">
            <VisualizationsBlock ui={ui} />
          </div>
          <Separator />
        </>
      )}

      {orderedSectionIds.map(renderSection)}
    </div>
  );
}


