export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Issue {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  impact: string;
  recommendedService: string;
}

export interface Opportunity {
  title: string;
  description: string;
  recommendedService: string;
}

export interface RepoAnalysis {
  techStack: string[];
  issues: Issue[];
  opportunities: Opportunity[];
}

export type UiLayout = 'dashboard' | 'linear' | 'tabbed' | 'timeline';
export type UiEmphasize = 'critical-issues' | 'opportunities' | 'balanced';
export type UiSectionStyle = 'prominent' | 'compact' | 'grid' | 'list' | 'cards';
export type UiColorScheme = 'red-alert' | 'balanced' | 'opportunity-green';
export type UiCtaType = 'urgent' | 'standard' | 'educational';

export type UiVisualization =
  | { type: 'risk-matrix'; data: any }
  | { type: 'tech-debt-chart'; data: any }
  | { type: 'roadmap-timeline'; data: any };

export interface UiSection {
  id: string;
  order: number;
  style: UiSectionStyle;
}

export interface UiConfiguration {
  layout: UiLayout;
  emphasize: UiEmphasize;
  visualizations: UiVisualization[];
  sections: UiSection[];
  colorScheme: UiColorScheme;
  callToAction: {
    type: UiCtaType;
    message: string;
  };
}

export interface ProposalService {
  id: string;
  name: string;
  description: string;
  price: number;
  timeline: string;
  included: string[];
}

export interface Proposal {
  id: string;
  clientName: string;
  repoUrl: string;
  analysis: RepoAnalysis;
  uiConfiguration?: UiConfiguration;
  services: ProposalService[];
  generatedAt: string;
}


