# Canvas AI-First Restructure — Product Operations Spec v2.0

**Date:** 2/16/26
**Specced Using:** Universal Product Operations Pack v1.0 + Universal Methodology Pack v1.0
**Status:** Build Ready

**Restructure Reason:** v1.0 built Canvas as a form-first tool with AI as an optional sidebar toggle. The user was expected to fill in workflow steps, API contracts, and acceptance criteria manually. This defeats the core purpose: a solo founder who has ideas in their head but not the engineering vocabulary to structure them into specs. The AI must drive the process. The user talks. The AI structures.

---

## Part 1: Product Definition (Revised)

### 1.1 What the Product IS (Revised)

A conversational feature specification tool where the user describes ideas in natural language, the AI classifies them, generates structured specs (workflow steps, API contracts, acceptance criteria), populates them onto a visual canvas, and guides the user through progressive refinement until the spec is Build Ready and exportable to Claude Code.

### 1.2 Core Value Propositions (Revised)

| Value Prop | Description | v1 Status | v2 Change |
|---|---|---|---|
| Converse | User describes ideas in plain language, AI does the structuring | Missing | PRIMARY interface |
| Classify | AI identifies POP/POB/UI/pipeline, flags mixed workflows | Existed in prompt only | Visible in UI, auto-triggered |
| Generate | AI creates workflow steps, API contracts, acceptance criteria | User had to fill manually | AI generates, user reviews |
| Guide | AI tells user what to do next at every stage | Missing entirely | Step-by-step prompting |
| Visualize | Spatial canvas with nodes, connections, animations | Working | Preserved |
| Track | Fidelity progression with gamification | Manual click only | Auto-advances on content |
| Export | Claude Code briefs | Working | Preserved |

### 1.3 The Fundamental UX Inversion

**v1 (wrong):** User opens tab → sees empty form → fills in fields → optionally asks AI

**v2 (correct):** User talks to AI → AI fills in fields → user reviews structured output in tabs → AI prompts next step

The tabs still exist. The forms still exist. But they are the OUTPUT layer, not the INPUT layer. The AI chat is the input layer.

---

## Part 2: What Changes vs. What Stays

### Stays (no modification needed)

- Database schema (8 tables) — no changes
- API routes: GET/PUT/DELETE projects, POST export — no changes
- Visual canvas: nodes, connections, drag, dot grid, animations — no changes
- Sidebar: logo, nav, node palette — no changes
- TopBar: progress, node count, export button — no changes

### Changes (files modified)

| File | Change |
|---|---|
| `DetailPanel.tsx` | Major rewrite — AI chat becomes primary view, tabs become secondary review layer |
| `page.tsx` | Add onboarding flow for new projects, wire AI-generated node creation |
| `ai-system-prompt.ts` | Add structured output instructions so AI returns actionable JSON alongside prose |
| `/api/canvas/ai/chat/route.ts` | Parse AI structured output, apply to node data, return both message and mutations |
| `CanvasNode.tsx` | Add right-click context menu (delete, duplicate) |

---

## Part 3: Workflow Specifications (Revised)

### Workflow 1: New Project Onboarding (NEW — replaces blank canvas)

**Workflow Name:** First Feature Capture
**Purpose:** When a user creates a new project from any template, they land in a guided conversation — never a blank canvas.
**Why it matters:** A blank canvas with no direction is the exact problem Canvas was built to solve. The onboarding must eliminate the "what do I do now?" moment.

#### STEP 1: TEMPLATE SELECTION

- **User action:** Clicks template card on landing page (New Page Feature, New Integration, New Workflow, Feature Request)
- **System action:** Creates project, navigates to workspace. Canvas is empty BUT the Detail Panel opens automatically in AI Chat mode with a template-specific starter message.
- **Success state:** User sees the canvas on the left (empty, with dot grid) and the AI chat on the right with a greeting and first question.
- **Error states:** Project creation fails → error toast, stay on landing page
- **API called:** POST /api/canvas/projects

#### STEP 2: AI GREETING (template-specific)

- **System action:** AI chat displays a starter message based on template type:
  - **New Page Feature:** "What page or screen are you thinking about? Describe it however it's in your head right now — the messier the better. I'll help structure it."
  - **New Integration:** "What service or system do you want to connect to? Tell me what you're trying to achieve and I'll map out the integration."
  - **New Workflow:** "What process are you trying to build? Walk me through it like you're explaining it to someone — I'll turn it into a structured spec."
  - **Feature Request:** "What's the feature idea? Just dump it — a sentence, a paragraph, a rambling thought. I'll organize it."
- **Success state:** User sees a clear, inviting prompt that tells them exactly what to do — talk.
- **Error states:** None

#### STEP 3: USER DESCRIBES IDEA

- **User action:** Types natural language description of their idea
- **System action:** AI processes the input and does three things simultaneously:
  1. **CLASSIFIES:** Identifies feature type (POP/POB/UI/pipeline/mixed). If mixed, immediately flags it and recommends splitting.
  2. **CREATES NODE:** Generates a node on the canvas with title, description, type, and drops it at a visible position.
  3. **RESPONDS:** Tells the user what it understood, what classification it made, and asks the next question to deepen the spec.
- **Success state:** A node appears on the canvas. The AI chat shows the classification and a follow-up question. The user sees their idea taking shape without filling in a single form field.
- **Error states:** AI fails → "I couldn't process that. Try describing it differently." No node created.
- **API called:** POST /api/canvas/ai/chat (with structured output mode)

#### STEP 4: AI DRIVES FORWARD

- **System action:** Based on the current fidelity level and what's missing, the AI asks targeted questions:
  - **Concept phase:** "What does the user do first? What should happen when they do it? What can go wrong?"
  - **Wireframe phase:** "I've drafted 3 workflow steps from your description. Review them or tell me what's missing."
  - **Mockup phase:** "Based on the workflow, this feature needs these API endpoints. Does this look right?"
  - **Build Ready phase:** "Here are the acceptance criteria. Anything specific to add before I mark this Build Ready?"
- **User action:** Answers questions, provides corrections, says "looks good" or "change X"
- **System action:** AI updates the node's structured data (steps, APIs, acceptance) and advances fidelity when thresholds are met.
- **Success state:** Spec progressively fills in through conversation. Fidelity advances automatically. User never touches a form unless they want to edit something specific.

---

### Workflow 2: AI-Driven Spec Building (REVISED — replaces manual form filling)

**Workflow Name:** Conversational Spec Generation
**Purpose:** The AI generates all structured spec content from conversation, depositing results into the appropriate tab fields.
**Why it matters:** The user has feature ideas, not engineering specs. The AI bridges that gap.

#### STEP 1: WORKFLOW STEP GENERATION

- **User action:** Describes what the feature should do in conversation
- **System action:** AI generates workflow steps following Product Ops Pack §3.2. Each step includes all 5 fields: User Action, System Action, Success State, Error States, API Called. AI writes these directly into the node's steps array.
- **Success state:** Steps tab populates automatically. Node card on canvas shows step count. AI says "I've added N workflow steps. Want to review them?"
- **Error states:** If description is too vague, AI asks clarifying questions instead of generating garbage steps.
- **API called:** POST /api/canvas/ai/chat (returns mutations in response)

#### STEP 2: API ENDPOINT GENERATION

- **User action:** AI prompts "Ready for me to define the API endpoints?" — user confirms
- **System action:** AI analyzes workflow steps, identifies what endpoints are needed, generates method + path + purpose + request/response shapes per Product Ops Pack §4.2. Writes directly into node's APIs array.
- **Success state:** APIs tab populates. AI says "I've defined N endpoints. Review them in the APIs tab or tell me what to change."
- **Error states:** If workflow steps reference external services AI doesn't recognize, it asks for clarification.

#### STEP 3: ACCEPTANCE CRITERIA GENERATION

- **User action:** AI prompts "Want me to generate acceptance criteria?" — user confirms
- **System action:** AI generates default criteria from Product Ops Pack §3.2 PLUS feature-specific criteria based on the workflow steps and API endpoints. Writes into acceptance array.
- **Success state:** Acceptance tab populates with checkboxes. AI says "I've added N criteria — the 9 standard ones plus M specific to this feature."

#### STEP 4: DEPENDENCY IDENTIFICATION

- **System action:** If other nodes exist on the canvas, AI identifies potential dependencies. "This feature looks like it depends on [other node]. Want me to link them?"
- **User action:** Confirms or declines
- **System action:** Creates dependency link, connection appears on canvas

---

### Workflow 3: Fidelity Auto-Advancement (REVISED — replaces manual clicking)

**Workflow Name:** Automatic Fidelity Progression
**Purpose:** Fidelity level reflects actual spec completeness, not a manual label.
**Why it matters:** The user shouldn't have to know what "Wireframe" means. The system should track progress automatically.

**Rules:**

- **Concept → Wireframe:** Triggered when node has title + description + at least 2 workflow steps with titles
- **Wireframe → Mockup:** Triggered when node has at least 1 API endpoint defined + description is non-empty
- **Mockup → Build Ready:** Triggered when node has at least 5 acceptance criteria + all workflow steps have non-empty title and at least 1 filled detail field + at least 1 API endpoint
- Fidelity can also be manually overridden by clicking the track (preserved from v1)
- Auto-advancement triggers a brief celebration in the UI (the fidelity track segment fills with color, a subtle pulse animation)
- AI acknowledges the advancement: "This spec just hit Wireframe. Next up: defining the API contracts."

---

### Workflow 4: Node Management (NEW — missing from v1)

**Workflow Name:** Node Context Actions
**Purpose:** Users need to delete, duplicate, and manage nodes directly.
**Why it matters:** Without delete, users are stuck with mistakes. Without duplicate, similar features require re-speccing from scratch.

#### STEP 1: RIGHT-CLICK / HOVER ACTIONS

- **User action:** Right-clicks a node on canvas OR hovers and clicks "..." menu icon
- **System action:** Context menu appears with options: Delete, Duplicate, Change Type
- **Success state:** Menu renders positioned near the node

#### STEP 2: DELETE

- **User action:** Clicks "Delete" from context menu
- **System action:** Confirmation dialog: "Delete [node title]? This removes all steps, APIs, and acceptance criteria." On confirm: removes node from state, removes connections referencing it, increments saveVersion.
- **Success state:** Node disappears from canvas with exit animation. Connected lines disappear.
- **Error states:** None — local operation.

#### STEP 3: DUPLICATE

- **User action:** Clicks "Duplicate"
- **System action:** Creates new node with same type, description, steps, APIs, acceptance — new ID, title appended with "(copy)", positioned slightly offset from original.
- **Success state:** New node appears next to original.

---

### Workflow 5: Guided Empty States (NEW — missing from v1)

**Workflow Name:** Contextual Guidance
**Purpose:** Every empty state in the UI must tell the user what to do and offer to let AI do it.
**Why it matters:** Empty states are where users abandon tools.

**Empty States Required:**

1. **Empty Canvas (new project):** Panel opens with AI chat + starter message (see Workflow 1). Canvas shows subtle centered text: "Your features will appear here as you describe them to Canvas AI →"
2. **Steps Tab (no steps):** "No workflow steps yet. Describe your feature in the chat and I'll generate them, or add steps manually below." + "Ask AI to Generate" button + "+ Add Step Manually" button.
3. **APIs Tab (no APIs):** "No API endpoints defined yet. I'll generate these from your workflow steps when you're ready." + "Ask AI to Generate" button + "+ Add Endpoint Manually" button.
4. **Acceptance Tab (no criteria):** "No acceptance criteria yet. I can generate standard criteria plus feature-specific ones from your spec." + "Ask AI to Generate" button + "+ Load Defaults" button + "+ Add Custom" button.
5. **Export Tab (spec incomplete):** Instead of an empty/partial brief, show a checklist of what's missing: "To generate a complete Claude Code brief, you still need: ✗ At least 2 workflow steps, ✗ At least 1 API endpoint, ✓ Description defined." With a button: "Ask AI to fill gaps."

---

## Part 4: AI Structured Output Protocol (NEW)

### 4.1 The Problem

In v1, the AI chat returns plain text. The user reads it, then has to manually transfer insights into the form fields. This is the core UX failure.

### 4.2 The Solution

The AI returns two things in every response:

1. **Prose message** — what the user sees in chat (conversational, guiding)
2. **Structured mutations** — JSON that the frontend applies to the node automatically

### 4.3 Updated System Prompt Addition

Add to the end of the existing system prompt:

```
=== STRUCTURED OUTPUT PROTOCOL ===

When your response involves creating or updating spec content, include a JSON block wrapped in <canvas_mutations> tags at the END of your response. The frontend will parse this and apply the changes automatically. The user will see the prose portion of your response in the chat.

MUTATION TYPES:

1. Create a node:
<canvas_mutations>
{"action": "create_node", "node": {"title": "...", "description": "...", "node_type": "screen|action|logic|ai"}}
</canvas_mutations>

2. Update node fields:
<canvas_mutations>
{"action": "update_node", "updates": {"title": "...", "description": "...", "priority": 0, "notes": "..."}}
</canvas_mutations>

3. Set workflow steps (replaces all steps):
<canvas_mutations>
{"action": "set_steps", "steps": [{"title": "...", "user_action": "...", "system_action": "...", "success_state": "...", "error_states": "...", "api_called": "..."}]}
</canvas_mutations>

4. Set API endpoints (replaces all APIs):
<canvas_mutations>
{"action": "set_apis", "apis": [{"method": "POST", "endpoint": "/api/...", "purpose": "...", "request_shape": "...", "response_shape": "..."}]}
</canvas_mutations>

5. Set acceptance criteria (replaces all):
<canvas_mutations>
{"action": "set_acceptance", "acceptance": [{"text": "...", "done": false}]}
</canvas_mutations>

6. Classify feature:
<canvas_mutations>
{"action": "classify", "classification": "POP|POB|UI|pipeline|mixed", "reasoning": "..."}
</canvas_mutations>

RULES:
- Include mutations ONLY when you are generating or updating spec content.
- Normal conversational responses (questions, explanations, clarifications) should NOT include mutations.
- You can include multiple mutation blocks in one response (e.g., create node + set steps + classify).
- Always tell the user in prose what you just generated: "I've added 4 workflow steps and classified this as a POP feature."
- If the user says "looks good" or "move on", advance to the next phase and generate the next set of content.
```

### 4.4 Frontend Parsing

The chat API route strips `<canvas_mutations>` blocks from the prose before returning. Returns:

```json
{
  "message": "prose text without mutation blocks",
  "mutations": [
    {"action": "set_steps", "steps": [...]},
    {"action": "classify", "classification": "POP", "reasoning": "..."}
  ]
}
```

The frontend applies mutations to the selected node immediately, triggering auto-save.

---

## Part 5: Updated API Specification

### POST /api/canvas/ai/chat (MODIFIED)

**Change:** Parse `<canvas_mutations>` blocks from AI response. Return separately.

**Request:** Same as v1.

**Response (updated):**

```json
{
  "message": "Prose response visible in chat (mutations stripped)",
  "mutations": [
    {"action": "create_node", "node": {"title": "...", "description": "...", "node_type": "screen"}},
    {"action": "set_steps", "steps": [...]},
    {"action": "classify", "classification": "POP", "reasoning": "..."}
  ]
}
```

**Server-side logic:**

1. Get AI response text
2. Regex extract all `<canvas_mutations>...</canvas_mutations>` blocks
3. Parse each as JSON, collect into mutations array
4. Strip mutation blocks from prose
5. Return `{ message, mutations }`

---

## Part 6: Updated Detail Panel Architecture

### Layout (Revised)

```
┌─────────────────────────────────────┐
│ HEADER: icon, title, fidelity, type │
│ [Delete] [Classify badge] [Close]   │
├─────────────────────────────────────┤
│                                     │
│         AI CHAT (PRIMARY)           │
│   Messages + input + quick prompts  │
│                                     │
│   ┌───────────────────────────────┐ │
│   │ "Review Spec" toggle bar      │ │
│   └───────────────────────────────┘ │
│                                     │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ (When "Review Spec" expanded:)      │
│ [Overview] [Steps] [APIs] [Accept]  │
│ [Export]                            │
│                                     │
│ Tab content (scrollable)            │
│                                     │
└─────────────────────────────────────┘
```

**Key change:** AI chat is ALWAYS visible at the top. The tabs are collapsed by default behind a "Review Spec" toggle. This inverts the v1 hierarchy where tabs were primary and AI was a toggle.

### Classification Badge

- After AI classifies a feature, a badge appears in the header: "POP" (blue), "POB" (purple), "UI" (green), "Pipeline" (yellow), "Mixed ⚠️" (red)
- Mixed shows a warning icon and the AI's recommendation to split

### Quick Prompts (Context-Sensitive)

Change based on current fidelity and what's populated:

- **Concept + no steps:** "Describe this feature", "What problem does this solve?"
- **Concept + has description:** "Generate workflow steps", "Classify this feature"
- **Wireframe + has steps:** "Generate API endpoints", "Review my workflow steps"
- **Mockup + has APIs:** "Generate acceptance criteria", "Review full spec"
- **Build Ready:** "Final review", "Generate Claude Code brief", "What's missing?"

---

## Part 7: Verification Protocol

```
CANVAS v2 AI-FIRST VERIFICATION
================================
Date:
Tester: Tommy (Chairman)
Environment: Production

ONBOARDING FLOW
[ ] PASS/FAIL - New project opens with AI chat active and template-specific starter message
[ ] PASS/FAIL - User types idea → AI creates node on canvas automatically
[ ] PASS/FAIL - AI classifies feature (POP/POB/UI/pipeline) and shows badge
[ ] PASS/FAIL - AI flags mixed workflows and recommends splitting

AI-DRIVEN SPEC BUILDING
[ ] PASS/FAIL - AI generates workflow steps from conversation → Steps tab populates
[ ] PASS/FAIL - AI generates API endpoints → APIs tab populates
[ ] PASS/FAIL - AI generates acceptance criteria → Acceptance tab populates
[ ] PASS/FAIL - AI identifies dependencies between nodes
[ ] PASS/FAIL - All AI-generated content is editable in the tab forms

FIDELITY AUTO-ADVANCEMENT
[ ] PASS/FAIL - Fidelity auto-advances Concept → Wireframe when 2+ steps exist
[ ] PASS/FAIL - Fidelity auto-advances Wireframe → Mockup when 1+ API exists
[ ] PASS/FAIL - Fidelity auto-advances Mockup → Build Ready when 5+ acceptance criteria exist
[ ] PASS/FAIL - Manual fidelity override still works

NODE MANAGEMENT
[ ] PASS/FAIL - Right-click or hover menu appears on nodes
[ ] PASS/FAIL - Delete node works with confirmation
[ ] PASS/FAIL - Duplicate node works

EMPTY STATES
[ ] PASS/FAIL - Empty canvas shows guidance text pointing to AI chat
[ ] PASS/FAIL - Empty Steps tab shows "Ask AI to Generate" button
[ ] PASS/FAIL - Empty APIs tab shows "Ask AI to Generate" button
[ ] PASS/FAIL - Empty Acceptance tab shows "Ask AI to Generate" + "Load Defaults" buttons
[ ] PASS/FAIL - Incomplete Export tab shows checklist of missing items

QUICK PROMPTS
[ ] PASS/FAIL - Quick prompts change based on fidelity level and populated content
[ ] PASS/FAIL - Clicking quick prompt sends it to AI chat

PERSISTENCE
[ ] PASS/FAIL - AI-generated content saves to Supabase via auto-save
[ ] PASS/FAIL - Reload page → all AI-generated content persists

Evidence links / screenshots:
Notes:
```
