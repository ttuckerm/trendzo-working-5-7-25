# Phase 2: Chairman Workflow Mapping
## Chairman's Hub - Daily/Weekly Routines

**Date:** February 4, 2026
**Purpose:** Document the chairman's actual workflows to ensure the hub supports real usage patterns

---

## Executive Summary

The chairman does NOT want a traditional dashboard with charts and numbers. They want an **Intelligent Narration System** that:

1. Tells them what's happening in plain English
2. Alerts them to problems via SMS for critical issues
3. Shows simple visual indicators (red/yellow/green) for at-a-glance status
4. Queues items that need their approval
5. Prompts strategic thinking about value creation and moats
6. Surfaces relevant industry news and trends

---

## Morning Check-In (First 5 Minutes)

### What the Chairman Wants to See

**Primary Question:** "Is everything okay?"

**Expected Response Format:**
```
"Good morning. Everything is running normally."

OR

"Good morning. 3 items need your attention:
 - System alert: Payment service responding slowly
 - Approval needed: 2 agency applications pending
 - AI notice: Prediction accuracy dropped 5% overnight"
```

### Health Status Areas

| Area | Plain English Example (Healthy) | Plain English Example (Problem) |
|------|--------------------------------|--------------------------------|
| **System Health** | "All systems operational" | "Payment service is slow (investigating)" |
| **AI Performance** | "Predictions performing normally" | "Accuracy dropped 5% - may need recalibration" |
| **Revenue** | "Revenue trending up this week" | "Revenue flat for 3 days - unusual pattern" |
| **User Activity** | "147 active creators, engagement stable" | "Creator logins down 20% this week" |
| **Approvals Queue** | "No pending approvals" | "5 items need your approval" |
| **Data Pipeline** | "Training data collection healthy" | "Scraping paused - API limit reached" |

### Visual Indicators

- **Green dot** = Healthy, no action needed
- **Yellow dot** = Warning, worth monitoring
- **Red dot** = Problem, needs attention
- **Number badge** = Items requiring approval

---

## Alert System

### Tier 1: SMS to Phone (Critical)

**Triggers:**
- System is completely down
- Error rate exceeds threshold (TBD - to be calibrated)
- Any service outage affecting users

**Format:**
```
TRENDZO ALERT: [System Name] is DOWN
Time: 2:34 AM EST
Action: Engineering notified. Check hub for details.
```

### Tier 2: On-Screen Red Indicator (Urgent)

**Triggers:**
- Revenue dropped significantly (threshold TBD)
- Error rate elevated but not critical
- AI accuracy below acceptable range
- Multiple warnings in same area

### Tier 3: On-Screen Yellow Indicator (Monitor)

**Triggers:**
- Unusual patterns detected
- Approaching thresholds
- Non-critical anomalies

### Tier 4: Green (All Clear)

**Triggers:**
- Everything operating within normal parameters

---

## Approval Workflow

### Items Requiring Chairman Approval

| Approval Type | Frequency | Urgency |
|--------------|-----------|---------|
| **Payouts** | As needed | Medium - process within 24-48h |
| **Agency Applications** | Weekly | Low - review during weekly ritual |
| **Feature Toggles/Creation** | As needed | Varies by feature |

### Approval Queue Interface

The hub should show:
- Count of pending approvals by type
- One-click access to approval interface
- Quick approve/reject with optional notes

---

## Deep Dive Behavior

### When Does Chairman Investigate?

**Trigger:** Alerts only (not proactive)

**What They Want When Investigating:**
- Plain English explanation of the problem
- What caused it (if known)
- What's being done about it
- Whether they need to take action

**What They DON'T Want:**
- Raw data to analyze
- Charts to interpret
- Technical jargon
- Multiple clicks to understand

### Investigation Flow

```
Alert appears → Click for details → See plain English summary → 
Take action OR acknowledge and close
```

---

## Strategic Prompts

### Daily Prompts (Rotating)

The chairman wants prompts that encourage strategic thinking:

**Value Creation Prompts:**
- "What's one feature that could 10x creator retention?"
- "Which part of the platform is underutilized?"
- "What would make agencies pay 2x for your service?"

**Moat Building Prompts:**
- "What data do you have that competitors can't easily get?"
- "What would take a competitor 2+ years to replicate?"
- "Which integration would lock in your best customers?"

**Industry News (Last 24 Hours):**
- Trending marketing news relevant to your space
- AI/technology advancements that could affect your product
- Competitor moves worth knowing about

### Implementation Note

These prompts should:
- Appear once daily (not constantly)
- Be dismissible
- Optionally save to a "ideas" log for later review
- Pull real news via API integration (future enhancement)

---

## Weekly Review Ritual (NEW)

### Chairman's Weekly Review

**When:** TBD (suggest: Monday morning or Friday afternoon)

**What to Review:**

1. **Week in Summary** (Plain English)
   - "This week: Revenue up 8%, 12 new creators onboarded, AI accuracy stable at 73%"

2. **Trends vs Last Week**
   - Simple up/down arrows with plain English context
   - "Creator engagement UP - 15% more videos analyzed"
   - "Payout requests DOWN - seasonal pattern"

3. **Approvals Completed**
   - Summary of what you approved this week

4. **Strategic Reflection**
   - "Did you add to your moat this week?"
   - Space to note accomplishments or concerns

5. **Next Week Focus**
   - What's coming up (scheduled training runs, campaigns, etc.)

---

## User Profile Summary

| Attribute | Value |
|-----------|-------|
| **Technical Level** | Non-coder, creative thinker |
| **Decision Style** | Alert-driven, not proactive monitoring |
| **Information Preference** | Plain English, not raw data |
| **Time Investment** | 5 min daily check-in, 30 min weekly review |
| **Approval Authority** | Payouts, agencies, feature toggles |
| **Alert Preference** | SMS for critical, visual for everything else |
| **Strategic Interest** | Value creation, moat building, industry trends |

---

## Key Design Implications

Based on this workflow mapping, the Chairman's Hub must:

### MUST HAVE
1. **Plain English status narration** - No raw metrics without context
2. **Visual health indicators** - Green/yellow/red at a glance
3. **Approval queue with counts** - Know what needs your action
4. **SMS integration for critical alerts** - System down = text message
5. **Strategic prompts** - Daily thinking prompts
6. **Weekly review template** - Structured reflection ritual

### SHOULD HAVE
1. **News/trends integration** - AI and marketing news (24h)
2. **Investigation drill-down** - Click alert → plain English explanation
3. **Approval one-click actions** - Quick approve/reject flow

### NICE TO HAVE
1. **Ideas log** - Save strategic thoughts for later
2. **Voice summary** - "Read me today's status" (future)
3. **Competitor tracking** - What are they launching?

---

## Phase 2 Complete

This workflow mapping confirms the chairman needs an **Intelligent Business Narrator**, not a traditional metrics dashboard.

The hub should feel like having a smart assistant who:
- Monitors everything 24/7
- Only bothers you when something matters
- Explains problems in plain English
- Helps you think strategically
- Respects your time

**Next:** Phase 3 - Information Architecture (define what data feeds each area)
