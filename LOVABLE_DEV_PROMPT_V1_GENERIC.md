# Lovable.dev Build Prompt - Social Media Content Analysis Platform

## Project Overview

Build a **Social Media Content Analysis Platform** that helps creators predict and optimize their content performance. The system analyzes video scripts/transcripts and provides a **Performance Score (0-100)** along with actionable recommendations.

---

## Core Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts
- **Animations**: Framer Motion

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-4 for content analysis

---

## System Architecture (Simplified)

```
USER INPUT (Script/Transcript)
    ↓
CONTENT ANALYSIS (Backend API)
    ↓
AI PROCESSING (GPT-4)
    ↓
PERFORMANCE SCORE + RECOMMENDATIONS
    ↓
VISUAL DASHBOARD (Frontend)
```

---

## Database Schema (Supabase)

### Main Tables

#### 1. `content_items`
```sql
- id (UUID, PRIMARY KEY)
- title (TEXT)
- content_text (TEXT) -- Script/transcript
- performance_score (FLOAT) -- 0-100
- views (BIGINT)
- engagement_rate (FLOAT)
- category (TEXT)
- created_at (TIMESTAMPTZ)
- user_id (UUID) -- For multi-user support
```

#### 2. `analysis_results`
```sql
- id (UUID, PRIMARY KEY)
- content_id (UUID, FOREIGN KEY)
- performance_score (FLOAT)
- confidence (FLOAT)
- recommendations (JSONB) -- Array of suggestions
- strengths (JSONB) -- What's working well
- weaknesses (JSONB) -- Areas to improve
- created_at (TIMESTAMPTZ)
```

---

## Key API Endpoints to Build

### 1. **POST /api/analyze**
Main analysis endpoint - analyzes content and returns performance prediction

**Request:**
```typescript
{
  content: string;              // Script or transcript text
  title?: string;
  category?: string;            // e.g., "entertainment", "education"
  analysis_depth?: "quick" | "standard" | "deep";
}
```

**Response:**
```typescript
{
  success: true,
  analysis: {
    performance_score: 78.5,    // 0-100
    confidence: 0.82,           // 0-1
    strengths: [
      "Strong opening hook",
      "Clear value proposition",
      "Engaging storytelling"
    ],
    weaknesses: [
      "Middle section loses momentum",
      "Call-to-action could be stronger"
    ],
    recommendations: [
      "Add a surprising element at the 15-second mark",
      "Shorten the introduction by 20%",
      "End with a more compelling hook for rewatches"
    ],
    key_metrics: {
      estimated_engagement: "high",
      hook_strength: 8.5,
      retention_prediction: 75
    }
  },
  metadata: {
    processing_time_ms: 3200,
    analysis_type: "standard",
    timestamp: "2025-11-06T..."
  }
}
```

### 2. **GET /api/analyze/history**
Get user's previous analyses

**Response:**
```typescript
{
  success: true,
  analyses: [
    {
      id: "uuid",
      title: "My Video Script",
      performance_score: 78.5,
      created_at: "2025-11-06T...",
      category: "entertainment"
    }
  ],
  pagination: {
    page: 1,
    total_pages: 5,
    total_count: 48
  }
}
```

---

## User Interface to Build

### 1. **Dashboard Page** (`/`)

**Layout:**
- Hero section with "Analyze New Content" CTA
- Recent analyses (cards with score + title)
- Performance trends chart
- Quick stats (total analyses, avg score, improvement over time)

**Components Needed:**
- `RecentAnalysesGrid` - Cards displaying recent items
- `PerformanceTrendsChart` - Line chart showing score over time
- `QuickStatsBar` - Key metrics in card format

### 2. **Analysis Studio** (`/studio`)

**Main Features:**

**Input Section:**
- Large text area for script/transcript (auto-expanding)
- Title input field
- Category selector (dropdown)
- Character/word counter (live updates)
- Analysis depth selector:
  - Quick (~5s, basic insights)
  - Standard (~10s, detailed analysis)
  - Deep (~20s, comprehensive report)
- "Analyze Content" button (primary CTA)

**Results Section (after analysis):**

1. **Performance Score Display**
   - Large circular gauge (0-100) with color zones:
     - 0-40: Red (Needs work)
     - 40-60: Orange (Fair)
     - 60-75: Yellow (Good)
     - 75-85: Light green (Very good)
     - 85-100: Dark green (Excellent)
   - Animated number counter
   - Confidence indicator below gauge

2. **Strengths Section**
   - Green cards with checkmark icons
   - List of what's working well
   - Expandable details for each strength

3. **Weaknesses Section**
   - Orange/red cards with warning icons
   - Areas that need improvement
   - Severity indicators (minor, moderate, critical)

4. **Recommendations Panel**
   - Blue cards with lightbulb icons
   - 3-5 actionable suggestions
   - Priority ranking (high, medium, low)
   - "Copy" button for each recommendation

5. **Key Metrics Grid**
   - Cards showing:
     - Hook strength (0-10)
     - Estimated engagement (low/medium/high)
     - Retention prediction (%)
     - Emotional impact score

6. **Action Buttons**
   - "Save Analysis" (stores to database)
   - "Export as PDF"
   - "Start New Analysis"
   - "Compare with Previous"

### 3. **Content Library** (`/library`)

**Features:**
- Search bar (filter by title, category)
- Filter dropdowns:
  - Score range (slider)
  - Date range
  - Category
  - Sort by (score, date, title)
- Table view with columns:
  - Title
  - Performance Score (with color badge)
  - Category
  - Analysis Date
  - Actions (View, Delete)
- Pagination controls
- Bulk actions (delete multiple)

### 4. **Comparison View** (`/compare`)

**Features:**
- Select 2-4 analyses to compare side-by-side
- Visual comparison:
  - Score gauges in a row
  - Strengths/weaknesses in columns
  - Radar chart comparing key metrics
  - Difference highlights (what changed between versions)

---

## UI/UX Design Guidelines

### Visual Design

**Color Palette:**
```
Primary:   #3b82f6 (Blue)
Success:   #10b981 (Green)
Warning:   #f59e0b (Orange)
Danger:    #ef4444 (Red)
Neutral:   #6b7280 (Gray)
Background: #f9fafb (Light gray)
```

**Typography:**
- Headings: Inter (font-weight: 600-700)
- Body: Inter (font-weight: 400-500)
- Monospace: JetBrains Mono (for metrics)

**Spacing:**
- Use Tailwind's default spacing scale
- Cards: p-6, rounded-lg, shadow-sm
- Sections: space-y-6
- Grid gaps: gap-4 or gap-6

### Component Specifications

#### 1. **Performance Score Gauge**
```typescript
<div className="relative w-48 h-48">
  {/* Circular SVG gauge */}
  <svg viewBox="0 0 100 100">
    {/* Background arc */}
    <path d="..." fill="none" stroke="#e5e7eb" strokeWidth="8" />
    {/* Score arc (colored based on score) */}
    <path d="..." fill="none" stroke={getScoreColor(score)} strokeWidth="8" />
  </svg>

  {/* Center text */}
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <span className="text-4xl font-bold">{score}</span>
    <span className="text-sm text-gray-500">Performance Score</span>
  </div>
</div>
```

#### 2. **Recommendation Card**
```typescript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <LightbulbIcon className="w-5 h-5 text-blue-600 mt-1" />
    <div className="flex-1">
      <h4 className="font-semibold text-blue-900 mb-1">
        Recommendation Title
      </h4>
      <p className="text-sm text-blue-800">
        Detailed recommendation text here...
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-2 py-1 bg-blue-200 rounded">
          High Priority
        </span>
        <button className="text-xs text-blue-600 hover:underline">
          Copy
        </button>
      </div>
    </div>
  </div>
</div>
```

#### 3. **Strength/Weakness Item**
```typescript
{/* Strength */}
<div className="bg-green-50 border border-green-200 rounded-lg p-3">
  <div className="flex items-center gap-2">
    <CheckCircleIcon className="w-5 h-5 text-green-600" />
    <span className="text-green-900 font-medium">Strength description</span>
  </div>
</div>

{/* Weakness */}
<div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
  <div className="flex items-center gap-2">
    <AlertCircleIcon className="w-5 h-5 text-orange-600" />
    <span className="text-orange-900 font-medium">Weakness description</span>
  </div>
</div>
```

### Interactions & Animations

**Loading States:**
```typescript
// Analysis in progress
<div className="flex flex-col items-center gap-4 py-12">
  <Loader2Icon className="w-12 h-12 animate-spin text-blue-600" />
  <p className="text-gray-600">Analyzing your content...</p>
  <Progress value={progress} className="w-64" />
</div>
```

**Empty States:**
```typescript
// No analyses yet
<div className="text-center py-12">
  <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
  <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
  <p className="text-gray-600 mb-4">
    Start by analyzing your first piece of content
  </p>
  <Button onClick={goToStudio}>Get Started</Button>
</div>
```

**Success Toast:**
```typescript
// After successful analysis
toast.success("Analysis complete! Your performance score: 78.5", {
  duration: 4000,
});
```

### Mobile Responsiveness

**Breakpoints:**
- Mobile: < 640px (stack everything vertically)
- Tablet: 640px - 1024px (2-column grids)
- Desktop: > 1024px (full layout)

**Mobile Optimizations:**
- Collapse filters into drawer/modal
- Stack gauge and metrics vertically
- Single column for recommendations
- Swipeable cards for recent analyses
- Bottom sheet for comparison view

---

## Key User Flows

### Flow 1: New User First Analysis

1. User lands on homepage
2. Clicks "Analyze New Content" CTA
3. Redirected to `/studio`
4. Pastes script into text area (500+ words)
5. Enters title: "My First Video"
6. Selects "Standard" analysis depth
7. Clicks "Analyze Content"
8. Loading spinner appears (10 seconds)
9. Results slide in with animation:
   - Gauge animates from 0 → 78.5
   - Strengths appear one by one (stagger)
   - Weaknesses fade in
   - Recommendations slide in from bottom
10. User clicks "Save Analysis"
11. Success toast appears
12. "View in Library" button appears

### Flow 2: Compare Two Scripts

1. User in `/library`
2. Selects 2 analyses (checkboxes)
3. Clicks "Compare Selected"
4. Redirected to `/compare?ids=uuid1,uuid2`
5. Side-by-side view loads:
   - Both gauges shown in row
   - Strengths/weaknesses in columns
   - Radar chart comparing metrics
   - Highlighted differences
6. User sees Script A scored 65 vs Script B scored 82
7. User clicks "Use Script B" (copies to clipboard)

### Flow 3: Iterate on Content

1. User analyzes Script v1 → Score: 68
2. Reads recommendations:
   - "Strengthen opening hook"
   - "Add emotional trigger in middle"
   - "Clarify call-to-action"
3. User edits script based on feedback
4. Analyzes Script v2 → Score: 79 (+11 points)
5. System highlights: "Improvement detected! 🎉"
6. User saves both versions for reference

---

## Data Visualization Components

### 1. **Performance Trends Chart** (Dashboard)
```typescript
<LineChart data={analyses} height={300}>
  <XAxis
    dataKey="created_at"
    tickFormatter={(date) => format(date, 'MMM d')}
  />
  <YAxis domain={[0, 100]} label="Performance Score" />
  <Line
    dataKey="performance_score"
    stroke="#3b82f6"
    strokeWidth={2}
    dot={{ fill: '#3b82f6', r: 4 }}
  />
  <Tooltip content={<CustomTooltip />} />
</LineChart>
```

### 2. **Metrics Radar Chart** (Comparison)
```typescript
<RadarChart data={metricsComparison}>
  <PolarGrid />
  <PolarAngleAxis dataKey="metric" />
  <PolarRadiusAxis domain={[0, 10]} />
  <Radar
    name="Script A"
    dataKey="valueA"
    stroke="#3b82f6"
    fill="#3b82f6"
    fillOpacity={0.3}
  />
  <Radar
    name="Script B"
    dataKey="valueB"
    stroke="#10b981"
    fill="#10b981"
    fillOpacity={0.3}
  />
  <Legend />
</RadarChart>
```

### 3. **Score Distribution** (Library)
```typescript
<BarChart data={scoreDistribution}>
  <XAxis dataKey="range" label="Score Range" />
  <YAxis label="Count" />
  <Bar dataKey="count" fill="#3b82f6">
    {scoreDistribution.map((entry, index) => (
      <Cell key={index} fill={getScoreColor(entry.range)} />
    ))}
  </Bar>
</BarChart>
```

---

## Error Handling

### User-Friendly Error Messages

**1. Empty Content**
```typescript
if (content.length < 50) {
  return {
    error: "Content too short. Please provide at least 50 characters for analysis."
  };
}
```

**2. API Error**
```typescript
try {
  const result = await analyzeContent(content);
} catch (error) {
  toast.error("Analysis failed. Please try again in a moment.", {
    description: "If the problem persists, contact support."
  });
}
```

**3. Rate Limit**
```typescript
if (rateLimitExceeded) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Rate limit reached</AlertTitle>
      <AlertDescription>
        You've reached your analysis limit for this hour.
        Please try again in {minutesRemaining} minutes.
      </AlertDescription>
    </Alert>
  );
}
```

---

## Performance Requirements

### Speed
- Content analysis: < 15 seconds
- Page load: < 2 seconds
- Search/filter: < 500ms

### UX
- Instant feedback on input (character count updates)
- Optimistic UI updates (save before API confirms)
- Smooth animations (60fps)
- No layout shifts (reserve space for loading states)

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── studio/
│   │   └── page.tsx                # Analysis Studio
│   ├── library/
│   │   └── page.tsx                # Content Library
│   ├── compare/
│   │   └── page.tsx                # Comparison View
│   └── api/
│       ├── analyze/
│       │   └── route.ts            # Main analysis endpoint
│       └── history/
│           └── route.ts            # Get user's analyses
│
├── components/
│   ├── ui/                         # shadcn components
│   ├── analysis/
│   │   ├── PerformanceGauge.tsx
│   │   ├── StrengthCard.tsx
│   │   ├── WeaknessCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── MetricsGrid.tsx
│   ├── charts/
│   │   ├── TrendsChart.tsx
│   │   ├── RadarComparison.tsx
│   │   └── ScoreDistribution.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── api-client.ts               # API wrapper functions
│   └── utils.ts                    # Helper functions
│
└── types/
    ├── analysis.ts
    └── content.ts
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI (for content analysis)
OPENAI_API_KEY=sk-xxx

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=xxx
```

---

## TypeScript Interfaces

### Core Types
```typescript
// types/analysis.ts
export interface ContentAnalysis {
  id: string;
  content_id: string;
  performance_score: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  key_metrics: KeyMetrics;
  created_at: string;
}

export interface Recommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface KeyMetrics {
  hook_strength: number;
  estimated_engagement: 'low' | 'medium' | 'high';
  retention_prediction: number;
  emotional_impact: number;
}

export interface ContentItem {
  id: string;
  title: string;
  content_text: string;
  category: string;
  performance_score?: number;
  created_at: string;
  user_id: string;
}
```

---

## Implementation Checklist

### Phase 1: Core Functionality
- [ ] Set up Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up Supabase client
- [ ] Create database tables
- [ ] Build `/api/analyze` endpoint
- [ ] Integrate OpenAI GPT-4 for analysis
- [ ] Add error handling

### Phase 2: Studio UI
- [ ] Create Analysis Studio page
- [ ] Build input form (textarea, title, category)
- [ ] Add character/word counter
- [ ] Create loading states
- [ ] Build Performance Gauge component
- [ ] Create Strength/Weakness/Recommendation cards
- [ ] Add save functionality

### Phase 3: Dashboard & Library
- [ ] Build Dashboard with recent analyses
- [ ] Create trends chart
- [ ] Build Library page with search/filter
- [ ] Add pagination
- [ ] Implement delete functionality

### Phase 4: Advanced Features
- [ ] Build Comparison View
- [ ] Add radar chart for metric comparison
- [ ] Export to PDF functionality
- [ ] Add user authentication (optional)
- [ ] Mobile responsive design

### Phase 5: Polish
- [ ] Add animations (Framer Motion)
- [ ] Implement toast notifications
- [ ] Add empty states
- [ ] Optimize performance
- [ ] Test error scenarios
- [ ] Deploy to production

---

## Success Criteria

### User Experience
- ✅ User can analyze content in < 3 clicks
- ✅ Results are visually clear and actionable
- ✅ Mobile experience is smooth
- ✅ Loading states prevent confusion
- ✅ Error messages are helpful

### Technical
- ✅ API responds in < 15 seconds
- ✅ No console errors
- ✅ TypeScript strict mode enabled
- ✅ Lighthouse score > 90
- ✅ Works in Chrome, Firefox, Safari

---

## Design Inspiration

**Reference Apps (for UX patterns):**
- Grammarly (for inline suggestions)
- Hemingway Editor (for readability scoring)
- Jasper AI (for content generation UI)
- Notion (for clean, minimal interface)
- Linear (for smooth interactions)

**Key Design Principles:**
1. **Clarity over cleverness** - Make scores/recommendations obvious
2. **Actionable insights** - Every weakness should have a recommendation
3. **Visual hierarchy** - Most important info (score) is largest
4. **Progressive disclosure** - Show summary first, details on demand
5. **Fast feedback** - Instant validation, loading indicators

---

## Notes for Lovable.dev

**Focus Areas:**
1. **Clean, modern UI** - Use shadcn/ui components throughout
2. **Smooth animations** - Framer Motion for gauge, cards
3. **Responsive design** - Mobile-first approach
4. **Clear information hierarchy** - Score → Strengths → Weaknesses → Recommendations
5. **Intuitive navigation** - Sidebar with Dashboard, Studio, Library

**Start With:**
- Analysis Studio page (most important)
- Performance Gauge component
- Basic API integration (mock data is fine initially)

**Don't Worry About:**
- Complex backend logic (we'll handle that)
- Authentication (add later)
- Advanced filtering (start simple)

---

**Ready to build a beautiful, user-friendly content analysis platform!** 🚀
