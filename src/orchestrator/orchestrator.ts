/**
 * orchestrator.ts
 * The central DAG execution engine for Startup Validator AI.
 *
 * Execution order:
 *   Step 1 → ideaAnalyzerAgent          (sequential — gates all downstream)
 *   Step 2 → [marketAgent, competitionAgent]  (parallel — Promise.all)
 *   Step 3 → businessModelAgent          (sequential — needs Step 2 outputs)
 *   Step 4 → riskAgent                  (sequential — needs all Step 1-3 outputs)
 *   Step 5 → merge + score → StartupValidationReport
 *
 * Progress events are emitted via the `onEvent` callback so the UI can
 * update its agent pipeline graph and live console log in real time.
 */

import { runIdeaAnalyzerAgent }  from '../agents/ideaAnalyzerAgent';
import { runMarketAgent }        from '../agents/marketAgent';
import { runCompetitionAgent }   from '../agents/competitionAgent';
import { runBusinessModelAgent } from '../agents/businessModelAgent';
import { runRiskAgent }          from '../agents/riskAgent';
import { calculateScore }        from '../lib/scoreCalculator';

import type {
  StartupValidationReport,
  OrchestratorEvent,
  AgentName,
  LogLevel,
} from '../types/report';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs the full multi-agent validation pipeline.
 *
 * @param rawIdea  - The startup idea string entered by the user
 * @param onEvent  - Callback invoked for each progress/log/complete event
 */
export async function runOrchestrator(
  rawIdea:  string,
  onEvent:  (event: OrchestratorEvent) => void
): Promise<StartupValidationReport> {

  // Helpers scoped to this run
  const log = (agent: AgentName, message: string, level: LogLevel = 'info') => {
    onEvent({ kind: 'log', time: timestamp(), agent, message, level });
  };
  const progress = (percent: number) => {
    onEvent({ kind: 'progress', percent });
  };
  const agentStart = (agentIndex: number, agentName: AgentName) => {
    onEvent({ kind: 'agent_start', agentIndex, agentName });
  };
  const agentDone = (agentIndex: number, agentName: AgentName) => {
    onEvent({ kind: 'agent_done', agentIndex, agentName });
  };

  try {
    // -----------------------------------------------------------------------
    // STEP 0 — Bootstrap
    // -----------------------------------------------------------------------
    log('Orchestrator', 'Initializing agent execution graph. Sanitizing input payload…');
    progress(2);

    await tick(300);
    log('Orchestrator', `Received startup pitch (${rawIdea.length} chars). Dispatching to Idea Analyzer Agent…`);
    progress(8);

    // -----------------------------------------------------------------------
    // STEP 1 — Idea Analyzer Agent (sequential gate)
    // -----------------------------------------------------------------------
    agentStart(0, 'Idea Analyzer Agent');
    log('Idea Analyzer Agent', 'Parsing startup pitch. Classifying vertical and business model type…');
    progress(12);

    const ideaAnalysis = await runIdeaAnalyzerAgent({
      rawIdea,
      additionalContext: '',
    });

    log('Idea Analyzer Agent', `Category classified: "${ideaAnalysis.startupCategory}".`);
    log('Idea Analyzer Agent', `Primary customer: ${ideaAnalysis.customer.primarySegment}`);
    log('Idea Analyzer Agent', `Core problem framed. Severity: ${ideaAnalysis.problem.severity}.`, 'success');
    log('Idea Analyzer Agent', `Uniqueness vector extracted. Dispatching results downstream…`, 'success');

    agentDone(0, 'Idea Analyzer Agent');
    progress(28);

    // -----------------------------------------------------------------------
    // STEP 2 — Market Agent + Competition Agent (parallel)
    // -----------------------------------------------------------------------
    agentStart(1, 'Market Agent');
    agentStart(2, 'Competition Agent');

    log('Orchestrator', 'Dispatching Market Agent & Competition Agent in parallel…');
    log('Market Agent', 'Initiating bottom-up TAM calculation from idea analysis…');
    log('Competition Agent', 'Querying competitive landscape for identified market vertical…');

    const [marketFeasibility, competitiveLandscape] = await Promise.all([
      runMarketAgent({ ideaAnalysis }).then(result => {
        log('Market Agent', `TAM sized at ${result.marketSize.tam}. Demand: ${result.demand.strength}.`, 'success');
        log('Market Agent', `Identified ${result.trends.length} macro trends. Opportunity beachhead locked.`, 'success');
        agentDone(1, 'Market Agent');
        return result;
      }),
      runCompetitionAgent({ ideaAnalysis }).then(result => {
        const names = result.directCompetitors.map(c => c.name).join(', ');
        log('Competition Agent', `Mapped ${result.directCompetitors.length} direct competitors: ${names}.`, 'warn');
        log('Competition Agent', `Differentiation score: ${result.differentiation.differentiationScore}/10.`, 'success');
        agentDone(2, 'Competition Agent');
        return result;
      }),
    ]);

    progress(55);

    // -----------------------------------------------------------------------
    // STEP 3 — Business Model Agent
    // -----------------------------------------------------------------------
    agentStart(3, 'Business Model Agent');
    log('Business Model Agent', 'Analyzing market benchmarks and competitor pricing…');
    progress(60);

    const businessModel = await runBusinessModelAgent({
      ideaAnalysis,
      marketFeasibility,
      competitiveLandscape,
    });

    log('Business Model Agent', `Pricing model: ${businessModel.pricing.structure}.`);
    log('Business Model Agent', `${businessModel.pricing.suggestedTiers.length} pricing tiers. ${businessModel.revenueStreams.length} revenue streams.`, 'success');
    agentDone(3, 'Business Model Agent');
    progress(75);

    // -----------------------------------------------------------------------
    // STEP 4 — Risk Agent
    // -----------------------------------------------------------------------
    agentStart(4, 'Risk Agent');
    log('Risk Agent', 'Initiating adversarial stress-test across all risk vectors…');
    progress(80);

    const riskProfile = await runRiskAgent({
      ideaAnalysis,
      marketFeasibility,
      competitiveLandscape,
      businessModel,
    });

    const criticalRisks = [
      ...riskProfile.technicalRisks,
      ...riskProfile.marketRisks,
      ...riskProfile.executionRisks,
      ...riskProfile.legalRisks,
    ].filter(r => r.severity === 'Critical' || r.severity === 'High');

    const riskLevel: LogLevel = criticalRisks.length > 2 ? 'warn' : 'info';
    log('Risk Agent', `${criticalRisks.length} high/critical risk(s) identified across 4 vectors.`, riskLevel);
    log('Risk Agent', 'Mitigation strategies compiled. Red-team complete.', 'success');
    agentDone(4, 'Risk Agent');
    progress(92);

    // -----------------------------------------------------------------------
    // STEP 5 — Scoring + Report Compilation
    // -----------------------------------------------------------------------
    log('Orchestrator', 'Compiling all agent payloads into structured Investment Memorandum…');
    await tick(400);

    const { score, verdict } = calculateScore(
      marketFeasibility,
      competitiveLandscape,
      businessModel,
      riskProfile,
    );

    const report: StartupValidationReport = {
      sessionId:            uid(),
      createdAt:            new Date().toISOString(),
      rawIdea,
      overallScore:         score,
      overallVerdict:       verdict,
      ideaAnalysis,
      marketFeasibility,
      competitiveLandscape,
      businessModel,
      riskProfile,
    };

    log('Orchestrator', `Overall Score: ${score}/100 — Verdict: "${verdict}". Generating report…`, 'success');
    progress(100);

    onEvent({ kind: 'complete', report });
    return report;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    onEvent({ kind: 'error', message });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Internal utility
// ---------------------------------------------------------------------------

/** Non-blocking pause — gives React a chance to flush state between steps */
function tick(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
