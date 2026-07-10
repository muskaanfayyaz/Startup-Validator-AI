/**
 * report.ts
 * Single source of truth for all TypeScript interfaces consumed by agents,
 * the orchestrator, and the UI layer. Maps 1:1 to JSON schemas in
 * multi_agent_architecture.md.
 */

// ---------------------------------------------------------------------------
// Primitives & Enums
// ---------------------------------------------------------------------------

export type ProblemSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type DemandStrength  = 'Weak' | 'Moderate' | 'Strong';
export type TrendImpact     = 'Positive' | 'Negative' | 'Neutral';
export type RiskSeverity    = 'Low' | 'Medium' | 'High' | 'Critical';
export type Verdict =
  | 'Highly Viable'
  | 'Seed-Ready with Cautions'
  | 'Pivot Recommended'
  | 'High-Risk Pass';

// ---------------------------------------------------------------------------
// Agent Output Schemas
// ---------------------------------------------------------------------------

/** Output of the Idea Analyzer Agent */
export interface IdeaAnalysis {
  startupCategory: string;
  customer: {
    primarySegment: string;
    painPoints: string[];
  };
  problem: {
    statement: string;
    severity: ProblemSeverity;
  };
  uniqueness: {
    coreDifferentiator: string;
    valueProposition: string;
  };
}

/** Output of the Market Agent */
export interface MarketFeasibility {
  marketSize: {
    tam: string;
    methodology: string;
  };
  demand: {
    indicators: string[];
    strength: DemandStrength;
  };
  trends: Array<{
    trendDescription: string;
    impact: TrendImpact;
  }>;
  opportunity: string;
}

/** Output of the Competition Agent */
export interface CompetitiveLandscape {
  directCompetitors: Array<{
    name: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  indirectCompetitors: Array<{
    name: string;
    alternativeMethod: string;
  }>;
  differentiation: {
    vectors: string[];
    differentiationScore: number; // 1–10
  };
}

/** Output of the Business Model Agent */
export interface BusinessModel {
  pricing: {
    structure: string;
    suggestedTiers: Array<{
      tierName: string;
      pricePoint: string;
      featuresIncluded: string[];
    }>;
  };
  monetization: string;
  revenueStreams: Array<{
    source: string;
    description: string;
  }>;
}

/** Output of the Risk Agent */
export interface RiskProfile {
  technicalRisks:  RiskItem[];
  marketRisks:     RiskItem[];
  executionRisks:  RiskItem[];
  legalRisks:      RiskItem[];
}

export interface RiskItem {
  risk:       string;
  severity:   RiskSeverity;
  mitigation: string;
}

// ---------------------------------------------------------------------------
// Final Compiled Report
// ---------------------------------------------------------------------------

export interface StartupValidationReport {
  sessionId:            string;
  createdAt:            string;
  rawIdea:              string;
  overallScore:         number;   // 0–100
  overallVerdict:       Verdict;
  ideaAnalysis:         IdeaAnalysis;
  marketFeasibility:    MarketFeasibility;
  competitiveLandscape: CompetitiveLandscape;
  businessModel:        BusinessModel;
  riskProfile:          RiskProfile;
}

// ---------------------------------------------------------------------------
// Agent Input Contracts
// ---------------------------------------------------------------------------

export interface IdeaAnalyzerInput {
  rawIdea:           string;
  additionalContext: string;
}

export interface MarketAgentInput {
  ideaAnalysis: IdeaAnalysis;
}

export interface CompetitionAgentInput {
  ideaAnalysis: IdeaAnalysis;
}

export interface BusinessModelAgentInput {
  ideaAnalysis:         IdeaAnalysis;
  marketFeasibility:    MarketFeasibility;
  competitiveLandscape: CompetitiveLandscape;
}

export interface RiskAgentInput {
  ideaAnalysis:         IdeaAnalysis;
  marketFeasibility:    MarketFeasibility;
  competitiveLandscape: CompetitiveLandscape;
  businessModel:        BusinessModel;
}

// ---------------------------------------------------------------------------
// Orchestrator Progress Events (discriminated union)
// ---------------------------------------------------------------------------

export type AgentName =
  | 'Orchestrator'
  | 'Idea Analyzer Agent'
  | 'Market Agent'
  | 'Competition Agent'
  | 'Business Model Agent'
  | 'Risk Agent';

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface LogEvent {
  kind:    'log';
  time:    string;
  agent:   AgentName;
  message: string;
  level:   LogLevel;
}

export interface AgentStartEvent {
  kind:       'agent_start';
  agentIndex: number;
  agentName:  AgentName;
}

export interface AgentDoneEvent {
  kind:       'agent_done';
  agentIndex: number;
  agentName:  AgentName;
}

export interface ProgressTickEvent {
  kind:    'progress';
  percent: number;
}

export interface CompleteEvent {
  kind:   'complete';
  report: StartupValidationReport;
}

export interface ErrorEvent {
  kind:    'error';
  message: string;
}

export type OrchestratorEvent =
  | LogEvent
  | AgentStartEvent
  | AgentDoneEvent
  | ProgressTickEvent
  | CompleteEvent
  | ErrorEvent;
