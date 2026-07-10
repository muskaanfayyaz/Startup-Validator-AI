import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Terminal as TerminalIcon, 
  Play, 
  Moon, 
  Sun, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight, 
  ChevronRight, 
  Plus, 
  Award,
  Lightbulb,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { runOrchestrator } from './orchestrator/orchestrator';
import type { StartupValidationReport, LogEvent, OrchestratorEvent } from './types/report';
import { generateInvestmentReport } from './lib/reportGenerator';
import { DOCS_LIBRARY } from './data/docsData';


// --- AGENT DEFINITIONS & TYPES ---
interface Agent {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const AGENTS: Agent[] = [
  { name: "Idea Analyzer Agent", description: "Deconstructs pitch into categories, user personas, & core problems.", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { name: "Market Agent", description: "Evaluates demand volumes, TAM size, and growth trends.", icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Competition Agent", description: "Identifies direct/indirect players and analyzes differentiation.", icon: Users, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { name: "Business Model Agent", description: "Calculates unit margins, pricing models, and LTV/CAC curves.", icon: DollarSign, color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
  { name: "Risk Agent", description: "Stress-tests legal, technical, execution, and macro failure modes.", icon: ShieldAlert, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
];

// LogEntry is now sourced from the types layer
type LogEntry = LogEvent;

// Dummy placeholder so existing UI JSX referencing PET_AIRBNB_MOCK compiles
// during transition — replaced by live report state below.
const EMPTY_REPORT: StartupValidationReport = {
  sessionId: '',
  createdAt: '',
  rawIdea: '',
  overallScore: 0,
  overallVerdict: 'Pivot Recommended',
  ideaAnalysis: {
    startupCategory: '',
    customer: { primarySegment: '', painPoints: [] },
    problem: { statement: '', severity: 'Low' },
    uniqueness: { coreDifferentiator: '', valueProposition: '' },
  },
  marketFeasibility: {
    marketSize: { tam: '', methodology: '' },
    demand: { indicators: [], strength: 'Weak' },
    trends: [],
    opportunity: '',
  },
  competitiveLandscape: {
    directCompetitors: [],
    indirectCompetitors: [],
    differentiation: { vectors: [], differentiationScore: 1 },
  },
  businessModel: {
    pricing: { structure: '', suggestedTiers: [] },
    monetization: '',
    revenueStreams: [],
  },
  riskProfile: {
    technicalRisks: [],
    marketRisks: [],
    executionRisks: [],
    legalRisks: [],
  },
};

// Simple inline styling helper for strong/bold formatting and backtick code snippets
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.flatMap((part, idx) => {
    if (idx % 2 === 1) {
      return [<strong key={`bold-${idx}`} className="font-semibold text-slate-800 dark:text-slate-100">{part}</strong>];
    }
    const subParts = part.split(/`(.*?)`/g);
    return subParts.map((sub, sIdx) => {
      if (sIdx % 2 === 1) {
        return <code key={`code-${idx}-${sIdx}`} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-indigo-500 dark:text-indigo-400">{sub}</code>;
      }
      return sub;
    });
  });
}

// Custom light-weight markdown rendering framework supporting headers, lists, tasks, rules, and code blocks
function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`} className="bg-slate-900 dark:bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto my-4 border border-slate-800/80 leading-relaxed">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="font-outfit text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-200 dark:border-slate-850 pb-2">
          {parseInline(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      const titleText = line.slice(3).replace(/\*\*/g, '').trim();
      const anchorId = titleText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h2 key={`h2-${i}`} id={anchorId} className="font-outfit text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2.5 scroll-mt-20">
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="font-outfit text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-5 border-slate-200 dark:border-slate-800/60" />);
      continue;
    }

    if (line.trim().startsWith('- ')) {
      const itemText = line.trim().slice(2);
      const isTask = itemText.startsWith('[x]') || itemText.startsWith('[ ]');
      if (isTask) {
        const checked = itemText.startsWith('[x]');
        const label = itemText.slice(3).trim();
        elements.push(
          <div key={`task-${i}`} className="flex items-center space-x-2.5 my-1.5 ml-2">
            <span className={`h-4 w-4 rounded border flex items-center justify-center text-[9px] font-bold ${
              checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 text-transparent'
            }`}>
              ✓
            </span>
            <span className={`text-xs ${checked ? 'text-slate-400 line-through' : 'text-slate-750 dark:text-slate-300 font-medium'}`}>
              {parseInline(label)}
            </span>
          </div>
        );
      } else {
        elements.push(
          <li key={`li-${i}`} className="ml-5 list-disc text-xs text-slate-650 dark:text-slate-300 my-1 leading-relaxed">
            {parseInline(itemText)}
          </li>
        );
      }
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-xs text-slate-650 dark:text-slate-350 my-2 leading-relaxed">
        {parseInline(line)}
      </p>
    );
  }

  return elements;
}

export default function App() {
  // Theme state - defaults to light per user request
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // URL Hash routing state to render docs on a separate view
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [selectedDocId, setSelectedDocId] = useState('engineering-spec');
  const [docsSearch, setDocsSearch] = useState('');

  // Input Idea States
  const [ideaInput, setIdeaInput] = useState('I want to build Airbnb for pets, where pet owners can find verified local sitters with cage-free homes.');
  const [categorySelection, setCategorySelection] = useState('Marketplace');

  // Execution States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [showReport, setShowReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real AI report state (replaces PET_AIRBNB_MOCK once analysis completes)
  const [report, setReport] = useState<StartupValidationReport>(EMPTY_REPORT);

  // Console logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Tab View for completed report
  const [activeTab, setActiveTab] = useState<'overview' | 'idea' | 'market' | 'competition' | 'business' | 'risks'>('overview');
  
  // Interactive Business Model Simulation state
  const [takeRate, setTakeRate] = useState(20);
  const [avgNightsPerYear, setAvgNightsPerYear] = useState(12);
  const [pricingMultiplier, setPricingMultiplier] = useState(1);

  // Effect to handle scrolling logs to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Sync dark class on document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle URL hash changes for zero-router multi-page feel
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
      // Reset scroll position on navigation
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ---------------------------------------------------------------------------
  // Orchestrator handler — replaces mock simulation
  // ---------------------------------------------------------------------------
  const handleValidate = () => {
    if (!ideaInput.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setShowReport(false);
    setErrorMessage(null);
    setProgress(0);
    setActiveAgentIndex(-1);
    setLogs([]);

    // Map orchestrator progress events to UI state
    const handleEvent = (event: OrchestratorEvent) => {
      switch (event.kind) {
        case 'log':
          setLogs(prev => [...prev, event]);
          break;

        case 'agent_start':
          setActiveAgentIndex(event.agentIndex);
          break;

        case 'agent_done':
          // Keep activeAgentIndex on the running agent until next starts
          break;

        case 'progress':
          setProgress(event.percent);
          break;

        case 'complete':
          setReport(event.report);
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10B981', '#6366F1', '#34D399'],
          });
          setActiveAgentIndex(-1);
          setIsAnalyzing(false);
          setShowReport(true);
          setActiveTab('overview');
          break;

        case 'error':
          setErrorMessage(event.message);
          setActiveAgentIndex(-1);
          setIsAnalyzing(false);
          break;
      }
    };

    runOrchestrator(ideaInput, handleEvent).catch(() => {
      // Error is already surfaced via the 'error' event
    });
  };

  // Dynamic calculations for pricing calculator in Business Model Card
  // Uses live report data once available, falls back to defaults
  const basePricePerUnit =
    report.businessModel.pricing.suggestedTiers[0]
      ? parseFloat(
          report.businessModel.pricing.suggestedTiers[0].pricePoint
            .replace(/[^0-9.]/g, '')
        ) || 45
      : 45;
  const computedRevenue = (basePricePerUnit * pricingMultiplier * (takeRate / 100) * avgNightsPerYear).toFixed(2);

  if (currentHash === '#docs') {
    const activeDoc = DOCS_LIBRARY.find(d => d.id === selectedDocId);
    const activeIdx = DOCS_LIBRARY.findIndex(d => d.id === selectedDocId);
    const prevDoc = activeIdx > 0 ? DOCS_LIBRARY[activeIdx - 1] : null;
    const nextDoc = activeIdx < DOCS_LIBRARY.length - 1 ? DOCS_LIBRARY[activeIdx + 1] : null;

    const headings = activeDoc 
      ? activeDoc.content.split('\n')
          .filter(line => line.startsWith('## '))
          .map(line => {
            const text = line.slice(3).replace(/\*\*/g, '').trim();
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return { text, id };
          })
      : [];

    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'grid-bg-dark text-slate-100' : 'grid-bg-light text-slate-900'} font-sans flex flex-col relative transition-colors duration-300`}>
        {/* Background Radial Glow */}
        <div className={`absolute top-0 left-0 right-0 h-[600px] pointer-events-none ${theme === 'dark' ? 'accent-glow-dark' : 'accent-glow-light'} z-0`} />

        {/* Navigation bar for Docs Page */}
        <nav className={`relative z-10 border-b ${theme === 'dark' ? 'border-slate-850 bg-slate-950/60' : 'border-slate-200 bg-white/70'} backdrop-blur-md px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-outfit font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-655 dark:from-white dark:to-slate-400">
              Startup Validator Docs
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => { window.location.hash = ''; }}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white bg-slate-950'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 bg-white'
              }`}
            >
              ← Back to Dashboard
            </button>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-full border transition-all cursor-pointer ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-950 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-650'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </nav>

        {/* 3-Column Docs Layout */}
        <div className="relative z-10 flex-1 flex overflow-hidden">
          {/* Column 1: Sidebar Navigation */}
          <div className={`w-72 border-r flex flex-col overflow-y-auto ${
            theme === 'dark' ? 'bg-slate-900/10 border-slate-850' : 'bg-slate-50/20 border-slate-200'
          }`}>
            {/* Filter input */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-850">
              <input
                type="text"
                placeholder="Search topics..."
                value={docsSearch}
                onChange={(e) => setDocsSearch(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400 focus:border-emerald-600 focus:ring-emerald-600/20'
                }`}
              />
            </div>
            {/* Navigation categories */}
            <div className="flex-1 p-3 space-y-4">
              {(['Specification', 'Architecture', 'Status'] as const).map(cat => {
                const filteredDocs = DOCS_LIBRARY.filter(
                  doc => doc.category === cat &&
                  (doc.title.toLowerCase().includes(docsSearch.toLowerCase()) || doc.description.toLowerCase().includes(docsSearch.toLowerCase()))
                );
                if (filteredDocs.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-505 px-3">
                      {cat}
                    </span>
                    <div className="space-y-0.5">
                      {filteredDocs.map(doc => {
                        const isSelected = selectedDocId === doc.id;
                        return (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDocId(doc.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex flex-col cursor-pointer ${
                              isSelected
                                ? theme === 'dark'
                                  ? 'bg-emerald-950/20 border border-emerald-800/40 text-emerald-400 font-semibold'
                                  : 'bg-emerald-50 border border-emerald-250/60 text-emerald-700 font-semibold shadow-xs'
                                : 'border border-transparent text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                            }`}
                          >
                            <span className="text-xs">{doc.title}</span>
                            <span className="text-[10px] mt-0.5 leading-normal text-slate-500 dark:text-slate-500">
                              {doc.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Document Render (Middle) */}
          <div className={`flex-1 overflow-y-auto px-10 py-8 ${
            theme === 'dark' ? 'bg-slate-950/30' : 'bg-white/40'
          }`}>
            <div className="max-w-2xl mx-auto flex flex-col min-h-[70vh] justify-between">
              <div>
                <span className="text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/25">
                  {activeDoc?.category}
                </span>
                <div className="mt-4">
                  {renderMarkdown(activeDoc?.content || '')}
                </div>
              </div>

              {/* Sequential Topic Switcher Banner */}
              <div className={`mt-12 pt-6 border-t flex items-center justify-between ${
                theme === 'dark' ? 'border-slate-850' : 'border-slate-100'
              }`}>
                {prevDoc ? (
                  <button
                    onClick={() => setSelectedDocId(prevDoc.id)}
                    className="flex flex-col text-left group cursor-pointer"
                  >
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-bold">Previous Topic</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-450 group-hover:underline mt-0.5">
                      ← {prevDoc.title}
                    </span>
                  </button>
                ) : <div />}
                {nextDoc ? (
                  <button
                    onClick={() => setSelectedDocId(nextDoc.id)}
                    className="flex flex-col text-right group cursor-pointer"
                  >
                    <span className="text-[9px] text-slate-455 dark:text-slate-550 uppercase tracking-widest font-bold">Next Topic</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-450 group-hover:underline mt-0.5">
                      {nextDoc.title} →
                    </span>
                  </button>
                ) : <div />}
              </div>
            </div>
          </div>

          {/* Column 3: Table of Contents (Right) */}
          <div className={`w-56 p-6 border-l hidden xl:block overflow-y-auto no-scrollbar ${
            theme === 'dark' ? 'bg-slate-900/5 border-slate-855' : 'bg-slate-50/10 border-slate-200'
          }`}>
            <h4 className="font-outfit font-bold text-[9px] tracking-widest text-slate-400 dark:text-slate-505 uppercase mb-4">
              On This Page
            </h4>
            {headings.length > 0 ? (
              <div className="space-y-2.5 text-[11px] leading-relaxed">
                {headings.map(h => (
                  <button
                    key={h.id}
                    onClick={() => {
                      const el = document.getElementById(h.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="block text-left text-slate-655 dark:text-slate-450 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer w-full hover:translate-x-0.5 transform transition-transform duration-150"
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-slate-600 italic">No subheadings found</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'grid-bg-dark text-slate-100' : 'grid-bg-light text-slate-900'} relative overflow-x-hidden transition-colors duration-300 font-sans`}>
      {/* Background Radial Glow */}
      <div className={`absolute top-0 left-0 right-0 h-[600px] pointer-events-none ${theme === 'dark' ? 'accent-glow-dark' : 'accent-glow-light'} z-0`} />

      {/* --- HEADER --- */}
      <nav className={`relative z-10 border-b ${theme === 'dark' ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-white/70'} backdrop-blur-md px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-outfit font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Startup Validator AI
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300">
              MVP v1.0
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a 
              href="#docs"
              className="text-xs font-medium text-slate-555 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Docs
            </a>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-full border transition-all ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- MAIN BODY --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* --- HERO SECTION --- */}
        <header className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-outfit text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
              Deconstruct startup ideas with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500">
                Multi-Agent Intelligence
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-light">
              Submit your concept to an automated investment committee. Our specialized agents crawl search channels, estimate market capacities, and deliver structured risk scorecards.
            </p>
          </motion.div>
        </header>

        {/* --- INPUT BLOCK --- */}
        <section className="max-w-4xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-6 sm:p-8 ${theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'}`}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Step 1: Pitch your startup idea
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Sector Vertical:</span>
                  <select 
                    value={categorySelection} 
                    onChange={(e) => setCategorySelection(e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-md border bg-transparent focus:outline-none transition-colors ${theme === 'dark' ? 'border-slate-800 text-slate-300 focus:border-emerald-500' : 'border-slate-200 text-slate-700 focus:border-emerald-600'}`}
                  >
                    <option value="Marketplace">Marketplace</option>
                    <option value="SaaS">SaaS</option>
                    <option value="FinTech">FinTech / Transactional</option>
                    <option value="D2C">D2C E-commerce</option>
                    <option value="DeepTech">Deep Tech / Hardware</option>
                  </select>
                </div>
              </div>

              <textarea 
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                placeholder="Describe your startup idea here (e.g. 'I want to build Airbnb for pets'). Include your target audience and monetization model..."
                rows={4}
                className={`w-full p-4 rounded-xl text-sm border bg-transparent resize-none focus:outline-none focus:ring-1 transition-colors ${theme === 'dark' ? 'border-slate-800 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-emerald-500/30' : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-emerald-600/30'}`}
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIdeaInput("I want to build an automated, AI-driven bookkeeping platform for freelance contract workers in the EU.")}
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium flex items-center"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Load SaaS Example
                </button>

                <button
                  onClick={handleValidate}
                  disabled={isAnalyzing || !ideaInput.trim()}
                  className={`relative flex items-center space-x-2 px-6 py-3 rounded-lg font-outfit text-sm font-semibold tracking-wide transition-all shadow-md group ${
                    isAnalyzing || !ideaInput.trim()
                      ? 'bg-slate-700/50 text-slate-400 border border-transparent cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400/40 hover:shadow-emerald-500/20 hover:shadow-lg'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Validating ({progress}%)</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Validate Startup Idea</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start space-x-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold mb-1">Validation Failed</p>
                <p className="text-xs leading-relaxed opacity-80">{errorMessage}</p>
                <p className="text-[10px] mt-2 opacity-60">Ensure VITE_GEMINI_API_KEY is set in your .env file and the Gemini API is reachable.</p>
              </div>
            </motion.div>
          )}
        </section>

        {/* --- SIMULATOR PIPELINE SECTION --- */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.section 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Agent Execution List */}
              <div className={`md:col-span-5 rounded-2xl p-6 border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-6">
                  Agent Pipeline Graph
                </h3>
                <div className="space-y-4">
                  {AGENTS.map((agent, index) => {
                    const isActive = index === activeAgentIndex;
                    const isCompleted = index < activeAgentIndex && activeAgentIndex !== -1;
                    return (
                      <div 
                        key={agent.name}
                        className={`flex items-start space-x-3 p-3 rounded-xl border transition-all ${
                          isActive 
                            ? `${theme === 'dark' ? 'bg-slate-900 border-emerald-500/50' : 'bg-emerald-50/50 border-emerald-600/30'} pulse-glow-emerald`
                            : isCompleted 
                              ? `${theme === 'dark' ? 'bg-slate-950/20 border-slate-900' : 'bg-slate-50 border-slate-100'} opacity-65`
                              : `${theme === 'dark' ? 'bg-transparent border-transparent' : 'bg-transparent border-transparent'} opacity-45`
                        }`}
                      >
                        <div className={`p-2 rounded-lg border ${agent.color} flex-shrink-0`}>
                          <agent.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {agent.name}
                            </h4>
                            {isCompleted && (
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live CLI Logs Terminal */}
              <div className="md:col-span-7 flex flex-col h-[340px] rounded-2xl border bg-slate-950 border-slate-800 text-slate-300 font-mono text-xs overflow-hidden shadow-2xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <TerminalIcon className="h-4 w-4 text-emerald-500" />
                    <span className="font-bold tracking-tight text-[11px]">AGENT_COORDINATOR_SHELL</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                </div>

                {/* Logs Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 animate-pulse">Establishing container link...</div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        <span className="text-slate-600 mr-2">[{log.time}]</span>
                        <span className={`font-semibold mr-1.5 ${
                          log.agent === 'Orchestrator' ? 'text-indigo-400' :
                          log.agent === 'Idea Analyzer Agent' ? 'text-amber-400' :
                          log.agent === 'Market Agent' ? 'text-emerald-400' :
                          log.agent === 'Competition Agent' ? 'text-indigo-400' :
                          log.agent === 'Business Model Agent' ? 'text-teal-400' : 'text-rose-400'
                        }`}>{log.agent}:</span>
                        <span className={
                          log.level === 'success' ? 'text-emerald-400' :
                          log.level === 'warn' ? 'text-amber-400' :
                          log.level === 'error' ? 'text-rose-400' : 'text-slate-300'
                        }>{log.message}</span>
                      </div>
                    ))
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* --- VALIDATION REPORT DASHBOARD --- */}
        <AnimatePresence>
          {showReport && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Tab Navigation */}
              <div className={`flex border-b overflow-x-auto no-scrollbar scroll-smooth ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                {[
                  { id: 'overview', label: 'Summary Verdict' },
                  { id: 'idea', label: 'Idea Analyzer' },
                  { id: 'market', label: 'Market Feasibility' },
                  { id: 'competition', label: 'Competitors' },
                  { id: 'business', label: 'Business Model' },
                  { id: 'risks', label: 'Threat Index' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3.5 px-6 font-outfit text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-500'
                        : `${theme === 'dark' ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-800'}`
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Panel Content (LHS) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* OVERVIEW TAB */}
                  {activeTab === 'overview' && (() => {
                    const invReport = generateInvestmentReport(report);
                    return (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        {/* Executive Summary Card */}
                        <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <Award className="h-5 w-5" />
                            </div>
                            <h2 className="font-outfit text-xl font-bold">Executive Investment Summary</h2>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            {invReport.executiveSummary}
                          </p>
                        </div>

                        {/* Scores & Comparison Charts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Radial Overall Score Card */}
                          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'} flex flex-col items-center justify-center`}>
                            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-6">Overall Startup Score</h3>
                            <div className="relative h-40 w-40 flex items-center justify-center">
                              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 176 176">
                                <circle 
                                  cx="88" cy="88" r="70" 
                                  strokeWidth="8" 
                                  stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'}
                                  fill="transparent"
                                />
                                <circle 
                                  cx="88" cy="88" r="70" 
                                  strokeWidth="8" 
                                  stroke="#10b981"
                                  strokeDasharray={439.8}
                                  strokeDashoffset={439.8 - (439.8 * invReport.scores.overall) / 100}
                                  strokeLinecap="round"
                                  fill="transparent"
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="text-center z-10">
                                <span className="font-outfit text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                                  {invReport.scores.overall}
                                </span>
                                <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-widest mt-1">
                                  Feasibility
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 text-center">
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {report.overallVerdict}
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Score Bar Chart Card */}
                          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'} flex flex-col justify-between`}>
                            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4">Investment Vector Scores</h3>
                            <div className="space-y-4">
                              {[
                                { label: 'Idea Score', score: invReport.scores.idea, color: 'bg-amber-500', text: 'text-amber-500' },
                                { label: 'Market Capacity', score: invReport.scores.market, color: 'bg-emerald-500', text: 'text-emerald-500' },
                                { label: 'Competitive Defense', score: invReport.scores.competition, color: 'bg-indigo-500', text: 'text-indigo-500' },
                                { label: 'Business Model Integrity', score: invReport.scores.businessModel, color: 'bg-teal-500', text: 'text-teal-500' },
                                { label: 'Risk Mitigation Safety', score: invReport.scores.risk, color: 'bg-rose-500', text: 'text-rose-500' }
                              ].map(v => (
                                <div key={v.label}>
                                  <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="font-medium text-slate-650 dark:text-slate-400">{v.label}</span>
                                    <span className={`font-bold ${v.text}`}>{v.score}/100</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800/85 rounded-full h-2">
                                    <div 
                                      className={`${v.color} h-2 rounded-full transition-all duration-1000`} 
                                      style={{ width: `${v.score}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* SWOT Analysis Matrix */}
                        <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-6">SWOT Risk & Defensibility Matrix</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Strengths */}
                            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200/50'}`}>
                              <span className="text-xs font-bold uppercase text-emerald-500 tracking-wider block mb-3">Strengths (Defensive Moat)</span>
                              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                {invReport.swot.strengths.map((s, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2 flex-shrink-0" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Weaknesses */}
                            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-rose-950/10 border-rose-500/20' : 'bg-rose-50/50 border-rose-200/50'}`}>
                              <span className="text-xs font-bold uppercase text-rose-500 tracking-wider block mb-3">Weaknesses (Model Gaps)</span>
                              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                {invReport.swot.weaknesses.map((w, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 mr-2 flex-shrink-0" />
                                    <span>{w}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Opportunities */}
                            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-indigo-950/10 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200/50'}`}>
                              <span className="text-xs font-bold uppercase text-indigo-500 tracking-wider block mb-3">Opportunities (Growth / Expansion)</span>
                              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                {invReport.swot.opportunities.map((o, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 mr-2 flex-shrink-0" />
                                    <span>{o}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Threats */}
                            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-amber-950/10 border-amber-500/20' : 'bg-amber-50/50 border-amber-200/50'}`}>
                              <span className="text-xs font-bold uppercase text-amber-500 tracking-wider block mb-3">Threats (Critical Tailwinds)</span>
                              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                {invReport.swot.threats.map((t, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 flex-shrink-0" />
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Recommended MVP Blueprint Card */}
                        <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <h2 className="font-outfit text-xl font-bold">Recommended MVP Blueprint</h2>
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">MVP Scope</span>
                              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{invReport.recommendedMvp.title}</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">{invReport.recommendedMvp.description}</p>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Core Features to Implement</span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {invReport.recommendedMvp.coreFeatures.map((feat, idx) => (
                                  <div key={idx} className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-100 dark:border-slate-800/50' : 'bg-slate-50 border-slate-200'} text-xs`}>
                                    <span className="font-bold text-indigo-400 block mb-1">Feature 0{idx + 1}</span>
                                    <p className="text-slate-600 dark:text-slate-400">{feat}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">Milestone Validation Timeline</span>
                              <div className="relative border-l border-slate-800 pl-4 space-y-4">
                                {invReport.recommendedMvp.milestones.map((ms, idx) => (
                                  <div key={idx} className="relative">
                                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-indigo-500 border border-slate-950" />
                                    <span className="text-[10px] font-bold uppercase text-indigo-400 block">Milestone 0{idx + 1}</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{ms}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Next Steps Card */}
                        <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
                              <ChevronRight className="h-5 w-5" />
                            </div>
                            <h2 className="font-outfit text-xl font-bold">Priority Action Items</h2>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider">
                                  <th className="pb-3 pr-4">Category</th>
                                  <th className="pb-3 pr-4">Priority Action</th>
                                  <th className="pb-3 text-right">Priority</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/40 text-slate-600 dark:text-slate-300">
                                {invReport.nextSteps.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-3.5 pr-4 font-semibold text-teal-500">{item.category}</td>
                                    <td className="py-3.5 pr-4 leading-relaxed">{item.action}</td>
                                    <td className="py-3.5 text-right">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        item.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                        item.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                      }`}>
                                        {item.priority}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* IDEA ANALYZER TAB */}
                  {activeTab === 'idea' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Lightbulb className="h-5 w-5" />
                          </div>
                          <h2 className="font-outfit text-xl font-bold">Idea Analysis Deconstruction</h2>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Startup Category</span>
                            <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{report.ideaAnalysis.startupCategory}</p>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Core Problem Statement</span>
                            <p className="text-sm mt-1 leading-relaxed text-slate-800 dark:text-slate-300">
                              {report.ideaAnalysis.problem.statement}
                            </p>
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              Severity: {report.ideaAnalysis.problem.severity}
                            </span>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Customer Profiles</span>
                            <p className="text-sm font-medium mt-1 mb-2 text-slate-800 dark:text-slate-200">
                              {report.ideaAnalysis.customer.primarySegment}
                            </p>
                            <ul className="space-y-2">
                              {report.ideaAnalysis.customer.painPoints.map((pain, i) => (
                                <li key={i} className="flex items-start text-xs text-slate-500">
                                  <ChevronRight className="h-3.5 w-3.5 mr-1 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <span>{pain}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unique Value Proposition</span>
                            <p className="text-sm mt-1 leading-relaxed text-slate-800 dark:text-slate-300">
                              {report.ideaAnalysis.uniqueness.valueProposition}
                            </p>
                            <p className="text-xs mt-2 text-slate-500">
                              <strong>Key Differentiator:</strong> {report.ideaAnalysis.uniqueness.coreDifferentiator}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* MARKET FEASIBILITY TAB */}
                  {activeTab === 'market' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <h2 className="font-outfit text-xl font-bold">Market Sizing & Demand</h2>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TAM (Total Addressable Market)</span>
                              <p className="text-2xl font-outfit font-extrabold text-emerald-500 mt-1">{report.marketFeasibility.marketSize.tam}</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demand Strength</span>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{report.marketFeasibility.demand.strength}</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TAM Sizing Methodology</span>
                            <p className="text-xs mt-1 text-slate-500 leading-relaxed">
                              {report.marketFeasibility.marketSize.methodology}
                            </p>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Demand Indicators</span>
                            <ul className="space-y-3 mt-2">
                              {report.marketFeasibility.demand.indicators.map((ind, i) => (
                                <li key={i} className="flex items-start text-xs text-slate-500">
                                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0" />
                                  <span>{ind}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Macro Market Trends</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                              {report.marketFeasibility.trends.map((trend, i) => (
                                <div key={i} className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1.5">{trend.trendDescription}</p>
                                  <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    Impact: {trend.impact}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Launch Beachhead</span>
                            <p className="text-xs mt-1 text-slate-500 leading-relaxed">
                              {report.marketFeasibility.opportunity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* COMPETITORS TAB */}
                  {activeTab === 'competition' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                            <Users className="h-5 w-5" />
                          </div>
                          <h2 className="font-outfit text-xl font-bold">Competitive Mapping</h2>
                        </div>

                        <div className="space-y-6">
                          {/* Direct */}
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Competitors</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                              {report.competitiveLandscape.directCompetitors.map((comp, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">{comp.name}</h4>
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] text-slate-500">
                                      <strong>Strengths:</strong> {comp.strengths.join(", ")}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      <strong>Weaknesses:</strong> {comp.weaknesses.join(", ")}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Indirect */}
                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indirect Alternatives</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                              {report.competitiveLandscape.indirectCompetitors.map((comp, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">{comp.name}</h4>
                                  <p className="text-[10px] text-slate-500 leading-normal">
                                    <strong>Alternative Method:</strong> {comp.alternativeMethod}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Moat / Differentiation */}
                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Differentiation Strategy</span>
                              <span className="text-xs text-indigo-500 font-bold">Moat Score: {report.competitiveLandscape.differentiation.differentiationScore}/10</span>
                            </div>
                            <ul className="space-y-2 mt-2">
                              {report.competitiveLandscape.differentiation.vectors.map((vec, i) => (
                                <li key={i} className="flex items-start text-xs text-slate-500">
                                  <ChevronRight className="h-4 w-4 mr-1 text-indigo-500 flex-shrink-0" />
                                  <span>{vec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* BUSINESS MODEL TAB */}
                  {activeTab === 'business' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <h2 className="font-outfit text-xl font-bold">Monetization & Economics</h2>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Core Monetization</span>
                              <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{report.businessModel.monetization}</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing Structure</span>
                              <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{report.businessModel.pricing.structure}</p>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Tiers</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                              {report.businessModel.pricing.suggestedTiers.map((tier, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{tier.tierName}</h4>
                                    <span className="text-xs text-teal-500 font-extrabold">{tier.pricePoint}</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {tier.featuresIncluded.map((feat, idx) => (
                                      <li key={idx} className="text-[10px] text-slate-500 flex items-center">
                                        <ChevronRight className="h-3 w-3 mr-1 text-teal-500" /> {feat}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secondary Revenue Engines</span>
                            <div className="space-y-3 mt-2">
                              {report.businessModel.revenueStreams.map((rev, i) => (
                                <div key={i} className="flex items-start text-xs">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 min-w-[140px]">{rev.source}:</div>
                                  <div className="text-slate-500">{rev.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Interactive Unit Economics Modeler */}
                          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-emerald-50/20 border-emerald-250/60'} pt-4`}>
                            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-3">
                              Interactive Unit Revenue Calculator
                            </h4>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-450">
                                    <span>Take Rate Percentage:</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{takeRate}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="5" 
                                    max="35" 
                                    value={takeRate} 
                                    onChange={(e) => setTakeRate(Number(e.target.value))}
                                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-250'}`}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-450">
                                    <span>Average Booked Nights/Year:</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{avgNightsPerYear} nights</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="2" 
                                    max="40" 
                                    value={avgNightsPerYear} 
                                    onChange={(e) => setAvgNightsPerYear(Number(e.target.value))}
                                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-250'}`}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                <span className="text-xs text-slate-600 dark:text-slate-450">Pricing Tier:</span>
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => setPricingMultiplier(1)} 
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                      pricingMultiplier === 1 
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                                        : theme === 'dark'
                                          ? 'bg-transparent border-slate-800 text-slate-400'
                                          : 'bg-transparent border-slate-200 text-slate-600'
                                    }`}
                                  >
                                    Standard ($45/n)
                                  </button>
                                  <button 
                                    onClick={() => setPricingMultiplier(1.444)} 
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                      pricingMultiplier !== 1 
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                                        : theme === 'dark'
                                          ? 'bg-transparent border-slate-800 text-slate-400'
                                          : 'bg-transparent border-slate-200 text-slate-600'
                                    }`}
                                  >
                                    Premium ($65/n)
                                  </button>
                                </div>
                              </div>

                              <div className={`border-t pt-3 flex justify-between items-center ${theme === 'dark' ? 'border-emerald-900/20' : 'border-emerald-150'}`}>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">Estimated Annual Commission Revenue Per Pet:</span>
                                <span className="text-lg font-outfit font-extrabold text-emerald-600 dark:text-emerald-500">${computedRevenue}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* THREATS / RISKS TAB */}
                  {activeTab === 'risks' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <ShieldAlert className="h-5 w-5" />
                          </div>
                          <h2 className="font-outfit text-xl font-bold">Threat & Risk Index</h2>
                        </div>

                        <div className="space-y-6">
                          {/* Tech */}
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Technical Risks</span>
                            <div className="mt-2 space-y-3">
                              {report.riskProfile.technicalRisks.map((risk, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-100 dark:border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{risk.risk}</h5>
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Severity: {risk.severity}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500"><strong>Mitigation:</strong> {risk.mitigation}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Market */}
                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Market Risks</span>
                            <div className="mt-2 space-y-3">
                              {report.riskProfile.marketRisks.map((risk, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-100 dark:border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{risk.risk}</h5>
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/25">Severity: {risk.severity}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500"><strong>Mitigation:</strong> {risk.mitigation}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Execution */}
                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Execution Risks</span>
                            <div className="mt-2 space-y-3">
                              {report.riskProfile.executionRisks.map((risk, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-100 dark:border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{risk.risk}</h5>
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">Severity: {risk.severity}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500"><strong>Mitigation:</strong> {risk.mitigation}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Legal */}
                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Legal & Compliance Risks</span>
                            <div className="mt-2 space-y-3">
                              {report.riskProfile.legalRisks.map((risk, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-100 dark:border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{risk.risk}</h5>
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">Severity: {risk.severity}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500"><strong>Mitigation:</strong> {risk.mitigation}</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                </div>

                {/* Scorecard Sidebar Panel (RHS) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Final Score Circle Gauge */}
                  <div className={`p-6 sm:p-8 rounded-2xl border text-center ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
                      Feasibility Scorecard
                    </h3>

                    {/* Circular SVG Gauge */}
                    <div className="relative h-44 w-44 mx-auto mb-4 flex items-center justify-center">
                      <svg className="absolute transform -rotate-90 w-full h-full">
                        <circle 
                          cx="88" cy="88" r="70" 
                          strokeWidth="8" 
                          stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'}
                          fill="transparent"
                        />
                        <circle 
                          cx="88" cy="88" r="70" 
                          strokeWidth="8" 
                          stroke="#10b981"
                          strokeDasharray={439.8}
                          strokeDashoffset={439.8 - (439.8 * report.overallScore) / 100}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="font-outfit text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                          {report.overallScore}
                        </span>
                        <span className="text-xs text-slate-500 block font-semibold uppercase tracking-widest mt-1">
                          Percent
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 dark:border-slate-800/50 pt-4">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                        Committee Classification
                      </span>
                      <p className="font-outfit font-bold text-lg text-emerald-500 mt-1">
                        {report.overallVerdict}
                      </p>
                    </div>
                  </div>

                  {/* Talk to the Analyst Chat Widget */}
                  <div className={`p-5 rounded-2xl border flex flex-col h-[320px] ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                    <div className={`flex items-center space-x-2 pb-3 border-b mb-3 flex-shrink-0 ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-100'}`}>
                      <Activity className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-100">
                        Ask Lead VC Analyst
                      </span>
                    </div>

                    {/* Chat log */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-100 dark:border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                        Hi! I am your lead investment analyst. Ask me anything about our competitive index, TAM sizing model, or risk tables!
                      </div>
                      <div className="flex justify-end">
                        <span className={`p-2.5 rounded-xl max-w-[85%] font-medium ${theme === 'dark' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                          How can we avoid disintermediation?
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-100 dark:border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                        <strong>Analyst Reply:</strong> We suggest embedding standard veterinary telehealth consultations and physical IoT camera rentals into the booking package. Users only receive insurance guarantees if transactions remain in-app.
                      </div>
                    </div>

                    {/* Input */}
                    <div className="mt-3 flex-shrink-0 relative">
                      <input 
                        type="text" 
                        placeholder="Type standard question..."
                        disabled 
                        className={`w-full p-2.5 pr-8 rounded-lg text-xs border bg-transparent focus:outline-none ${theme === 'dark' ? 'border-slate-800 text-white placeholder-slate-600' : 'border-slate-200 text-slate-900 placeholder-slate-400'}`}
                      />
                      <ArrowRight className="h-4 w-4 text-slate-500 absolute right-2.5 top-2.5 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* --- FOOTER --- */}
      <footer className={`relative z-10 border-t ${theme === 'dark' ? 'border-slate-900 bg-slate-950/40 text-slate-600' : 'border-slate-200 bg-white/40 text-slate-500'} py-8 mt-24 text-center text-xs`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Startup Validator AI. Running spec-driven multi-agent pipelines.
          </div>
          <div className="flex space-x-6">
            <a 
              href="#docs" 
              className="hover:underline cursor-pointer"
            >
              System Specification & Architecture
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
