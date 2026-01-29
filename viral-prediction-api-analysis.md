# Viral Prediction API Endpoints Analysis

## Summary of Findings

After analyzing the source code of all viral prediction API endpoints, here are the findings on which endpoints return real data vs mock data:

| Endpoint | Status | Data Type | Mock Data Signs | Real Data Elements |
|----------|--------|-----------|----------------|-------------------|
| `/api/admin/viral-prediction/pipeline-status` | **Mixed** | 50% Real, 50% Mock | • Fixed module metrics (never change)<br>• Perfect uptime (99.8%)<br>• Round numbers in metrics<br>• Hardcoded module health scores | • Queries `scraped_data` table<br>• Queries `apify_runs` table<br>• Uses real video count when available<br>• Dynamic timestamp updates |
| `/api/admin/viral-prediction/accuracy-validation` | **Mostly Mock** | 20% Real, 80% Mock | • Hardcoded accuracy rates (91.3%)<br>• Static platform breakdowns<br>• Fixed confidence levels<br>• Preset trend data (Jan 1-7, 2025) | • Attempts to query `predictions` table<br>• Calls MainPredictionEngine service<br>• Has fallback to real data structure |
| `/api/admin/viral-prediction/daily-recipe-book` | **Mostly Mock** | 10% Real, 90% Mock | • Static template data<br>• Fixed viral rates (0.45, 0.35, etc.)<br>• Hardcoded examples<br>• Static recommendation lists | • Caches results in database<br>• Queries recent video performance<br>• Updates dataPointsProcessed with real counts |
| `/api/admin/apify-scrapers/scheduler` | **Mixed** | 60% Real, 40% Mock | • Some simulated job triggers<br>• Mock job types in examples | • Queries `scraping_jobs` table<br>• Queries `scraping_results` table<br>• Real job statistics and success rates<br>• Actual ScrapingScheduler class integration |
| `/api/admin/script-intelligence/status` | **100% Mock** | 0% Real, 100% Mock | • All metrics are hardcoded<br>• Fixed processing times<br>• Static analysis results<br>• No database queries<br>• Perfect success rates | • None - completely simulated |
| `/api/admin/framework-evolution/run` | **Mixed** | 40% Real, 60% Mock | • Simulated evolution results<br>• Fixed growth calculations<br>• Mock pattern discovery numbers | • Stores results in database<br>• Queries `framework_evolution_cycles`<br>• Real processing time tracking<br>• Actual FrameworkEvolutionSystem class |

## Detailed Analysis

### 1. Pipeline Status Endpoint
**File**: `/src/app/api/admin/viral-prediction/pipeline-status/route.ts`

**Mock Data Indicators**:
- Module metrics are completely hardcoded with fixed values
- All 11 modules always show "active" status with perfect health scores
- Uptime is always "99.8%" (line 385)
- Processing rates use static multipliers (line 44)
- Health scores are predetermined (lines 181-353)

**Real Data Elements**:
- Queries `scraped_data` and `apify_runs` tables (lines 20-32)
- Uses actual video counts when available (line 31)
- Dynamic timestamps and processing times

### 2. Accuracy Validation Endpoint
**File**: `/src/app/api/admin/viral-prediction/accuracy-validation/route.ts`

**Mock Data Indicators**:
- Hardcoded "274/300 correct" proof of concept data (lines 76-80)
- Static platform accuracy rates (lines 218-223)
- Fixed confidence level breakdowns (lines 198-215)
- Preset trend data with specific dates (lines 235-243)

**Real Data Elements**:
- Calls MainPredictionEngine.verifyPredictionAccuracy() (line 25)
- Attempts to query predictions table with joins (lines 140-153)
- Has real validation logic structure

### 3. Daily Recipe Book Endpoint
**File**: `/src/app/api/admin/viral-prediction/daily-recipe-book/route.ts`

**Mock Data Indicators**:
- Completely static template data (lines 124-316)
- Fixed viral rates (0.45, 0.35, 0.30, etc.)
- Hardcoded examples and recommendations
- Static platform alignment scores

**Real Data Elements**:
- Caches results in `daily_recipe_books` table (lines 61-68)
- Queries recent video performance (lines 325-330)
- Updates dataPointsProcessed with real counts (line 334)

### 4. Apify Scrapers Scheduler Endpoint
**File**: `/src/app/api/admin/apify-scrapers/scheduler/route.ts`

**Mock Data Indicators**:
- Some job triggers are simulated
- Mock job types for demonstration

**Real Data Elements**:
- Queries `scraping_jobs` and `scraping_results` tables (lines 150-160)
- Calculates real statistics from database data (lines 163-175)
- Integrates with actual ScrapingScheduler class
- Real job success rate calculations

### 5. Script Intelligence Status Endpoint
**File**: `/src/app/api/admin/script-intelligence/status/route.ts`

**Mock Data Indicators**:
- **100% simulated data** - no database queries
- All metrics are hardcoded (lines 11-120)
- Fixed processing times and accuracy rates
- Static analysis results with preset timestamps
- No real integration with external services

### 6. Framework Evolution Run Endpoint
**File**: `/src/app/api/admin/framework-evolution/run/route.ts`

**Mock Data Indicators**:
- Evolution results are likely simulated
- Fixed growth rate calculations
- Mock pattern discovery numbers

**Real Data Elements**:
- Stores evolution cycles in database (lines 30-40)
- Queries `framework_evolution_cycles` table (lines 126-131)
- Real processing time tracking (lines 18, 27)
- Integrates with FrameworkEvolutionSystem class

## Recommendations

1. **Immediate Priority**: The Script Intelligence endpoint is 100% mock and should be flagged for development
2. **Medium Priority**: Daily Recipe Book and Accuracy Validation endpoints need real data integration
3. **Low Priority**: Pipeline Status and Framework Evolution have good real data foundations but need mock data replaced

## Testing Commands

To test these endpoints when the server is running:

```bash
# Test all endpoints
curl -s http://localhost:3000/api/admin/viral-prediction/pipeline-status
curl -s http://localhost:3000/api/admin/viral-prediction/accuracy-validation
curl -s http://localhost:3000/api/admin/viral-prediction/daily-recipe-book
curl -s http://localhost:3000/api/admin/apify-scrapers/scheduler
curl -s http://localhost:3000/api/admin/script-intelligence/status
curl -s http://localhost:3000/api/admin/framework-evolution/run -X POST -H "Content-Type: application/json" -d '{}'
```

## Key Telltale Signs of Mock Data Found

1. **Fixed Numbers**: Perfect percentages like 99.8%, 91.3%, 94.2%
2. **Round Numbers**: Exactly 300 predictions, 274 correct, etc.
3. **Static Dates**: Hardcoded date ranges (Jan 1-7, 2025)
4. **No Database Queries**: Endpoints with zero database interaction
5. **Perfect Success Rates**: Unrealistic 98%+ success rates
6. **Preset Examples**: Hardcoded example content and responses
7. **Static Health Scores**: All modules always showing "active" status