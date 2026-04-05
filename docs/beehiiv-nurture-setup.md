# Beehiiv Nurture Sequence Setup Guide

This guide walks through setting up the 5 automated nurture sequences in Beehiiv.
All email content lives in `src/lib/funnel/nurture-sequences.ts` as the single source of truth.

---

## Prerequisites

- Beehiiv account with API access
- Tags already being applied by existing endpoints:
  - `/api/free/freedom-os/lead` applies segment tags (`agency-operator`, `business-builder`, `side-hustle-seeker`, `curious-browser`)
  - `/api/funnel/waitlist` applies `waitlist` tag
- Replace template variables in email content before pasting:
  - `{{value_hub_url}}` → your Value Hub URL (e.g., `https://trendzo.io/free`)
  - `{{freedom_agent_url}}` → Freedom Agent session URL or entry page
  - `{{freedom_agent_entry_url}}` → `https://trendzo.io/free/freedom-agent`
  - `{{freedom_os_url}}` → `https://trendzo.io/free/freedom-os`
  - `{{unsubscribe_url}}` → Beehiiv handles this automatically with its own unsubscribe link

---

## Step-by-Step Setup

### 1. Create Segment A Automation (Agency Operator)

1. Go to **Beehiiv Dashboard → Automations → Create Automation**
2. **Trigger:** "Subscriber receives tag" → select `agency-operator`
3. **Settings:** Check "Send only once per subscriber"
4. Add 5 email steps:

| Step | Delay        | Subject                                        |
|------|-------------|------------------------------------------------|
| 1    | Immediate (1 day) | The agency model nobody's talking about    |
| 2    | 2 days      | How one agency went from guessing to knowing    |
| 3    | 2 days      | The scoring system behind viral predictions     |
| 4    | 3 days      | Your agency dashboard is waiting                |
| 5    | 4 days      | Last call for founding access                   |

5. For each email: copy subject, preview text, and HTML body from `nurture-sequences.ts` (segment `agency-operator`, emails 1-5)
6. **Activate** the automation

### 2. Create Segment B Automation (Business Builder)

1. **Trigger:** "Subscriber receives tag" → select `business-builder`
2. **Settings:** "Send only once per subscriber"
3. Add 5 email steps:

| Step | Delay        | Subject                                             |
|------|-------------|-----------------------------------------------------|
| 1    | Immediate (1 day) | The fastest path to your first $1,000 online  |
| 2    | 2 days      | Why most online businesses fail in month 2           |
| 3    | 2 days      | The content strategy that doesn't require going viral |
| 4    | 3 days      | Meet your AI business advisor                        |
| 5    | 4 days      | Your 90-day plan just got an upgrade                 |

4. Copy content from `nurture-sequences.ts` (segment `business-builder`)
5. **Activate**

### 3. Create Segment C Automation (Side Hustle Seeker)

1. **Trigger:** "Subscriber receives tag" → select `side-hustle-seeker`
2. **Settings:** "Send only once per subscriber"
3. Add 5 email steps:

| Step | Delay        | Subject                                              |
|------|-------------|------------------------------------------------------|
| 1    | Immediate (1 day) | You don't need to quit your job to start       |
| 2    | 3 days      | The 3 side hustles that actually work in 2026         |
| 3    | 3 days      | How to know what content to post (without guessing)   |
| 4    | 4 days      | A free tool that plans your business for you          |
| 5    | 4 days      | Ready for the next step?                              |

4. Copy content from `nurture-sequences.ts` (segment `side-hustle-seeker`)
5. **Activate**

### 4. Create Segment D Automation (Curious Browser)

1. **Trigger:** "Subscriber receives tag" → select `curious-browser`
2. **Settings:** "Send only once per subscriber"
3. Add 5 email steps:

| Step | Delay        | Subject                                         |
|------|-------------|--------------------------------------------------|
| 1    | 2 days      | Welcome — here's what we're about                 |
| 2    | 4 days      | 3 things we learned analyzing 10,000 TikTok videos |
| 3    | 5 days      | The creator economy is changing — here's how       |
| 4    | 7 days      | Your free AI business advisor                      |
| 5    | 7 days      | Still curious?                                     |

4. Copy content from `nurture-sequences.ts` (segment `curious-browser`)
5. **Activate**

### 5. Create Waitlist Automation

1. **Trigger:** "Subscriber receives tag" → select `waitlist`
2. **Settings:** "Send only once per subscriber"
3. Add 5 email steps:

| Step | Delay        | Subject                                         |
|------|-------------|--------------------------------------------------|
| 1    | Immediate   | You're on the list — here's your position          |
| 2    | 3 days      | What Trendzo actually does                         |
| 3    | 4 days      | While you wait — your free AI advisor              |
| 4    | 7 days      | Launch update                                      |
| 5    | 7 days      | Your founding access is almost ready               |

4. Copy content from `nurture-sequences.ts` (segment `waitlist`)
5. **Activate**

---

## Testing

1. Create a test subscriber in Beehiiv with a test email
2. Manually apply a segment tag to trigger the automation
3. Verify the first email arrives within the expected delay
4. Check that template variables (URLs) are replaced correctly
5. Verify unsubscribe link works
6. Repeat for each segment

---

## Important Notes

- **"Send only once"** is critical — without it, if a subscriber's tag is re-applied, they'll get the sequence again
- **Beehiiv delays** are relative to the previous step, not signup date. The delay column above shows inter-step delays (the `delayDays` in the code is from signup)
- **No Trendzo mention before email 4** in segments A/B/C/D — this mirrors the Freedom Agent's soft-sell arc
- **Waitlist is different** — they already want the product, so Trendzo is mentioned from email 1
- The Freedom Agent weekly check-in emails (`/api/freedom-agent/weekly-checkin`) run separately and complement these sequences

---

## Sequence Philosophy

| Segment | Tone | Pace | Trendzo Reveal |
|---------|------|------|----------------|
| A (Agency) | Professional, scale-focused | Aggressive (12 days) | Email 4 (day 8) |
| B (Builder) | Encouraging, systems-focused | Moderate (12 days) | Email 4 (day 8) |
| C (Side Hustle) | Supportive, simple | Relaxed (15 days) | Email 4 (day 11) |
| D (Curious) | Educational, no-pressure | Slow (25 days) | Email 4 (day 18) |
| Waitlist | Direct, transparent | Moderate (21 days) | Email 1 (day 0) |
