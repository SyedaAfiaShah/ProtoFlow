# ProtoFlow 

> **From hypothesis to executable experiments.**

🔗 **Live Demo:** [ProtoFlow](https://proto-flow-rust.vercel.app/)  

---

## The Challenge

This project was built for the **AI Scientist Challenge** at **Hack-Nation 2026**, powered by [Fulcrum Science](https://fulcrum.science).

The challenge brief asked participants to build a tool that a real Principal Investigator would actually want to use — one capable of generating an experiment plan so complete and operationally grounded that a lab could pick it up on Monday and start running it by Friday.

Specifically, the plan had to include:

- A **protocol** grounded in real published methodologies
- **Materials and supply chain** with specific reagents and catalog numbers
- A realistic **budget** with line-item cost estimates
- A **timeline** with phased breakdown and dependencies
- A **validation strategy** defining how success or failure is measured

The stretch goal — the hardest challenge in the brief — was to build a **scientist review and feedback learning loop**: a system where expert corrections automatically improve future plan generation for similar experiments, without re-prompting.

---

## The Problem

Designing a laboratory experiment is time-consuming, expertise-intensive, and error-prone. Principal Investigators spend days writing protocols, sourcing reagents, estimating budgets, and designing validation strategies — before a single experiment runs.

Existing AI tools fail scientists in one critical way: **they hallucinate**. A general LLM will generate a plausible-sounding protocol with no grounding in published methodology. Wrong temperatures, invented catalog numbers, unrealistic budgets. Unusable by a real scientist.

The core insight behind ProtoFlow: **the problem is not the language model — it is the absence of retrieval**. If you feed the model real published protocols before generating, the output is grounded. That is RAG — Retrieval Augmented Generation — and it is what separates ProtoFlow from every generic AI experiment planner.

---

## The Solution

ProtoFlow is a **RAG-powered pipeline** — not a chatbot with a science theme. A researcher types one sentence (their hypothesis). The system retrieves real published protocols, searches the academic literature, fetches live supplier data, and synthesises everything into a complete experiment plan using Groq's LLaMA 3.3-70b.

### How It Works

```
Hypothesis (user input)
        ↓
Module 1: Parser — Groq extracts structured entities
  (intervention, system, assay method, domain, threshold)
        ↓
        ├── Module 2: Literature QC [parallel]
        │   Semantic Scholar → Groq classifies novelty
        │   Returns: not_found / similar_exists / exact_match
        │
        └── Module 3: Protocol Generation [parallel]
            Tavily fetches real protocols from protocols.io
            Groq adapts them to the specific hypothesis
        ↓
        ├── Module 4: Materials + Supply Chain
        │   Groq generates reagent list with real
        │   Sigma-Aldrich catalog numbers
        │
        ├── Module 6: Timeline [parallel with 4 & 7]
        │   Derived from protocol step durations
        │
        └── Module 7: Validation Strategy [parallel]
            Domain-to-standard mapping (ATCC, MIQE, ICH)
        ↓
Module 5: Budget
  Pure math on quantities × prices
  + Groq estimates for equipment and personnel
        ↓
[User triggered]
Module 8: Cheap Alternatives Engine
Module 9: Litmus CRO Submission
Module 10: Scientist Review + Feedback Loop
```

---

## Features

### Core Features (Challenge Requirements)

**Protocol Generation — Grounded in Real Science**
Tavily searches protocols.io and peer-reviewed sources for real published procedures. Groq generates a protocol adapted from those real methodologies — not hallucinated from training data. Each step cites its source.

**Materials + Supply Chain**
Real Sigma-Aldrich catalog numbers generated at temperature 0 (deterministic, not creative). Every catalog number links directly to the product page. Items flagged with `verify_catalog: true` when confidence is lower.

**Budget Estimation**
Materials total calculated from actual quantities × prices. Equipment, personnel, and indirect costs estimated by Groq based on domain and experiment complexity.

**Timeline**
Phased breakdown derived from protocol step durations. Total weeks and months displayed prominently. Dependencies between phases labeled.

**Validation Strategy**
Domain-to-standard mapping is automatic:
- `cell_biology` → ATCC cell culture guidelines
- `diagnostics` → sensitivity/specificity standards
- `qPCR` → MIQE guidelines
- `pharmacology` → ICH Q2(R1) guidelines

Success criteria derived directly from the hypothesis threshold. Statistically appropriate test selected per domain.

**Literature QC**
Semantic Scholar Graph API (free, no key required) searched with two parallel queries derived from the parsed hypothesis. Groq classifies novelty: Novel Research / Similar Work Exists / Possible Duplicate. Up to 3 real references returned with DOI links.

---

### Innovations Beyond the Challenge

**Cheap Alternatives Engine**

After the plan is generated, the system detects materials above $150 and offers to find validated cheaper alternatives. Tavily searches published literature for each flagged material. Groq evaluates whether a validated substitute exists.

If a validated alternative is found, the system returns:
- Alternative name and estimated price
- Percentage savings
- A required published citation (DOI)
- Cautionary notes — purity differences, protocol adjustments, additional controls needed
- Confidence rating (High / Medium / Low)

If no validated alternative exists in published literature, the system returns explicitly:
> ❌ No alternatives available — no published, validated substitute was found for this material in the context of this assay.

This hard rule prevents hallucinated substitutions, which in a lab context can invalidate an entire experiment.

The user then chooses: **Keep Original Plan** or **Switch to Alternative Plan**. If they switch, an amber banner appears with a one-click revert option.

**Scientist Review + Feedback Learning Loop**

The hardest stretch goal in the challenge brief. After any plan is generated, a scientist can expand the Review Panel and rate individual protocol steps and materials (1-5 stars), adding structured text corrections.

Corrections are stored in Supabase Postgres tagged by domain and assay method. Before every subsequent generation call, the system queries for the most recent corrections matching the same domain and injects them into the Groq system prompt as few-shot examples.

The next plan for a similar experiment visibly reflects the corrections — without re-prompting. No fine-tuning, no model retraining. Pure RAG applied to expert knowledge.

**Litmus CRO Integration**

ProtoFlow generates the experiment plan. [Litmus](https://litmus.science) executes it. With one click, the complete structured plan is submitted to the Litmus CRO network. A lab coordinator reviews the plan and provides a quote within 24 hours.

ProtoFlow sits upstream of Litmus in the scientific workflow — it is the AI frontend that Litmus does not have yet.

**PDF Export**

The complete experiment plan exports to a formatted, paginated PDF with cover page, all sections, and page numbers. Ready to attach to a grant application, email to a collaborator, or print for the lab.

**Two-Panel Dashboard UI**

Clean sidebar navigation with live status indicators for each module. The right panel updates automatically as each section completes — the user watches the plan build section by section in real time without scrolling. Premium serif typography (Playfair Display) with a cream and sage green palette.

---

## Anti-Hallucination Rules

ProtoFlow enforces five hard rules across all generation calls:

1. **Never invent citations** — references must come from Semantic Scholar results
2. **Never invent catalog numbers** — flag with `verify_catalog: true` if uncertain
3. **Never suggest unvalidated alternatives** — return "No alternatives available" if no published evidence exists
4. **Never invent protocol steps** — flag steps not supported by retrieved protocols
5. **Temperature 0 for all factual modules** — parser, materials, literature QC, budget

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Full-stack, serverless API routes |
| Language | TypeScript | Type safety across pipeline |
| UI | shadcn/ui + Tailwind CSS | Component library |
| Animation | Framer Motion | Progressive reveal, loading states |
| Fonts | Playfair Display + Inter | Premium scientific typography |
| LLM | Groq (LLaMA 3.3-70b-versatile) | All generation and classification |
| Web Search | Tavily API | Protocol retrieval, alternatives search |
| Literature | Semantic Scholar Graph API | Academic paper search (free, no key) |
| Supplier | Sigma-Aldrich (URL construction) | Materials catalog and pricing |
| Database | Supabase (Postgres) | Feedback storage and retrieval |
| CRO Network | Litmus MCP Server | Lab submission integration |
| PDF Export | jsPDF | Client-side plan export |
| Deployment | Vercel | Serverless deployment |

---

## Architecture Decisions

**Why RAG instead of fine-tuning?**
Fine-tuning requires weeks of work, large labeled datasets, and significant compute. RAG gives 90% of the benefit by retrieving real context at generation time. Every published protocol on protocols.io is available to ProtoFlow at runtime — no training required.

**Why multi-step generation instead of one prompt?**
A single prompt asking for everything produces inconsistent output — materials that do not match the protocol, budgets that do not match the materials. Multi-step chains pass each output as context to the next step. The budget knows exactly what materials were ordered. The timeline knows exactly how long each protocol step takes.

**Why Groq with LLaMA instead of GPT-4?**
Speed. Groq's inference hardware is significantly faster than OpenAI's API for the same model size. For a real-time generation pipeline with 7 sequential and parallel LLM calls, latency compounds. Groq delivers the full plan in under 2 minutes.

**Why Supabase instead of a vector database for the feedback loop?**
For a hackathon, simple domain + assay_method string matching in Postgres retrieves relevant feedback accurately enough. A vector database with embeddings would improve similarity matching for edge cases but adds setup complexity. The current approach works reliably and demonstrably.

**Why Next.js API routes instead of a separate backend?**
One codebase, one deployment, one `git push`. Vercel handles serverless function scaling automatically. No Docker, no separate server, no infrastructure management.

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/protoflow.git
cd protoflow

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Fill in your API keys

# Run development server
npm run dev
```

### Required Environment Variables

```env
GROQ_API_KEY=              # console.groq.com
TAVILY_API_KEY=            # tavily.com
NEXT_PUBLIC_SUPABASE_URL=  # supabase.com project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # supabase anon key
SUPABASE_SERVICE_KEY=      # supabase service role key
NEXT_PUBLIC_SITE_URL=      # http://localhost:3000 (dev) or your Vercel URL
```

### Supabase Table Setup

Run this SQL in your Supabase SQL Editor:

```sql
create table feedback (
  id uuid default gen_random_uuid() primary key,
  domain text not null,
  assay_method text not null,
  section text not null,
  item_label text not null,
  original_text text not null,
  correction text not null,
  rating integer not null,
  created_at timestamp default now()
);
```

---

## Project Structure

```
protoflow/
├── app/
│   ├── page.tsx                    # Main dashboard UI
│   ├── layout.tsx                  # Root layout + fonts
│   └── api/
│       ├── parse/route.ts          # Module 1: Hypothesis parser
│       ├── literature/route.ts     # Module 2: Literature QC
│       ├── feedback/route.ts       # Module 10: Feedback store
│       ├── submit/route.ts         # Module 9: Litmus submission
│       └── generate/
│           ├── protocol/route.ts   # Module 3: Protocol generation
│           ├── materials/route.ts  # Module 4: Materials + supply chain
│           ├── budget/route.ts     # Module 5: Budget estimation
│           ├── timeline/route.ts   # Module 6: Timeline generation
│           ├── validation/route.ts # Module 7: Validation strategy
│           └── alternatives/route.ts # Module 8: Cheap alternatives
├── components/
│   ├── LiteratureQC.tsx
│   ├── AlternativesPanel.tsx
│   ├── LitmusSubmit.tsx
│   ├── ReviewPanel.tsx
│   └── tabs/
│       ├── ProtocolTab.tsx
│       ├── MaterialsTab.tsx
│       ├── BudgetTab.tsx
│       ├── TimelineTab.tsx
│       └── ValidationTab.tsx
├── lib/
│   ├── types.ts                    # All TypeScript interfaces
│   ├── groq.ts                     # Shared Groq client
│   ├── supabase.ts                 # Supabase client
│   ├── utils.ts                    # Utilities
│   └── export-pdf.ts               # PDF generation
└── .env.local.example
```

---

## Built at Hack-Nation 2026

**Challenge:** The AI Scientist — powered by Fulcrum Science  
**Category:** AI / Scientific Tools  
**Stack:** Next.js · Groq · Tavily · Semantic Scholar · Supabase · Litmus · Vercel
