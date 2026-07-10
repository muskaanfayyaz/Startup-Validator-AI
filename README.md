# 🚀 Startup Validator AI

> **Automated Investment Committee & Multi-Agent Venture Intelligence**

Startup Validator AI is a premium, spec-driven SaaS dashboard that acts as an automated investment committee. It connects to the Gemini API to analyze, score, stress-test, and model unit economics for startup pitches using a Directed Acyclic Graph (DAG) multi-agent architecture.

---

## 🛠️ Multi-Agent DAG Architecture

```
                       [ Pitch Input ]
                              │
                              ▼
                     1. Idea Analyzer Agent
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       2. Market Agent             3. Competition Agent
        (TAM Sizing)                (Differentiation)
               └──────────────┬──────────────┘
                              ▼
                    4. Business Model Agent
                              │
                              ▼
                      5. Risk Agent
                              │
                              ▼
                    [ Feasibility Scoring ]
```

The orchestrator manages data flow sequentially and concurrently between specialized worker agents:
1. **Idea Analyzer Agent**: Distills customer segments, pain points, problem severity, and unique value propositions.
2. **Market Agent (Concurrent)**: Sizes TAM, determines market dynamics, and evaluates demand signals.
3. **Competition Agent (Concurrent)**: Maps competitive matrices, barriers to entry, and key differentiators.
4. **Business Model Agent**: Formulates pricing tiers, take rates, transaction volumes, and secondary streams.
5. **Risk Agent**: Identifies technical, execution, legal, and market threats, outputting mitigations.

---

## 🎨 Venture-Grade UI Features

* **Default Light Theme**: A bright, professional presentation by default, with complete dark-mode support via Tailwind CSS v4 selector variants.
* **Unit Economics Calculator**: A live sandbox to model annual commission revenues based on sliding take rates, booked nights, and multipliers.
* **Ask Lead VC Analyst Widget**: A styled, mock VC analyst chat panel simulating real-time Q&A regarding competitive threats.
* **Nextra-Style Standalone Docs Portal**: Fully separate page routing (via client-side URL hash `#docs`) with:
  * Categorized Left Sidebar navigation tree.
  * Middle reading pane with sequential bottom topic navigators (`← Previous` / `Next →`).
  * Right "On This Page" floating Table of Contents with smooth-scrolling anchors.

---

## ⚙️ Tech Stack

* **Frontend Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS v4 (with custom selectors for dynamic class-based theme-awareness)
* **Animations**: Framer Motion
* **Iconography**: Lucide React
* **AI Model Engine**: Gemini 2.0 Flash / Gemini 1.5 Flash (via `x-goog-api-key` headers)

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended).

### 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Startup Validator AI"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory and define your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```
d:\Startup Validator AI/
├── src/
│   ├── agents/            # Worker agents definitions (Idea, Market, Comp, BM, Risk)
│   ├── data/              # Static documentation content pack (docsData.ts)
│   ├── lib/               # Core Gemini client, markdown linter, score calculations
│   ├── orchestrator/      # Directed Acyclic Graph orchestrator
│   ├── prompts/           # Specialized prompt instructions for each worker agent
│   ├── types/             # Venture report TS interface schemas
│   ├── App.tsx            # Main visual dashboard and Docs portal router
│   ├── index.css          # Theme configs and styling variables
│   └── main.tsx           # React bootstrap entry point
├── dist/                  # Compiled production-ready client bundle
├── public/                # Static assets (Favicons, vector packs)
├── tsconfig.json          # TypeScript configurations
├── package.json           # Scripts and package manifests
└── README.md              # Project documentation handbook
```
