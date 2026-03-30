# Canvas — Product Operations Spec v1.0

**Date:** 2/16/26
**Specced Using:** Universal Product Operations Pack v1.0 + Universal Methodology Pack v1.0
**Status:** Build Ready
**Target:** React (Next.js) application with Supabase backend

---

## Part 1: Product Definition

### 1.1 What the Product IS

A visual feature specification tool that lets a solo founder drop feature ideas onto a spatial canvas, spec them through structured frameworks with AI assistance at each stage, track dependencies between features, and export unambiguous build briefs for Claude Code.

### 1.2 Core Value Propositions

| Value Prop | Description | Status |
|---|---|---|
| Visualize | Spatial canvas showing features as draggable nodes with animated connections | Build |
| Spec | Structured workflow steps, API contracts, acceptance criteria per node | Build |
| AI Assist | Scoped AI per node, powered by Methodology Pack + Product Ops Pack | Build |
| Validate | AI classifies features (POP/POB/UI/workflow), flags mixed workflows, enforces separation | Build |
| Export | Generate "One Task at a Time" Claude Code briefs from completed specs | Build |
| Track | Fidelity progression (Concept → Wireframe → Mockup → Build Ready) with visual indicators | Build |
| Connect | Dependency linking between nodes, visible as animated connection lines on canvas | Build |

### 1.3 User Personas

**Primary:** Chairman (Tommy) — solo founder, full access to all features, schema, specs, AI

**Secondary:** Sub-admin — scoped access to assigned features only, cannot see full roadmap or schema (future phase)

### 1.4 Product Boundaries

**Does:**
- Visual node canvas with drag, connect, animate
- Structured spec building (steps, APIs, acceptance criteria)
- AI chat scoped per node with framework enforcement
- Fidelity tracking with gamified progression
- Dependency mapping between features
- Export structured briefs for Claude Code
- Persist all data across sessions (Supabase)

**Does not:**
- Connect to live codebase/GitHub (future phase)
- Execute code or run tests
- Manage deployments
- Handle payments or user auth beyond admin login (future phase)

---

## Part 2: Page Inventory

| Page | URL | Purpose | Status |
|---|---|---|---|
| Landing / Template Picker | /canvas | Entry — choose template or load existing project | Build |
| Canvas Workspace | /canvas/[projectId] | Main workspace — visual canvas + detail panel + AI | Build |

### 2.2 Page Dependencies

```
Landing Page
    │
    ├── GET /api/canvas/projects (list saved projects)
    ├── POST /api/canvas/projects (create new project)
    │
    └── Canvas Workspace
        ├── GET /api/canvas/projects/[id] (load project: nodes, connections, chats)
        ├── PUT /api/canvas/projects/[id] (auto-save project state)
        ├── POST /api/canvas/ai/chat (AI chat per node)
        └── POST /api/canvas/export/[nodeId] (generate Claude Code brief)
```

---

## Part 3: Workflow Specifications

### Workflow 1: Create New Feature Node

**Purpose:** Drop a new feature idea onto the canvas as a node
**Why it matters:** Every feature starts as a distinct, isolated concept — prevents the mixing problem

**STEP 1: INPUT**
- User action: Clicks node type icon in sidebar (Screen, User Action, Logic, AI Process) OR clicks "+" button on canvas
- Accepted inputs: Node type selection
- System action: Creates new node at default position on canvas with empty spec fields, assigns step number
- Success state: New node appears on canvas with entrance animation, detail panel opens automatically
- Error states: None expected — local operation
- API called: None (local state, auto-saved on next cycle)

**STEP 2: CONFIGURE**
- Required fields: Title (user types into node or detail panel)
- Optional fields: Description, priority, node type change
- Validation rules: Title cannot be empty to advance past Concept fidelity
- Success state: Node displays title, type icon, step number on canvas

**STEP 3: SPEC (progressive — see Fidelity Workflows below)**
- This is the core loop — covered in Workflows 2-5

---

### Workflow 2: Concept → Wireframe (Fidelity Advance)

**Purpose:** Transform a raw idea into a structured workflow
**Why it matters:** Forces the user to define what this feature actually IS before building it

**STEP 1: INPUT**
- User action: Opens detail panel, describes feature in Overview tab description field. Optionally opens AI chat.
- System action: AI reads description and Methodology Pack context. AI classifies the feature: Is this POP (pre-outcome prediction)? POB (post-outcome benchmarking)? UI-only? Data pipeline? Mixed workflow?
- Success state: AI provides classification and initial workflow suggestions
- Error states: AI flags if description is too vague to classify
- API called: POST /api/canvas/ai/chat

**STEP 2: AI WORKFLOW GENERATION**
- User action: Confirms AI classification or corrects it. Says "walk me through the workflow spec" or similar.
- System action: AI generates workflow steps following Product Ops Pack Section 3.2 template. Each step includes: User Action, System Action, Success State, Error States, API Called. AI populates the Steps tab with generated steps.
- Success state: Steps tab populated with structured workflow steps. User can edit, reorder, add, remove.
- Error states: AI detects mixed workflow — flags it and recommends splitting into separate nodes. AI detects dependency on non-existent infrastructure — flags it.
- API called: POST /api/canvas/ai/chat

**STEP 3: VALIDATION**
- User action: Reviews generated steps, makes edits
- System action: System checks that at least 2 workflow steps are defined with non-empty titles
- Success state: Fidelity advances to "Wireframe." XP bar updates. Node on canvas shows step count badge.
- Error states: Cannot advance — missing required step fields

**CRITICAL AI BEHAVIOR AT THIS LEVEL:**
The AI must invoke the Methodology Pack's contamination rule. If a feature's inputs include post-execution data (views, revenue, engagement), the AI must flag this and classify accordingly. If the user describes a feature that combines pre-execution prediction with post-execution benchmarking, the AI must immediately say: "This is two features. [Feature A] is POP — it uses pre-execution inputs. [Feature B] is POB — it uses real outcomes. These must be separate nodes with separate specs."

---

### Workflow 3: Wireframe → Mockup (Fidelity Advance)

**Purpose:** Add API contracts and dependency mapping
**Why it matters:** Defines what the system needs to build — endpoints, data shapes, connections

**STEP 1: API GENERATION**
- User action: Navigates to APIs tab. Optionally asks AI "what APIs does this need?"
- System action: AI analyzes the workflow steps and generates API endpoint specs. For each endpoint: method (GET/POST/PUT/DELETE), path, purpose, request shape, response shape. AI references Product Ops Pack Section 4.2 endpoint spec template.
- Success state: APIs tab populated with endpoint definitions
- Error states: AI flags if workflow steps reference external services without integration specs
- API called: POST /api/canvas/ai/chat

**STEP 2: DEPENDENCY MAPPING**
- User action: In Overview tab, clicks other node names to toggle dependency links
- System action: Connection line appears on canvas between linked nodes. System checks for circular dependencies.
- Success state: Visual connections on canvas. Dependency count shown on node badge.
- Error states: Circular dependency detected — warning shown

**STEP 3: VALIDATION**
- System checks: At least 1 API endpoint defined. Description is non-empty.
- Success state: Fidelity advances to "Mockup." XP bar updates.

---

### Workflow 4: Mockup → Build Ready (Fidelity Advance)

**Purpose:** Complete acceptance criteria and verification requirements
**Why it matters:** This is the gate. Nothing leaves Canvas without passing this.

**STEP 1: ACCEPTANCE CRITERIA**
- User action: Navigates to Acceptance tab. Clicks "+ Defaults" to load standard checklist from Product Ops Pack Section 3.2. Adds custom criteria.
- System action: Default criteria loaded from Product Ops Pack: Required inputs validated, Button disabled until valid, Loading state visible, Completes within target time, Errors shown (no silent failures), Results include score + confidence + range (if applicable), Recommendations specific + actionable (if applicable), Event persisted, No console errors. AI can suggest feature-specific criteria.
- Success state: Acceptance criteria list populated, checkboxes ready for verification
- Error states: None — this is a population step

**STEP 2: AI REVIEW**
- User action: Asks AI to review the full spec for completeness
- System action: AI reads all tabs (Overview, Steps, APIs, Acceptance) and checks against Product Ops Pack requirements. AI flags: missing error handling in workflow steps, APIs without response schemas, acceptance criteria that are too vague, workflow steps that don't match API definitions.
- Success state: AI provides "Ready" or "Not Ready" with specific gaps listed
- Error states: AI identifies blocking issues — cannot advance until resolved
- API called: POST /api/canvas/ai/chat

**STEP 3: VALIDATION**
- System checks: At least 5 acceptance criteria defined. All workflow steps have non-empty title + at least one of userAction/systemAction. At least 1 API endpoint defined.
- Success state: Fidelity advances to "Build Ready." Node glows green on canvas. Export tab unlocked.

---

### Workflow 5: Export Claude Code Brief

**Purpose:** Generate a structured, unambiguous build prompt
**Why it matters:** This is what gets handed to Claude Code. It must be complete and self-contained.

**STEP 1: GENERATE**
- User action: Navigates to Export tab. Clicks "Copy."
- System action: System compiles all spec data into Product Ops Pack Section 8.1 "One Task at a Time" format:

```
TASK: {node title}
TYPE: {node type label}
PRIORITY: P{priority number}

SPEC:
{description}

NOTES:
{architecture notes}

WORKFLOW STEPS:
{for each step:}
  {step number}. {title}
     User Action: {userAction}
     System Action: {systemAction}
     Success: {successState}
     Errors: {errorStates}
     API: {apiCalled}

API ENDPOINTS:
{for each api:}
  {method} {endpoint} — {purpose}
  Request: {request shape}
  Response: {response shape}

DEPENDENCIES:
{list of linked node titles}

ACCEPTANCE CRITERIA:
{for each criterion:}
  [ ] {criterion text}

DO NOT claim done without:
- test output
- screenshots/logs
- sample requests/responses
- verification against each acceptance criterion above
```

- Success state: Brief copied to clipboard. Toast confirmation shown.
- Error states: Clipboard API failure — show brief in selectable text block as fallback.

---

## Part 4: API Specifications

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| /api/canvas/projects | GET | List all saved canvas projects | Build |
| /api/canvas/projects | POST | Create new project | Build |
| /api/canvas/projects/[id] | GET | Load project (nodes, connections, chats) | Build |
| /api/canvas/projects/[id] | PUT | Save/update project state | Build |
| /api/canvas/projects/[id] | DELETE | Delete project | Build |
| /api/canvas/ai/chat | POST | AI chat scoped to node context | Build |
| /api/canvas/export/[nodeId] | POST | Generate formatted Claude Code brief | Build |

### 4.1 Key Endpoint Specs

**POST /api/canvas/ai/chat**

Request:
```json
{
  "projectId": "string",
  "nodeId": "string",
  "message": "string",
  "history": [{ "role": "user|assistant", "content": "string" }],
  "nodeContext": {
    "title": "string",
    "type": "screen|action|logic|ai",
    "fidelity": "concept|wireframe|mockup|build-ready",
    "description": "string",
    "steps": [],
    "apis": [],
    "acceptance": [],
    "dependencies": ["nodeId"]
  }
}
```

Response:
```json
{
  "success": true,
  "message": "string",
  "suggestions": {
    "classification": "POP|POB|UI|pipeline|mixed",
    "warnings": ["string"],
    "generatedSteps": [],
    "generatedApis": []
  }
}
```

System prompt: Embedded Universal Methodology Pack v1.0 + Universal Product Operations Pack v1.0 (condensed). Fidelity-aware — AI behavior changes based on current fidelity level of the node.

**PUT /api/canvas/projects/[id]**

Request:
```json
{
  "nodes": [{
    "id": "string",
    "type": "screen|action|logic|ai",
    "step": "number",
    "title": "string",
    "desc": "string",
    "x": "number",
    "y": "number",
    "fidelity": "concept|wireframe|mockup|build-ready",
    "priority": "0|1|2|3",
    "steps": [{
      "id": "string",
      "title": "string",
      "userAction": "string",
      "systemAction": "string",
      "successState": "string",
      "errorStates": "string",
      "apiCalled": "string"
    }],
    "apis": [{
      "id": "string",
      "method": "GET|POST|PUT|DELETE",
      "endpoint": "string",
      "purpose": "string",
      "request": "string",
      "response": "string"
    }],
    "acceptance": [{
      "id": "string",
      "text": "string",
      "done": "boolean"
    }],
    "dependencies": ["nodeId"],
    "notes": "string"
  }],
  "connections": [{
    "from": "nodeId",
    "to": "nodeId",
    "label": "string"
  }],
  "chats": {
    "nodeId": [{
      "role": "user|assistant",
      "text": "string"
    }]
  }
}
```

---

## Part 5: Integration Map

```
Canvas UI (React)
    │
    ├── Canvas Area
    │   ├── Node rendering (drag, select, animate)
    │   ├── Connection rendering (SVG animated paths)
    │   └── Dot grid background
    │
    ├── Detail Panel (slides in on node select)
    │   ├── Overview Tab → PUT /api/canvas/projects/[id]
    │   ├── Steps Tab → PUT /api/canvas/projects/[id]
    │   ├── APIs Tab → PUT /api/canvas/projects/[id]
    │   ├── Acceptance Tab → PUT /api/canvas/projects/[id]
    │   ├── Export Tab → POST /api/canvas/export/[nodeId]
    │   └── AI Chat → POST /api/canvas/ai/chat
    │
    └── Sidebar
        ├── Navigation
        ├── Node type palette (add nodes)
        └── User avatar
```

---

## Part 6: Verification Protocol

### 6.1 How To Verify Canvas

1. Define success criteria (this document)
2. Execute tests against each workflow
3. Compare expected vs actual behavior
4. Document PASS/FAIL with evidence
5. Never accept "it works" without evidence

### 6.2 Verification Checklist

```
CANVAS VERIFICATION
====================
Date:
Tester: Tommy (Chairman)
Environment: Production

VISUAL CANVAS
[ ] PASS/FAIL - Nodes render with correct type colors and icons
[ ] PASS/FAIL - Nodes are draggable, positions persist
[ ] PASS/FAIL - Connections animate between linked nodes
[ ] PASS/FAIL - Selected node highlights, connections activate particles
[ ] PASS/FAIL - Dot grid renders at correct opacity
[ ] PASS/FAIL - New nodes can be added from sidebar palette

DETAIL PANEL
[ ] PASS/FAIL - Panel slides in on node select
[ ] PASS/FAIL - All 5 tabs render and switch correctly
[ ] PASS/FAIL - Overview: description, priority, dependencies, notes all save
[ ] PASS/FAIL - Steps: add, edit, reorder, delete workflow steps
[ ] PASS/FAIL - APIs: add, edit, delete endpoint definitions
[ ] PASS/FAIL - Acceptance: load defaults, add custom, toggle checkboxes
[ ] PASS/FAIL - Export: generates correct brief format, copy to clipboard works

FIDELITY SYSTEM
[ ] PASS/FAIL - Fidelity track updates visually on advance
[ ] PASS/FAIL - XP bar reflects current fidelity level
[ ] PASS/FAIL - Node badges on canvas show step count + acceptance progress

AI CHAT
[ ] PASS/FAIL - AI chat opens in panel, scoped to selected node
[ ] PASS/FAIL - AI receives node context (title, type, fidelity, description, steps, apis)
[ ] PASS/FAIL - AI responds with framework-appropriate guidance per fidelity level
[ ] PASS/FAIL - AI flags mixed workflows when detected
[ ] PASS/FAIL - AI classifies features as POP/POB/UI/pipeline correctly
[ ] PASS/FAIL - Quick prompt buttons work

PERSISTENCE
[ ] PASS/FAIL - All project data saves to Supabase
[ ] PASS/FAIL - Project loads correctly on return visit
[ ] PASS/FAIL - Auto-save triggers on changes

Evidence links / screenshots:
Notes:
```

---

## Part 7: Priority Roadmap

### 7.1 Current State

| System | Status | Blocking Issue |
|---|---|---|
| Visual Canvas | Prototype exists (React artifact) | Not connected to Supabase |
| Detail Panel | Prototype exists (React artifact) | Not connected to Supabase |
| AI Chat | Prototype exists (direct Anthropic API) | Needs server-side proxy for API key |
| Persistence | None | No database tables yet |
| Export | Prototype exists (clipboard) | Works as-is |

### 7.2 Build Priority Order

**Priority 0: Database schema + persistence**
- Supabase tables for projects, nodes, connections, chats
- Auto-save on change
- Load on return

**Priority 1: Canvas workspace (core UI)**
- Visual canvas with node rendering, drag, connections
- Detail panel with all 5 tabs
- Fidelity tracking system
- Node type palette

**Priority 2: AI chat integration**
- Server-side API route proxying to Anthropic
- System prompt with embedded packs
- Fidelity-aware behavior
- Node context injection

**Priority 3: Export system**
- Brief generation from node spec data
- Copy to clipboard
- Format per Product Ops Pack Section 8.1

**Priority 4: Polish**
- Animations (node entrance, panel slide, connection particles)
- Gamification (XP bars, shimmer, glow effects)
- Responsive behavior
- Welcome flow / template picker

---

## Part 8: Supabase Schema

```sql
-- Canvas Projects
CREATE TABLE canvas_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  template_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Canvas Nodes
CREATE TABLE canvas_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES canvas_projects(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('screen', 'action', 'logic', 'ai')),
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Node',
  description TEXT DEFAULT '',
  x FLOAT DEFAULT 200,
  y FLOAT DEFAULT 200,
  fidelity TEXT DEFAULT 'concept' CHECK (fidelity IN ('concept', 'wireframe', 'mockup', 'build-ready')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 0 AND 3),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow Steps (per node)
CREATE TABLE canvas_node_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  title TEXT DEFAULT '',
  user_action TEXT DEFAULT '',
  system_action TEXT DEFAULT '',
  success_state TEXT DEFAULT '',
  error_states TEXT DEFAULT '',
  api_called TEXT DEFAULT ''
);

-- API Endpoints (per node)
CREATE TABLE canvas_node_apis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  method TEXT DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  endpoint TEXT DEFAULT '/api/',
  purpose TEXT DEFAULT '',
  request_shape TEXT DEFAULT '',
  response_shape TEXT DEFAULT ''
);

-- Acceptance Criteria (per node)
CREATE TABLE canvas_node_acceptance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Node Connections
CREATE TABLE canvas_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES canvas_projects(id) ON DELETE CASCADE,
  from_node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  label TEXT DEFAULT ''
);

-- Node Dependencies (many-to-many)
CREATE TABLE canvas_node_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  depends_on_node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  UNIQUE(node_id, depends_on_node_id)
);

-- AI Chat Messages (per node)
CREATE TABLE canvas_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE canvas_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_chat_messages ENABLE ROW LEVEL SECURITY;

-- Chairman sees all (replace UUID with actual user ID)
CREATE POLICY "chairman_all" ON canvas_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "chairman_nodes" ON canvas_nodes FOR ALL USING (
  project_id IN (SELECT id FROM canvas_projects WHERE user_id = auth.uid())
);
-- Repeat pattern for all child tables
```

---

## Part 9: AI System Prompt (Full — to be embedded in API route)

This is the complete system prompt that powers the Canvas AI. It is injected server-side so the user never sees it or the API key.

```
You are the Canvas AI — an intelligent architecture companion for a solo founder building CleanCopy (aka Trendzo), a TikTok viral video analytics platform.

You operate according to two frameworks that are non-negotiable:

=== UNIVERSAL METHODOLOGY PACK v1.0 ===

TWO-SYSTEM DESIGN:
- Pre-Outcome Prediction (POP): Predicts performance BEFORE execution using ONLY pre-execution inputs. Output = score (0-100) + confidence + recommendations.
- Post-Outcome Benchmarking (POB): Measures actual results AFTER execution relative to comparable peers. Output = percentile rank.
- These are SEPARATE systems. They require different inputs, different infrastructure, and different UI flows.

CONTAMINATION RULE: Remove any feature that is only known after execution (views, revenue, conversions, real engagement) from POP. If a feature spec includes post-execution data in a pre-execution workflow, FLAG IT IMMEDIATELY.

FOUR SIGNAL PATHS (for scoring features):
- Quantitative: artifact/media feature extraction, structured features, predictive models
- Qualitative: expert evaluation rubric, multi-rater consensus
- Pattern: templates/playbooks, framework scoring, pattern matching
- Historical: similarity to historical cases, timing/context signals
Each path must produce: (a) a score, (b) a confidence, (c) an explanation trace.

FEATURE AVAILABILITY MATRIX: For any feature involving data, ask: Is this available pre-execution? Post-execution? Both? This determines which system it belongs to.

TRAINING PROCESS: Collect → Clean → Feature Extract → Label → Train → Validate → Version → Deploy. Any feature involving model training must follow this pipeline.

=== UNIVERSAL PRODUCT OPERATIONS PACK v1.0 ===

WORKFLOW SPEC TEMPLATE (enforce at Wireframe fidelity and above):
Every workflow step must define:
- User action (what the user does)
- System action (what the system does in response)
- Success state (what "working" looks like)
- Error states (what can go wrong)
- API called (which endpoint is hit)

ACCEPTANCE CRITERIA (enforce at Build Ready):
[ ] Required inputs validated
[ ] Button disabled until valid
[ ] Loading state visible
[ ] Completes within target time
[ ] Errors shown (no silent failures)
[ ] Results include score + confidence + range (if scoring feature)
[ ] Recommendations specific + actionable (if recommendation feature)
[ ] Event persisted to database
[ ] No console errors

VERIFICATION PROTOCOL (non-negotiable):
1. Define success criteria
2. Execute test
3. Compare expected vs actual
4. Document PASS/FAIL with evidence
5. NEVER accept "it works" without evidence

EXPORT FORMAT ("One Task at a Time" — Section 8.1):
TASK, SPEC (input/output/edge cases/acceptance criteria/evidence required). DO NOT claim done without test output, screenshots/logs, sample requests/responses.

=== YOUR BEHAVIOR AT EACH FIDELITY LEVEL ===

CONCEPT: Help brainstorm. Classify the feature (POP/POB/UI/pipeline/mixed). If mixed, IMMEDIATELY flag and recommend splitting into separate nodes. Ask: "What inputs are available? What outputs are expected? What existing infrastructure does this touch?"

WIREFRAME: Walk through workflow spec template step by step. Generate structured steps. Flag missing error handling. Flag dependencies on infrastructure that doesn't exist yet.

MOCKUP: Generate API endpoint contracts. Define request/response shapes. Identify database table impacts. Map page dependencies. Flag if APIs don't align with workflow steps.

BUILD READY: Generate full acceptance criteria. Review entire spec for completeness. Produce verification checklist. Flag any gaps that would block a clean handoff to Claude Code.

=== RULES ===
- If a feature mixes two distinct workflows, IMMEDIATELY flag it and recommend splitting.
- Be direct, technical, no filler. You're talking to Tommy, the Chairman and solo founder.
- Never let a feature advance fidelity without its current level being properly specified.
- If something won't work architecturally, say so.
- Reference specific sections of the frameworks when relevant.
```

---

## Part 10: Sign-Off Checklist

```
CANVAS PRODUCTION READINESS
============================
[ ] Database schema deployed to Supabase
[ ] Core API routes stable (projects CRUD, AI chat, export)
[ ] Canvas workspace renders — nodes, connections, drag, select
[ ] Detail panel — all 5 tabs functional
[ ] AI chat — scoped per node, framework-aware, fidelity-aware
[ ] Fidelity system — visual progression, validation gates
[ ] Persistence — auto-save, load on return
[ ] Export — generates correct brief format, clipboard copy works
[ ] No silent failures in any workflow
[ ] Errors visible and recoverable
[ ] Verification docs completed (Part 6 checklist passed)

SIGN-OFF:
Date:
Verified by: Tommy (Chairman)
Status: READY / NOT READY
Blocking issues:
```

---
---
---

# CLAUDE CODE PLAN PROMPTS

The following are sequential prompts to give Claude Code's plan agent. Each one is a self-contained task following the "One Task at a Time" format from Product Ops Pack Section 8.1. Execute them in order.

---

## Prompt 1: Database Schema

```
TASK: Create Supabase database schema for Canvas feature specification tool

SPEC:
- Input: SQL migration file
- Output: 8 tables created in Supabase with RLS policies enabled

Create the following tables:

1. canvas_projects (id UUID PK, user_id UUID FK auth.users, title TEXT, template_type TEXT, created_at, updated_at)

2. canvas_nodes (id UUID PK, project_id UUID FK canvas_projects ON DELETE CASCADE, node_type TEXT CHECK IN ('screen','action','logic','ai'), step_number INT, title TEXT DEFAULT 'New Node', description TEXT, x FLOAT, y FLOAT, fidelity TEXT CHECK IN ('concept','wireframe','mockup','build-ready') DEFAULT 'concept', priority INT CHECK 0-3 DEFAULT 1, notes TEXT, created_at, updated_at)

3. canvas_node_steps (id UUID PK, node_id UUID FK canvas_nodes ON DELETE CASCADE, sort_order INT, title TEXT, user_action TEXT, system_action TEXT, success_state TEXT, error_states TEXT, api_called TEXT)

4. canvas_node_apis (id UUID PK, node_id UUID FK canvas_nodes ON DELETE CASCADE, method TEXT CHECK IN ('GET','POST','PUT','DELETE','PATCH'), endpoint TEXT, purpose TEXT, request_shape TEXT, response_shape TEXT)

5. canvas_node_acceptance (id UUID PK, node_id UUID FK canvas_nodes ON DELETE CASCADE, text TEXT, done BOOLEAN DEFAULT false, sort_order INT)

6. canvas_connections (id UUID PK, project_id UUID FK canvas_projects ON DELETE CASCADE, from_node_id UUID FK canvas_nodes ON DELETE CASCADE, to_node_id UUID FK canvas_nodes ON DELETE CASCADE, label TEXT)

7. canvas_node_dependencies (id UUID PK, node_id UUID FK canvas_nodes ON DELETE CASCADE, depends_on_node_id UUID FK canvas_nodes ON DELETE CASCADE, UNIQUE(node_id, depends_on_node_id))

8. canvas_chat_messages (id UUID PK, node_id UUID FK canvas_nodes ON DELETE CASCADE, role TEXT CHECK IN ('user','assistant'), content TEXT, created_at)

Enable RLS on all tables. Create policies so authenticated user can CRUD their own projects and all child records.

Edge cases:
- Deleting a project cascades to all nodes, steps, apis, acceptance, connections, dependencies, chats
- Deleting a node cascades to its steps, apis, acceptance, chats, and removes connections/dependencies referencing it
- Dependencies cannot be circular (enforce at application level, not DB)

Acceptance criteria:
- [ ] All 8 tables exist with correct columns and constraints
- [ ] Foreign keys cascade correctly on delete
- [ ] RLS policies active — user can only access own data
- [ ] Migration runs clean with no errors

Evidence required:
- Migration SQL file
- Screenshot of Supabase table editor showing all tables
- Test: create project, add node, delete project → confirm cascade
```

---

## Prompt 2: API Routes

```
TASK: Create Next.js API routes for Canvas CRUD operations and AI chat

SPEC:
- Input: API route files in /app/api/canvas/
- Output: Working endpoints for project management, auto-save, and AI-powered chat

Create these routes:

GET /api/canvas/projects
- Returns all projects for authenticated user
- Response: { projects: [{ id, title, template_type, node_count, updated_at }] }

POST /api/canvas/projects
- Creates new project
- Request: { title, template_type }
- Response: { project: { id, title } }

GET /api/canvas/projects/[id]
- Returns full project with all nodes, connections, chats
- Single query that joins nodes with their steps, apis, acceptance criteria
- Response: { project, nodes: [{ ...node, steps, apis, acceptance, dependencies }], connections, chats }

PUT /api/canvas/projects/[id]
- Upserts entire project state (nodes, connections)
- This is the auto-save endpoint — called on every change
- Request: { nodes: [...], connections: [...] }
- Must handle: new nodes (insert), updated nodes (update), removed nodes (delete orphans)
- Response: { success: true, updated_at }

DELETE /api/canvas/projects/[id]
- Deletes project and all cascaded data
- Response: { success: true }

POST /api/canvas/ai/chat
- Proxies to Anthropic API with server-side API key
- Request: { projectId, nodeId, message, history, nodeContext }
- Builds system prompt from embedded Methodology Pack + Product Ops Pack (provided separately as a constant)
- Injects node context (title, type, fidelity, description, steps, apis, acceptance count)
- Response: { message: string }

POST /api/canvas/export/[nodeId]
- Generates Claude Code brief from node spec data
- Compiles: title, type, priority, description, workflow steps, API endpoints, dependencies (resolved to titles), acceptance criteria, verification footer
- Response: { brief: string }

Edge cases:
- Auto-save debounce: frontend should debounce PUT calls to max 1 per 2 seconds
- AI chat: if Anthropic API fails, return { error: "AI unavailable" } with 503
- Export: if node has no steps/apis, still generate brief with empty sections marked "None defined"
- Auth: all routes require authenticated user, return 401 if not

Acceptance criteria:
- [ ] All 7 routes exist and return correct response shapes
- [ ] Auth check on every route
- [ ] Auto-save PUT correctly handles insert/update/delete of nodes
- [ ] AI chat proxies successfully with system prompt injected
- [ ] Export generates correctly formatted brief
- [ ] No console errors on any route

Evidence required:
- Test each endpoint with sample requests
- Show AI chat response with node context visible in the prompt
- Show export output for a node with steps + APIs + acceptance
```

---

## Prompt 3: Canvas UI — Core Workspace

```
TASK: Build the Canvas workspace page as a React component at /app/canvas/[projectId]/page.tsx

SPEC:
- Input: Project data from API
- Output: Interactive visual canvas with node rendering, drag, connections, detail panel

This is the main workspace. It consists of:

1. DARK SIDEBAR (width 62px, background #141414)
   - Logo: pink gradient icon (linear-gradient 135deg #e91e63 to #c2185d), border-radius 14, glow shadow
   - Nav icons: Home (back to project list), Canvas (active — pink highlight), Settings
   - Node type palette at bottom: 4 icons (Monitor=screen blue, MousePointer=action green, GitBranch=logic yellow, Cpu=ai purple). Clicking one adds a new node of that type to the canvas.
   - User avatar "TC" at bottom

2. TOP BAR (height 50px, white, border-bottom)
   - Green dot + project title + version badge
   - Spec progress bar (calculates % from node fidelities)
   - Node count
   - "Export Spec" button (pink gradient)

3. CANVAS AREA (flex 1, border-radius 16, white background, dot grid)
   - Dot grid: radial-gradient circles at 24px intervals, 7% opacity
   - Subtle color gradients in background (pink, purple, blue at low opacity)
   - SVG layer for connection lines between nodes
   - Connection lines: curved quadratic bezier, dashed stroke, particle animation on active (when either connected node is selected)
   - Nodes: positioned absolutely, draggable, 220px wide
     - Node card: pastel background based on type (blue=#dbeafe, green=#d1fae5, yellow=#fef3c7, purple=#f3e8ff)
     - White icon on colored background circle
     - Title, description (2-line clamp), type label
     - Footer: step count badge, acceptance progress, XP fidelity bar with shimmer animation
     - Hover: lift (translateY -3px), glow intensifies
     - Selected: scale 1.02, strong glow, border matches type color
     - Step number badge (top-right circle with type color)

4. DETAIL PANEL (width 400px, slides in from right on node select)
   - Header: node icon, title, fidelity label, type label
   - AI toggle button (sparkle icon)
   - Fidelity track: 4 clickable progress segments
   - 5 tabs: Overview, Steps, APIs, Acceptance, Export
   - Tab content scrollable
   - AI chat mode: replaces tab content with chat interface (message list + input)

All data loads from GET /api/canvas/projects/[id] on mount.
All changes auto-save via PUT /api/canvas/projects/[id] with 2-second debounce.
AI chat calls POST /api/canvas/ai/chat.
Export calls POST /api/canvas/export/[nodeId] OR generates client-side.

Edge cases:
- Empty project (no nodes): show centered prompt "Add your first node from the sidebar"
- Node dragged off-screen: clamp to canvas bounds
- Detail panel open + click different node: panel updates to new node (no close/reopen)
- Rapid typing in text fields: debounce save, don't block UI
- AI chat loading: show spinner, disable send button
- Connection to deleted node: remove connection

Acceptance criteria:
- [ ] Canvas renders with dot grid and gradient background
- [ ] Nodes render with correct type colors, icons, and data
- [ ] Nodes are draggable, positions save
- [ ] Connections render as animated curves between linked nodes
- [ ] Detail panel slides in on node select with all 5 tabs working
- [ ] AI chat opens, sends messages, receives responses
- [ ] Fidelity track updates and persists
- [ ] Auto-save fires on changes
- [ ] Export generates and copies brief to clipboard
- [ ] Animations: node entrance, panel slide, connection particles, XP shimmer
- [ ] No console errors

Evidence required:
- Screenshots of canvas with multiple nodes and connections
- Video/gif of drag interaction
- Screenshot of detail panel with each tab
- AI chat exchange showing framework-aware response
- Exported brief content
```

---

## Prompt 4: AI System Prompt Integration

```
TASK: Create the AI system prompt constant and integrate it into the chat API route

SPEC:
- Input: System prompt text (provided below)
- Output: Constants file + updated chat route that injects prompt + node context

Create a file at /lib/canvas/ai-system-prompt.ts that exports the full Canvas AI system prompt as a constant string. The prompt is provided in the attached spec document under "Part 9: AI System Prompt."

Update the POST /api/canvas/ai/chat route to:
1. Import the system prompt constant
2. Build a context block from the node data: title, type, fidelity level and description, number of steps defined, number of APIs defined, acceptance criteria progress (done/total), dependency list (resolved to node titles)
3. Append the context block to the system prompt
4. Send to Anthropic API (claude-sonnet-4-20250514, max_tokens 1000)
5. Return the response

The AI must behave differently based on fidelity level:
- Concept: classification and brainstorming mode
- Wireframe: workflow spec generation mode (generates steps)
- Mockup: API contract generation mode
- Build Ready: review and verification mode

Edge cases:
- Chat history exceeds token limit: truncate to last 10 messages
- Node context missing fields: use "Not yet defined" as fallback
- Anthropic API timeout: return friendly error after 30 seconds
- Empty message: return 400

Acceptance criteria:
- [ ] System prompt includes full Methodology Pack rules
- [ ] System prompt includes full Product Ops Pack templates
- [ ] Node context is correctly injected per request
- [ ] AI response references the correct fidelity level
- [ ] AI flags mixed workflows when prompted with a mixed feature description
- [ ] AI classifies POP vs POB correctly when asked

Evidence required:
- Send "Is this POP or POB?" for a prediction feature → AI says POP
- Send "Walk me through the workflow spec" at wireframe level → AI generates structured steps
- Send a feature description that mixes training + prediction → AI flags it and recommends splitting
```

---

## Prompt 5: Landing Page + Project Management

```
TASK: Build the Canvas landing/project selection page at /app/canvas/page.tsx

SPEC:
- Input: List of saved projects from API
- Output: Landing page with template picker for new projects and list of existing projects

Layout:
- Centered content, light gradient background (subtle pink/purple radials)
- Header: Canvas logo icon (pink gradient, same as sidebar), "Canvas" title, subtitle "Turn brain slop into buildable specs"
- Template grid (2x2): "New Page Feature", "New Integration", "New Workflow", "Feature Request" — each with icon, title, description, accent color. Clicking creates a new project with that template type and navigates to /canvas/[newId]
- Below templates: "Recent Projects" section showing saved projects as cards. Each card shows: title, node count, fidelity progress, last updated. Clicking navigates to /canvas/[id]. Delete button with confirmation.
- Entrance animations: staggered fade-up on cards

Edge cases:
- No saved projects: hide "Recent Projects" section
- Delete last project: section disappears
- Create project fails: show error toast
- Long project title: truncate with ellipsis

Acceptance criteria:
- [ ] Template picker renders with 4 options
- [ ] Clicking template creates project and navigates to workspace
- [ ] Saved projects list loads and displays correctly
- [ ] Delete project works with confirmation
- [ ] Entrance animations fire on page load
- [ ] No console errors

Evidence required:
- Screenshot of landing page with templates
- Screenshot showing saved projects list
- Create new project → verify redirect to workspace
- Delete project → verify removal from list
```