# Trendzo Viral Prediction Platform - Master Implementation Prompt

## System Overview
Build a two-tier viral prediction platform consisting of:
1. **Superadmin Control Center** - Complete system control with inception marketing tools
2. **Limited User Frontend** - Controlled access for viral video analysis and optimization

The platform analyzes TikTok videos using 11 integrated modules to predict virality with 90%+ accuracy, generates viral templates, and includes inception marketing capabilities for self-promotion.

## Technical Architecture

### Core Infrastructure
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Existing Supabase infrastructure
- **APIs**: RESTful endpoints for all operations
- **Real-time**: WebSocket connections for live data
- **Authentication**: Existing auth system with role-based access

### Database Schema Extensions
```sql
-- Limited User Management
CREATE TABLE limited_users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tiktok_username TEXT,
    access_granted_at TIMESTAMP,
    access_expires_at TIMESTAMP,
    daily_analysis_limit INTEGER DEFAULT 3,
    features_enabled JSONB,
    referral_source TEXT, -- which marketing video
    created_at TIMESTAMP DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES limited_users(id),
    action_type TEXT, -- 'video_analyzed', 'template_used', etc
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Testimonial Collection
CREATE TABLE success_stories (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES limited_users(id),
    before_metrics JSONB,
    after_metrics JSONB,
    testimonial_text TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inception Marketing Tracking
CREATE TABLE marketing_campaigns (
    id UUID PRIMARY KEY,
    video_title TEXT,
    platform TEXT,
    viral_prediction DECIMAL,
    actual_views INTEGER,
    comments_received INTEGER,
    conversions INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Module Integration Map

### 11 Core Modules (Already Built)
1. **ApifyScraper** - Data ingestion
2. **FeatureDecomposer** - Content analysis
3. **ViralFilter (DPS)** - Top performer identification
4. **TemplateGenerator** - Pattern synthesis
5. **EvolutionEngine** - Template lifecycle tracking
6. **DNA_Detective** - Pattern matching
7. **Orchestrator** - Model selection
8. **AdvisorService** - Optimization recommendations
9. **RecipeBookAPI** - Template serving
10. **FeedbackIngest** - Performance validation
11. **InceptionStudio** - Marketing generation

### New Control Layer
```typescript
interface SystemControl {
    modules: {
        [moduleName: string]: {
            status: 'running' | 'idle' | 'error';
            throughput: number;
            lastRun: Date;
            config: ModuleConfig;
        }
    };
    
    limitedUserControls: {
        featureFlags: {
            videoAnalysis: boolean;
            templateAccess: boolean;
            optimizationSuggestions: boolean;
            maxDailyAnalyses: number;
        };
        accessControl: {
            grantAccess: (email: string, source: string) => Promise<void>;
            revokeAccess: (userId: string) => Promise<void>;
            setLimits: (userId: string, limits: UserLimits) => Promise<void>;
        };
    };
}
```

## Superadmin Interface Structure

### 1. Mission Control Dashboard
- **Real-time module status** with throughput metrics
- **Pipeline flow visualization**
- **Template intelligence panel** (HOT/COOLING/NEW/DYING)
- **System alerts and insights**

### 2. Prediction Validation Center
- **Accuracy tracking** with 48-hour validation
- **Prediction vs. actual performance**
- **Confidence distribution**
- **Niche-specific accuracy breakdown**

### 3. Analysis & Template Preview
- **Deep video analysis** with all metrics
- **Template structure visualization**
- **Performance curve predictions**
- **One-click optimization controls**

### 4. Inception Marketing Studio
- **Magic buttons**: Copy Viral Winner, Optimize for Viral, Perfect for Platform
- **Script generation** with viral probability
- **Campaign tracking** (views → comments → conversions)
- **ROI calculator**

### 5. Limited User Management
```typescript
interface LimitedUserManager {
    dashboard: {
        totalUsers: number;
        activeToday: number;
        conversionRate: number;
        topPerformers: User[];
    };
    
    controls: {
        bulkGrantAccess: (emails: string[]) => Promise<void>;
        setFeatureAccess: (features: FeatureSet) => Promise<void>;
        extractTestimonials: () => Promise<Testimonial[]>;
        monitorUsage: () => UsageStats;
    };
}
```

## Limited User Frontend

### Core Features
1. **Simplified Dashboard**
   - Today's #1 viral template
   - Quick analysis button
   - Success score display

2. **Video Analyzer**
   - Drag & drop interface
   - Instant viral probability score
   - Top 3 optimization suggestions
   - Template matching

3. **Limited Recipe Book**
   - Access to top 5 HOT templates only
   - Basic template previews
   - Success rate display

### Access Control
```typescript
interface LimitedAccess {
    features: {
        dailyAnalysisLimit: 3;
        templateAccess: 'top5' | 'all';
        optimizationDepth: 'basic' | 'full';
        exportEnabled: false;
    };
    
    tracking: {
        logUsage: (action: UserAction) => Promise<void>;
        checkLimits: () => Promise<boolean>;
        recordSuccess: (metrics: SuccessMetrics) => Promise<void>;
    };
}
```

## API Endpoints

### Superadmin APIs
```
POST   /api/admin/modules/control        - Start/stop modules
GET    /api/admin/pipeline/status        - Real-time pipeline status
GET    /api/admin/predictions/accuracy   - Accuracy metrics
POST   /api/admin/inception/generate     - Generate marketing content
GET    /api/admin/users/limited          - Limited user management
POST   /api/admin/users/grant-access     - Grant limited access
```

### Limited User APIs
```
POST   /api/analyze                      - Analyze video (rate limited)
GET    /api/templates/top                - Get top 5 templates
GET    /api/user/stats                   - User's success metrics
POST   /api/user/feedback                - Submit success story
```

## Security & Performance

### Rate Limiting
```typescript
const rateLimits = {
    limitedUser: {
        videoAnalysis: '3/day',
        templateViews: '50/day',
        apiCalls: '100/hour'
    },
    superadmin: {
        unlimited: true
    }
};
```

### Performance Targets
- Video analysis: <5 seconds
- Dashboard load: <2 seconds
- Real-time updates: <500ms latency
- Concurrent users: 1000+ limited users

## Implementation Priorities

### Phase 1: Core Superadmin (Week 1)
1. Mission Control Dashboard
2. Module status integration
3. Real-time pipeline visualization
4. Basic inception studio

### Phase 2: Limited User System (Week 1-2)
1. Access control system
2. Limited dashboard
3. Video analyzer with limits
4. Usage tracking

### Phase 3: Integration (Week 2)
1. Superadmin → Limited user controls
2. Comment → Access automation
3. Success tracking
4. Testimonial extraction

### Phase 4: Optimization (Week 2+)
1. Performance tuning
2. UI/UX refinement
3. A/B testing setup
4. Analytics dashboard

## Success Criteria
- Superadmin can control all modules from unified interface
- Limited users can analyze 3 videos/day successfully
- Inception marketing generates 90%+ viral probability content
- System tracks user journey from video → signup → success
- All 11 modules integrate seamlessly
- Real-time data flows without delays
- 90%+ prediction accuracy maintained

## Development Guidelines
1. Use existing Supabase tables where possible
2. Maintain consistent UI with current Trendzo brand
3. All features must work with real data (no mocks)
4. Include error handling and fallbacks
5. Log everything for testimonial extraction
6. Make limited features feel premium, not restricted

## Testing Requirements
1. End-to-end flow: Marketing video → Comment → Access → Analysis → Success
2. Load testing with 100+ concurrent limited users
3. Accuracy validation over 48-hour periods
4. Cross-browser compatibility
5. Mobile responsiveness for limited users