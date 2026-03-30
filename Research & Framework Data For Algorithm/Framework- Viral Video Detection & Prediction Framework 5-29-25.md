# Viral Video Detection & Prediction Framework

## 1. VIRAL METRICS FORMULA

### Primary Virality Indicators
**The 5X Rule**: A video is considered viral if it has 5x more views than the creator's follower count

**Engagement Velocity Formula**:
```
Viral Score = (Views ÷ Followers) × (Engagement Rate × 100) × (Time Decay Factor)

Where:
- Views ÷ Followers ≥ 5 = High viral potential
- Engagement Rate = (Likes + Comments + Shares) ÷ Views
- Time Decay Factor = 1.0 (first 24hrs) → 0.7 (48hrs) → 0.5 (72hrs) → 0.3 (week+)
```

### Secondary Metrics
- **Comments-to-Views Ratio**: >2% indicates high engagement
- **Share-to-Views Ratio**: >0.5% indicates viral spread potential
- **Watch Time**: >70% completion rate
- **Growth Rate**: Follower increase >10% within 48hrs of posting

## 2. CONTENT PATTERN DETECTION FRAMEWORK

### A. Hook Classification System

**Viral Hook Types** (in order of effectiveness):
1. **Storytelling Hooks** (Highest conversion)
   - "This is a picture of my first date ever..."
   - "Six months ago, my worst nightmare became reality..."
   - "One year ago, I was sitting at home when..."

2. **Authority Hooks**
   - "Not to flex, but I'm pretty [fucking] good at [skill]"
   - "I got [impressive result] with minimal [effort/time]"
   - "This is coming from a [credible position/title]"

3. **Challenge/Question Hooks**
   - "Is it possible to [achieve X] in [timeframe]?"
   - "What if I told you [counterintuitive statement]?"
   - "I tried [X] for [timeframe] and here's what happened"

4. **Shock Value/Controversial Hooks**
   - "I'm so sorry but no amount of money could make me [X]"
   - "90% of people are going to hate what I'm about to say"
   - "If you're [age/status] and still [behavior], you need to [action]"

5. **Educational Hooks**
   - "It took me [long time] to learn this, but I'll teach it in [short time]"
   - "Here's exactly how I [achieved result]"

### B. Content Structure Patterns

**The Loop System** (keeps viewers watching):
- Open a question/problem in first 3 seconds
- Build tension throughout middle
- Resolve/answer at the end
- Seamlessly connect ending back to beginning

**Series Content** (builds followers):
- Episodic content that creates anticipation
- Consistent format and branding
- Cliffhangers that encourage following

### C. Visual Format Detection

**High-Performing Formats**:
1. **Shot/Angle Change**: New shot every 2 seconds
2. **Visual Props**: Using objects to demonstrate concepts
3. **B-Roll + Storytelling**: Cinematic footage with narrative overlay
4. **Talking Back & Forth**: Playing multiple characters/perspectives
5. **Transition Hooks**: Viral transitions leading into content

## 3. SCRAPING CRITERIA FRAMEWORK

### A. Automated Detection Parameters

**Primary Filters**:
```python
# Pseudo-code for viral detection
if (views / followers) >= 5.0:
    viral_potential = "HIGH"
elif (views / followers) >= 3.0:
    viral_potential = "MEDIUM"
elif (views / followers) >= 1.5:
    viral_potential = "LOW"
else:
    viral_potential = "NONE"

# Engagement quality check
engagement_rate = (likes + comments + shares) / views
if engagement_rate > 0.08:  # 8%+
    quality_score = "HIGH"
elif engagement_rate > 0.05:  # 5%+
    quality_score = "MEDIUM"
```

**Hook Pattern Matching**:
- Scan first 10 words for hook templates
- Check for emotional triggers (power words, numbers, timeframes)
- Identify storytelling markers ("years ago", "when I", "this is")

**Format Recognition**:
- Analyze shot changes in first 10 seconds
- Detect text overlays and visual props
- Identify series indicators in captions/titles

### B. Niche-Specific Filters

**Business/Finance**: Focus on money, success, transformation content
**Fitness**: Before/after, challenge, and tutorial content
**Lifestyle**: Story-driven, relatable, aspirational content
**Education**: How-to, myth-busting, insider knowledge

## 4. TRENDING PREDICTION MODEL

### A. Early Viral Indicators (0-6 hours)

**Green Flags**:
- Initial engagement rate >15% in first hour
- Comment velocity >10 comments/hour for small accounts
- Share ratio >1% within first 3 hours
- Cross-platform sharing detected

**Red Flags**:
- Engagement rate <2% after first hour
- High view count but low completion rate (<40%)
- Negative comment sentiment >30%

### B. Momentum Tracking

**Growth Phases**:
1. **Ignition** (0-6hrs): 5x normal engagement rate
2. **Acceleration** (6-24hrs): Sustained growth with cross-platform sharing
3. **Peak** (24-72hrs): Maximum reach and engagement
4. **Decay** (72hrs+): Declining but sustained engagement

### C. Algorithm Compatibility Score

**TikTok Algorithm Factors**:
- Watch time completion rate (weight: 40%)
- User interaction signals (weight: 30%)
- Video information relevance (weight: 20%)
- Device/account settings (weight: 10%)

## 5. IMPLEMENTATION STRATEGY

### A. Scraping Methodology

1. **Seed Collection**: Start with known viral hooks and trending hashtags
2. **Pattern Expansion**: Use "Others also searched" and related content
3. **Cross-Reference**: Validate patterns across multiple niches
4. **Real-time Monitoring**: Track engagement velocity in real-time

### B. Data Collection Points

**Essential Metrics**:
- View count, engagement metrics, follower count
- Upload timestamp, growth trajectory
- Hook type, format style, content structure
- Cross-platform performance correlation

**Content Analysis**:
- First 10 words transcription
- Visual style classification
- Series/standalone identification
- CTA effectiveness tracking

### C. Validation Framework

**A/B Testing Approach**:
- Test identified patterns with controlled content
- Measure prediction accuracy over time
- Refine scoring algorithms based on results
- Build feedback loops for continuous improvement

## 6. ACTIONABLE OUTPUTS

### For Content Creators:
- **Hook Generator**: AI-powered hook suggestions based on viral patterns
- **Format Recommendations**: Best-performing visual styles for their niche
- **Timing Optimization**: Best posting times based on engagement patterns

### For Marketers:
- **Trend Forecasting**: Predict viral topics 24-48 hours early
- **Influencer Identification**: Find creators with high viral potential
- **Content Strategy**: Data-driven content calendar creation

### For Researchers:
- **Pattern Documentation**: Comprehensive viral content database
- **Algorithm Insights**: Understanding platform preference changes
- **Prediction Accuracy**: Continuously improving viral detection models