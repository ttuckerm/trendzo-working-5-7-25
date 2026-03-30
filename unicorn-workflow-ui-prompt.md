# 🦄 UNICORN WORKFLOW UI RENDERING PROMPT
*Using BMAD Methodology for Comprehensive UI Design*

## 📋 **BREAKDOWN - Core Requirements**

**CONTEXT:** You are designing a revolutionary AI-powered viral content creation tool that transforms complex video analysis into magical user experiences. The tool demonstrates 90%+ predictive accuracy for viral content success.

**MISSION:** Create a single-page React/Next.js interface that showcases the "Progressive Magic" workflow - where users go from "I don't understand viral content" to "Holy shit, I can predict what will go viral!"

**KEY USER EMOTION:** The moment when complex viral science becomes simple magic.

## 🔧 **METHODICAL - Structured Design Approach**

### **PHASE 1: Magic Entry Point (10 seconds)**
Create a hero section with:
- **Central CTA Button**: Large, gradient button reading "🎬 Find My Viral Pattern" 
- **Promise Badge**: "90% Accuracy • 60 Second Results"
- **Background**: Dark Netflix-style with subtle DNA helix animations
- **Confidence Indicators**: "Analyzed 10,000+ viral videos" subtitle

### **PHASE 2: AI Magic Sequence (20 seconds)**
Design animated sequence showing:
- **Step 1**: Loading animation with "Scanning viral database..."
- **Step 2**: DNA helix visualization appearing with "Pattern found!"
- **Step 3**: Niche adaptation animation with "Personalizing for [Fitness]..."
- **Step 4**: Viral score counter animating to "89% Viral Score"

### **PHASE 3: Progressive Choice Point (Selection)**
Create three distinct option cards:
- **EXPRESS**: "⚡ 30 Second Creation" (Highlighted as recommended)
- **GUIDED**: "🎓 Learn While Creating" (3-5 minutes)
- **EXPERT**: "🔬 Full Power Mode" (All features)

### **PHASE 4: Creation Interface (Mode-dependent)**
Design tabbed interface showing all three modes with:
- **Express**: Auto-filling form fields with AI suggestions
- **Guided**: Step-by-step wizard with tooltips
- **Expert**: Full 3-phase workflow (condensed view)

## 🏗️ **ARCHITECTURAL - Technical Implementation**

### **Component Structure:**
```jsx
<ViralLabUnicorn>
  <MagicEntryHero />
  <AISequenceAnimation />
  <ProgressiveModeSelector />
  <CreationInterface mode={selectedMode} />
  <LivePredictionPanel />
</ViralLabUnicorn>
```

### **Animation Requirements:**
- **DNA Helix**: CSS keyframes rotating double helix with gradient colors
- **Counter Animation**: Number incrementing from 0 to 89 over 2 seconds
- **Loading States**: Smooth transitions between analysis phases
- **Mode Transitions**: Slide/fade effects between interface modes

### **State Management:**
```javascript
const [currentPhase, setCurrentPhase] = useState('entry')
const [selectedMode, setSelectedMode] = useState(null)
const [viralScore, setViralScore] = useState(0)
const [aiAnalysis, setAiAnalysis] = useState(null)
```

### **Design System:**
- **Colors**: Dark background (#0a0a0a), Purple accents (#8b5cf6), Green success (#22c55e)
- **Typography**: Modern sans-serif, gradient text for key CTAs
- **Spacing**: 24px grid system, generous whitespace
- **Animations**: 300ms ease-in-out, 2s for major transitions

## 🎯 **DELIVERABLE - Specific UI Elements**

### **1. Magic Entry Section**
```html
<section className="hero-magic-entry">
  <div className="dna-background-animation"></div>
  <h1>Turn Any Video Into Your Viral Blueprint</h1>
  <p>AI-powered viral pattern detection with 90% accuracy</p>
  <button className="magic-cta-button">
    🎬 Find My Viral Pattern
    <span className="promise-badge">90% Accuracy • 60s Results</span>
  </button>
  <div className="confidence-indicators">
    Analyzed 10,000+ viral videos across 20+ niches
  </div>
</section>
```

### **2. AI Analysis Animation**
```html
<section className="ai-analysis-sequence">
  <div className="analysis-step" data-step="1">
    <div className="loading-spinner"></div>
    <p>Scanning viral database...</p>
  </div>
  <div className="dna-visualization">
    <div className="dna-helix rotating"></div>
    <p>🧬 Viral pattern detected!</p>
  </div>
  <div className="score-revelation">
    <div className="score-counter">89</div>
    <p>% Viral Score for your content</p>
  </div>
</section>
```

### **3. Progressive Mode Selector**
```html
<section className="mode-selector">
  <div className="mode-card express recommended">
    <div className="mode-icon">⚡</div>
    <h3>Express Mode</h3>
    <p>AI creates everything</p>
    <span className="time-badge">30 seconds</span>
  </div>
  <div className="mode-card guided">
    <div className="mode-icon">🎓</div>
    <h3>Guided Mode</h3>
    <p>Learn while creating</p>
    <span className="time-badge">3-5 minutes</span>
  </div>
  <div className="mode-card expert">
    <div className="mode-icon">🔬</div>
    <h3>Expert Mode</h3>
    <p>Full control</p>
    <span className="time-badge">Full workflow</span>
  </div>
</section>
```

### **4. Live Prediction Panel**
```html
<aside className="prediction-panel">
  <div className="viral-score-circle">
    <svg className="score-progress-ring">
      <circle className="progress-ring-circle"></circle>
    </svg>
    <div className="score-text">89</div>
  </div>
  <div className="prediction-metrics">
    <div className="metric">
      <span className="value">2.1M</span>
      <span className="label">Est. Views</span>
    </div>
    <div className="metric">
      <span className="value">12.3%</span>
      <span className="label">Est. Engagement</span>
    </div>
  </div>
  <div className="ai-insights">
    <p>✓ Strong hook pattern detected</p>
    <p>⚡ Optimal posting time: 7:00 PM today</p>
  </div>
</aside>
```

### **5. Creation Interface (Express Mode Example)**
```html
<section className="creation-interface express-mode">
  <div className="auto-fill-demo">
    <div className="form-field filling">
      <label>Hook (First 3 seconds)</label>
      <input type="text" value="I helped 1000+ people lose weight with this simple method..." readonly>
      <div className="ai-badge">✨ AI Generated</div>
    </div>
    <div className="form-field filling" style="animation-delay: 0.5s">
      <label>Authority Statement</label>
      <textarea readonly>As a certified trainer with 10 years experience...</textarea>
      <div className="ai-badge">✨ AI Generated</div>
    </div>
  </div>
  <div className="publish-ready">
    <button className="publish-btn gradient">
      🚀 Publish Now (89% Viral Score)
    </button>
  </div>
</section>
```

## 🎨 **VISUAL DESIGN SPECIFICATIONS**

### **Color Palette:**
- **Primary**: `#8b5cf6` (Purple) - Magic/AI theme
- **Secondary**: `#22c55e` (Green) - Success/confidence
- **Accent**: `#ff3b30` (Red) - Urgency/viral energy
- **Background**: `#0a0a0a` (Deep black) - Netflix premium feel
- **Cards**: `rgba(255,255,255,0.04)` - Subtle glass morphism

### **Typography:**
```css
--font-heading: 'Inter', -apple-system, sans-serif;
--font-body: 'Inter', -apple-system, sans-serif;
--font-size-hero: clamp(2.5rem, 5vw, 4rem);
--font-size-h2: clamp(1.5rem, 3vw, 2.5rem);
--font-weight-bold: 700;
```

### **Animation Timings:**
```css
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-sequence: 2000ms;
--easing: cubic-bezier(0.4, 0, 0.2, 1);
```

### **Key CSS Classes:**
```css
.magic-cta-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #22c55e 100%);
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
  transition: transform 300ms ease;
}

.dna-helix {
  animation: rotate 4s linear infinite;
  background: conic-gradient(#8b5cf6, #22c55e, #8b5cf6);
}

.score-counter {
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #22c55e 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## 🔥 **SUCCESS CRITERIA**

**The rendered UI should:**
1. ✅ **Immediate Impact**: Hero section makes viral prediction promise clear
2. ✅ **Magic Feeling**: AI sequence feels like watching magic happen
3. ✅ **Clear Progression**: Three modes show complexity options without overwhelm
4. ✅ **Confidence Building**: Live predictions and accuracy metrics visible throughout
5. ✅ **Professional Polish**: Netflix-quality dark theme with smooth animations

**User should think:**
*"Holy shit, this AI can actually predict viral content and it's making it easy for me!"*

## 🚀 **RENDERING INSTRUCTIONS**

**Create a fully functional React component that:**
- Renders all phases in sequence with smooth transitions
- Includes working animations and state management
- Shows realistic data and predictions
- Demonstrates the Express Mode auto-fill experience
- Maintains responsive design for desktop/mobile
- Uses modern CSS with glassmorphism and gradients

**Focus on the emotional journey from confusion to confidence, making complex AI feel like simple magic.** 