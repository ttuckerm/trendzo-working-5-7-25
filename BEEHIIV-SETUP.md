# Beehiiv Integration Setup for TRENDZO

## Why Beehiiv for TRENDZO?

Using Beehiiv as your email provider gives you:
- **Unified System**: Newsletter + transactional emails in one place
- **Advanced Segmentation**: Segment users by niche, platform, viral status
- **Built-in Automations**: Welcome series, re-engagement, viral alerts
- **Analytics**: Track email → video creation → viral success
- **Cost Effective**: One subscription vs multiple services

## Quick Setup (15 minutes)

### 1. Get Your Beehiiv API Credentials

1. Log into your Beehiiv account
2. Go to **Settings → Integrations → API**
3. Create a new API key with these permissions:
   - `subscriptions:write` - Add/update subscribers
   - `subscriptions:read` - Check subscriber status
   - `custom_fields:write` - Track user behavior
   - `emails:write` - Send transactional emails
   - `segments:write` - Create user segments

### 2. Set Environment Variables

Add to your `.env.local`:
```env
# Beehiiv Configuration
BEEHIIV_API_KEY=your_api_key_here
BEEHIIV_PUBLICATION_ID=your_publication_id_here
```

### 3. Create Custom Fields in Beehiiv

Go to **Audience → Custom Fields** and create:

| Field Name | Field Type | Purpose |
|------------|------------|---------|
| source | Text | Where user signed up (landing_page, exit_intent, etc) |
| niche | Select | User's content niche (business, creator, fitness, education) |
| platform | Select | Primary platform (linkedin, twitter, facebook, instagram) |
| template_id | Text | Last template created |
| viral_score | Number | Highest viral score achieved |
| videos_created | Number | Total videos created |
| is_viral_creator | Boolean | Has gone viral (>100k views) |
| total_viral_views | Number | Cumulative viral views |
| last_viral_platform | Text | Platform where they went viral |
| user_id | Text | TRENDZO user ID for sync |

### 4. Set Up Segments

Create these segments in **Audience → Segments**:

1. **Viral Creators**
   - Filter: `is_viral_creator = true`
   - Use for: Success stories, case studies

2. **Power Users** 
   - Filter: `videos_created > 10`
   - Use for: Advanced features, beta testing

3. **By Niche** (create 4)
   - Filter: `niche = [business/creator/fitness/education]`
   - Use for: Niche-specific content

4. **By Platform** (create 4)
   - Filter: `platform = [linkedin/twitter/facebook/instagram]`
   - Use for: Platform updates, tips

5. **Inactive Users**
   - Filter: `last_activity > 30 days ago`
   - Use for: Win-back campaigns

### 5. Create Email Automations

Set up these automations in **Automations**:

#### Welcome Series (New Subscribers)
```
Trigger: New subscriber added
Delay: Immediate
Email 1: Welcome + Quick Win Template
---
Delay: 24 hours
Email 2: 5 Viral Secrets PDF
---
Delay: 72 hours  
Email 3: Case Study - 0 to 1M views
---
Delay: 7 days
Email 4: Special offer or survey
```

#### Viral Alert Series (When someone goes viral)
```
Trigger: Custom field `is_viral_creator` changes to true
Delay: Immediate
Email: Congratulations! You're viral! 
---
Delay: 24 hours
Email: How to maintain momentum
---
Delay: 3 days
Email: Turn viral moments into followers
```

### 6. Test the Integration

Run this test script:
```typescript
// test-beehiiv.ts
import { beehiivService } from './src/lib/services/beehiivService';

async function testBeehiiv() {
  console.log('Testing Beehiiv integration...');
  
  // Test 1: Add subscriber
  const result = await beehiivService.addSubscriber({
    email: 'test@example.com',
    source: 'landing_page',
    niche: 'business',
    platform: 'linkedin',
    metadata: {
      test_run: 'true'
    }
  });
  
  console.log('Add subscriber:', result);
  
  // Test 2: Send magic link
  const emailSent = await beehiivService.sendMagicLink({
    email: 'test@example.com',
    token: 'test_token_123',
    redirectTo: '/dashboard'
  });
  
  console.log('Magic link sent:', emailSent);
}

testBeehiiv();
```

## Advanced Features

### 1. Track Video Performance → Email
```typescript
// When a video goes viral
if (videoViews > 100000) {
  await beehiivService.sendViralAlert({
    email: user.email,
    views: videoViews,
    platform: 'tiktok',
    templateId: template.id
  });
  
  // User is now in "viral_creators" segment
  // They'll receive different content
}
```

### 2. Smart Re-engagement
```typescript
// Automatically handled by Beehiiv automation
// When user hasn't created video in 30 days
// They receive win-back series with special offer
```

### 3. A/B Test Email Campaigns
Use Beehiiv's built-in A/B testing for:
- Subject lines
- Send times
- Content variations
- CTA buttons

### 4. Revenue Attribution
Track which emails drive the most video creations:
```typescript
// In your analytics
const emailSource = searchParams.get('utm_source'); // 'beehiiv_welcome_3'
const emailCampaign = searchParams.get('utm_campaign'); // 'onboarding'

// Track conversion
await trackEvent('email_to_video_conversion', {
  emailSource,
  emailCampaign,
  templateCreated: true
});
```

## Migration from SendGrid

If you have existing SendGrid templates:

1. Export your templates as HTML
2. Create new templates in Beehiiv's editor
3. Update field mappings:
   - `{{name}}` → `{{ subscriber.name }}`
   - `{{custom.field}}` → `{{ subscriber.custom_fields.field }}`

## Cost Comparison

**SendGrid**: 
- $15/month (10k emails)
- No subscriber management
- No automations
- Separate analytics

**Beehiiv**:
- $0-42/month (includes everything)
- Newsletter + transactional
- Full automation suite
- Integrated analytics
- Subscriber management

## Support

- Beehiiv API Docs: https://developers.beehiiv.com/
- Support: support@beehiiv.com
- TRENDZO integration issues: Create issue in repo

## Next Steps

1. ✅ Set up Beehiiv account
2. ✅ Configure custom fields
3. ✅ Create segments
4. ✅ Build automations
5. 🚀 Start sending!

Your email infrastructure is now unified and scalable!