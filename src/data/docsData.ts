/**
 * docsData.ts
 * Static compilation of all project markdown files (Specs, Architecture, Walkthrough, etc.)
 * packaged for the instant frontend documentation reader.
 */

export interface DocFile {
  id: string;
  title: string;
  description: string;
  category: 'Specification' | 'Architecture' | 'Status';
  content: string;
}

export const DOCS_LIBRARY: DocFile[] = [
  {
    id: 'engineering-spec',
    title: '1. Engineering Specification',
    description: 'Product vision, functional requirements, and UI guidelines.',
    category: 'Specification',
    content: `# Engineering Specification: Startup Validator AI
**Author:** Principal AI Engineer (DeepMind Alum)  
**Status:** APPROVED (Spec-Driven Development Phase)

---

## 1. Vision & Strategy

Startup Validator AI is a professional-grade multi-agent reasoning system designed to democratize elite-tier venture capital due diligence. Instead of providing generic feedback, the system models the exact behavior of an investment committee.

By employing multiple specialized, collaborative AI agents, the platform deconstructs a founder's raw startup idea, subjects it to adversarial market testing, designs simulated financial scenarios, and issues a structured, multi-dimensional Investment Memorandum.

### The Tone: The "Skeptical Analyst"
The system avoids generic encouragement. It adopts the persona of a seasoned, direct, yet constructive investment analyst. The analysis is data-driven, objective, and focuses heavily on identifying failure modes, customer acquisition challenges, structural market trends, and unit economic viability.

---

## 2. Functional Requirements

### 2.1. Ideation & Input Fleshing
- **Dynamic Input Helper**: A guided, interactive input field that helps users expand a simple idea (e.g., "Airbnb for pets") into a structured submission.
- **Asynchronous Analysis Pipeline**: Users submit the idea and receive immediate UI feedback. The multi-agent pipeline is queued and runs asynchronously.

### 2.2. Multi-Agent Orchestration & Real-Time Visualization
- **Live Orchestration Feed**: An interactive, visual canvas showing agent relationships and data flow in real-time.
- **Agent Logging**: A terminal-style log panel showing the agents' chain-of-thought, sub-queries, and internal deliberations in real-time.

### 2.3. The Interactive Validation Report
Once the agents finish processing, the platform renders a structured dashboard containing:
1. **Executive Summary & Verdict**: The "Investment Thesis" and a calculated overall feasibility score.
2. **Market Dynamics**: Total Addressable Market (TAM) estimation, competitor matrix, and macroeconomic trends.
3. **Financial Modeler**: Pro-forma unit economics and monetisation models.
4. **Red Team / Risk Assessment**: Failure modes, regulatory/compliance roadblocks, and suggested defensibility moats.

---

## 3. Non-Functional Requirements

### 3.1. Performance & Latency
- **Time-to-Interactive (TTI)**: The landing page must load in under 1.2s on average networks.
- **Streaming Pipeline Updates**: The server must stream progress updates every 500ms during the multi-agent execution phase.
- **Report Generation SLA**: The full multi-agent synthesis must complete in less than 45 seconds.

### 3.2. Reliability, Cost, & LLM Operations
- **Structured Output Guarantees**: Forced JSON Schema output mode on all agent LLM calls to prevent parsing failures.
- **Failover Mechanism**: Fallback to fast-tier models if primary reasoning models fail.

---

## 4. Directory & Project Structure

The project uses Vite with React, TypeScript, and Tailwind CSS.

\`\`\`text
startup-validator-ai/
├── src/
│   ├── types/                  # Type definitions
│   ├── prompts/                # AI agent prompts
│   ├── lib/                    # Utilities (gemini, validation)
│   ├── agents/                 # Specialized worker agents
│   ├── orchestrator/           # DAG execution engine
│   ├── data/                   # Embedded documentation data
│   └── App.tsx                 # Main application dashboard
├── package.json
└── tsconfig.json
\`\`\`
`
  },
  {
    id: 'agent-architecture',
    title: '2. Multi-Agent Architecture',
    description: 'Directed Acyclic Graph routing, worker models, and JSON schemas.',
    category: 'Architecture',
    content: `# Multi-Agent System Architecture Design
**Project:** Startup Validator AI  
**Status:** IMPLEMENTED (Clean DAG Architecture)

---

## 1. Architectural Overview

The system operates as a **directed acyclic orchestration graph** (DAG) where a central **Orchestrator** schedules and routes data between five specialized worker agents. Every worker agent outputs structured data using JSON Schemas to guarantee that downstream agents and the frontend application receive deterministic, typed interfaces.

\`\`\`text
[User Input] --> Orchestrator
                   │
                   ├──> 1. Idea Analyzer Agent
                   │       │
                   │       ├──> 2. Market Agent (Parallel)
                   │       └──> 3. Competition Agent (Parallel)
                   │               │
                   │               └──> 4. Business Model Agent
                   │                       │
                   │                       └──> 5. Risk Agent
                   │
                   └──> [Scoring & Combined Memo] --> UI
\`\`\`

---

## 2. Agent Definitions

### 2.1. Idea Analyzer Agent
- **Purpose**: Deconstructs raw user pitch into foundational product dimensions, framing the problem space, customer personas, categories, and differentiators.
- **Output**: Category vertical, primary segment, pain points, core problem statement, and value proposition.

### 2.2. Market Agent
- **Purpose**: Evaluates market size (TAM), demand indicators, macroeconomic trends, and entry beachheads.
- **Output**: TAM dollar figure, sizing methodology, demand strength, demand indicators, and trends.

### 2.3. Competition Agent
- **Purpose**: Identifies competitive threats, direct/indirect alternatives, and calculates differentiation score.
- **Output**: Direct competitors (strengths & weaknesses), indirect alternatives, and differentiation vectors.

### 2.4. Business Model Agent
- **Purpose**: Suggests pricing structure, pricing tiers, monetization mechanics, and secondary revenue streams.
- **Output**: Pricing structure, tier details, and revenue sources.

### 2.5. Risk Agent
- **Purpose**: Red-teams the model across Technical, Market, Execution, and Legal failure modes.
- **Output**: Severity-rated risks and actionable mitigation strategies.
`
  },
  {
    id: 'walkthrough',
    title: '3. Implementation Walkthrough',
    description: 'Technical setup guide, model overrides, and verification flows.',
    category: 'Status',
    content: `# Multi-Agent Orchestrator Walkthrough
**Status:** ACTIVE

---

## 1. Execution Pipeline

1. **Step 1: Idea Analyzer Agent**
   - Takes: \`rawIdea\` (founder pitch).
   - Resolves customer segments, pain points, problem statement severity, and uniqueness.
   - Blocks downstream execution until parsed JSON is successfully validated.

2. **Step 2: Market + Competition Agents (Parallel)**
   - Triggered concurrently using \`Promise.all\`.
   - Both receive the parsed JSON from Step 1.
   - **Market Agent** sizes TAM and evaluates demand indicators and trends.
   - **Competition Agent** maps direct/indirect competitors and calculates differentiation scores (1–10).

3. **Step 3: Business Model Agent**
   - Receives all outputs from Steps 1 & 2.
   - Generates pricing tiers, primary monetization mechanics, and secondary streams.

4. **Step 4: Risk Agent**
   - Consumes all upstream parameters.
   - Stress-tests the venture across Technical, Market, Execution, and Legal failure modes.

5. **Step 5: Compilation & Scoring**
   - The Orchestrator merges all payloads, calculates a unified feasibility index (0–100) via the \`scoreCalculator\` heuristics, and assigns an overall qualitative verdict.

---

## 2. API Key Routing & Configuration
The client uses the standard **\`x-goog-api-key\`** header inside standard HTTP \`fetch\` calls. This ensures full out-of-the-box compatibility with both standard (\`AIzaSy...\`) and GCP-scoped (\`AQ...\`) keys, completely bypassing SDK authorization header conflicts.
`
  },
  {
    id: 'task-board',
    title: '4. Development Task Board',
    description: 'Status of spec tasks, agent wiring, and quality audits.',
    category: 'Status',
    content: `# Startup Validator AI — Development Task Board

## Phase 1: Architecture & Design
- [x] Write Engineering Specification (\`engineering_specification.md\`)
- [x] Design Multi-Agent Architecture (\`multi_agent_architecture.md\`)

## Phase 2: Core Foundation & Configuration
- [x] Initialize Vite + React + TypeScript app
- [x] Configure Tailwind CSS v4 via \`@tailwindcss/vite\`
- [x] Setup HSL dark/light modes and glassmorphic index.css classes
- [x] Create secure environment setup (\`.env.example\`)

## Phase 3: AI Agent & Orchestrator Implementation
- [x] Design and define standard TypeScript interfaces (\`report.ts\`)
- [x] Build generic \`runAgent\` harness (\`agentRunner.ts\`) to eliminate boilerplates
- [x] Implement secure XML-encapsulated prompts to block prompt injections
- [x] Build robust validation assertion checks (\`validation.ts\`)
- [x] Implement all 5 worker agents (Idea, Market, Competition, BM, Risk) with deep schema verification
- [x] Build the central DAG Orchestrator with Promise.all parallel scheduling
- [x] Create report synthesizers to dynamically compile SWOT, MVP, and Priority Actions

## Phase 4: Premium Dashboard UI
- [x] Build investor-ready dashboard layout in \`App.tsx\`
- [x] Add live-updating terminal window logs streaming worker agent activities
- [x] Render beautiful circular feasibility gauges and horizontal vector metrics
- [x] Design 4-quadrant SWOT matrix and milestone timelines
- [x] Setup priority checklist tables

## Phase 5: Verification & Quality Audits
- [x] Refactor codebase to eliminate duplicate boilerplates
- [x] Run production bundler checks — Succeeded with zero errors/warnings
`
  }
];
