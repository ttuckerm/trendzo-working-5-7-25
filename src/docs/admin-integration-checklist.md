# CleanCopy Admin Panel - Integration & Testing Checklist

## Navigation Consistency

### Icon Sidebar (60px)
- [ ] All 8 section icons display correctly
- [ ] Python service status indicator shows correct state
- [ ] Hover tooltips appear on icon hover
- [ ] Active section highlighted with accent color
- [ ] Click navigates to section's first page

### Section Sidebar (200px)  
- [ ] Expands on section icon click
- [ ] Shows correct pages for each section
- [ ] Nested items indent properly
- [ ] Active page highlighted
- [ ] Collapse when clicking different section icon
- [ ] Pin/unpin functionality works

### Breadcrumbs
- [ ] Show correct path for all pages
- [ ] Each segment is clickable
- [ ] Home icon leads to dashboard

## Permission Enforcement

### Role Matrix Testing
| Feature | Chairman | Sub-Admin | Agency | Developer | Creator | Clipper |
|---------|----------|-----------|--------|-----------|---------|---------|
| Dashboard | Full | Limited | Agency | Developer | Creator | Clipper |
| Organization > Agencies | Full | Read | Own Only | ❌ | ❌ | ❌ |
| Organization > Creators | Full | Read | Own Creators | ❌ | Own Profile | ❌ |
| Organization > Developers | Full | Read | ❌ | Own Profile | ❌ | ❌ |
| Config > Feature Toggles | Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| Config > Tiers | Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rewards > Platform Campaigns | Full | Read | ❌ | ❌ | ❌ | ❌ |
| Rewards > Content Campaigns | Full | Read | Full | ❌ | Full | Read |
| Rewards > App Campaigns | Full | Read | ❌ | Full | ❌ | Read |
| Rewards > App Store | Full | Read | Browse | Full | Browse | Browse |
| Rewards > Affiliate | Full | Read | Full | Full | Full | Full |
| Rewards > Payouts | Full | Read | ❌ | ❌ | ❌ | ❌ |
| Integrations > API | Full | Read | Pro+ | Pro+ | ❌ | ❌ |
| Integrations > Webhooks | Full | Read | Pro+ | Pro+ | ❌ | ❌ |
| Audit Log | Full | Read | Own | Own | Own | Own |
| Impersonation | Full | ❌ | Sub-users | ❌ | ❌ | ❌ |

### Test Scenarios
- [ ] Navigate to restricted page → Redirect to unauthorized
- [ ] Try restricted action via UI → Button hidden/disabled
- [ ] Try restricted action via direct URL → 403 error
- [ ] Impersonation correctly limits permissions
- [ ] Role badge displays correctly in header

## Data Flow Testing

### Supabase Connections
- [ ] `profiles` table loads user data
- [ ] `agencies` table CRUD operations work
- [ ] `creators` table with agency relationship
- [ ] `developers` table loads correctly
- [ ] `clippers` table loads correctly
- [ ] `campaigns` (all types) CRUD works
- [ ] `mini_apps` table loads and filters
- [ ] `payouts` queue operations work
- [ ] `audit_log` writes on all actions
- [ ] `feature_toggles` per-agency settings work
- [ ] `api_keys` generation and storage
- [ ] `webhooks` CRUD and logging

### Real-time Subscriptions
- [ ] New notification appears without refresh
- [ ] Campaign stats update in real-time
- [ ] Payout status changes reflect immediately
- [ ] Audit log shows new entries live

## Cross-Section Links

### Quick Navigation
- [ ] Dashboard → Organization (quick actions work)
- [ ] Dashboard → Campaigns (stats link to detail)
- [ ] Agency detail → View creators
- [ ] Agency detail → View campaigns
- [ ] Creator detail → View agency
- [ ] Campaign detail → View participants
- [ ] App Store → App campaigns
- [ ] Payouts → User profiles
- [ ] Audit log → Related resource links

### Global Search (Cmd+K)
- [ ] Opens with keyboard shortcut
- [ ] Searches agencies, creators, developers
- [ ] Searches campaigns, apps
- [ ] Searches settings pages
- [ ] Arrow keys navigate results
- [ ] Enter navigates to selected
- [ ] Escape closes modal
- [ ] Quick actions appear when empty

## Responsive Design

### Breakpoint Testing
- [ ] Desktop (1440px+): Full layout
- [ ] Laptop (1024-1439px): Compressed sidebar
- [ ] Tablet (768-1023px): Collapsible sidebar
- [ ] Mobile (< 768px): Hamburger menu

### Component Responsiveness
- [ ] Tables scroll horizontally on small screens
- [ ] Cards stack vertically on mobile
- [ ] Modals fit screen with padding
- [ ] Form inputs full-width on mobile
- [ ] Stats grid reduces columns

## Error Handling

### Network Errors
- [ ] API failure shows toast notification
- [ ] Retry button appears for failed loads
- [ ] Offline state detected and shown
- [ ] Reconnection triggers refresh

### Validation Errors
- [ ] Form validation shows inline errors
- [ ] Submit disabled until valid
- [ ] Server errors show in toast
- [ ] Specific field errors highlighted

### Empty States
- [ ] All tables have empty state
- [ ] Empty state shows action (if permitted)
- [ ] Filtered empty different from true empty

## Performance

### Load Times
- [ ] Initial page load < 2s
- [ ] Navigation between pages < 500ms
- [ ] Large tables paginate (20 items)
- [ ] Infinite scroll loads more smoothly
- [ ] Images lazy load

### Caching
- [ ] API responses cached appropriately
- [ ] Stale-while-revalidate for lists
- [ ] User profile cached in session
- [ ] Permission matrix cached

## Accessibility

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Tab order logical
- [ ] Escape closes modals
- [ ] Enter activates buttons

### Screen Readers
- [ ] All icons have aria-labels
- [ ] Tables have proper headers
- [ ] Status badges have text alternatives
- [ ] Loading states announced

### Color Contrast
- [ ] All text meets WCAG AA
- [ ] Error states don't rely solely on color
- [ ] Focus indicators visible

## Security

### Authentication
- [ ] Session expires after inactivity
- [ ] Logout clears all session data
- [ ] Auth state persists on refresh
- [ ] Multi-tab logout works

### Authorization
- [ ] API routes check permissions
- [ ] Client-side checks match server
- [ ] Impersonation logged in audit
- [ ] API keys hashed in database

### Data Protection
- [ ] Sensitive data not in URLs
- [ ] API keys masked in UI
- [ ] Passwords never exposed
- [ ] Audit log captures PII carefully

## Integration Tests

### End-to-End Scenarios

#### 1. Agency Onboarding
```
Chairman logs in
→ Navigate to Organization > Agencies
→ Click "Add Agency"
→ Fill form (name, email, tier)
→ Submit → Agency created
→ Verify in list
→ Click agency → Detail page loads
→ Check audit log shows creation event
```

#### 2. Creator Verification Flow
```
Creator signs up (external)
→ Chairman sees notification
→ Navigate to Organization > Creators
→ Filter by "Pending"
→ Click creator → View profile
→ Click "Verify"
→ Confirm in modal
→ Creator status updates
→ Notification sent to creator
→ Audit log records verification
```

#### 3. Campaign Lifecycle
```
Chairman creates Platform Campaign
→ Sets budget, dates, pay rates
→ Publishes campaign
→ Creators see in their dashboard
→ Creators join campaign
→ Track participation metrics
→ Campaign ends
→ Payouts queued automatically
→ Chairman approves payouts
→ Audit log shows full history
```

#### 4. Mini App Submission
```
Developer logs in
→ Navigate to App Store
→ Click "Submit App"
→ Fill details, upload screenshots
→ Submit for review
→ Chairman gets notification
→ Reviews app details
→ Approves/Rejects with reason
→ Developer notified
→ If approved, app appears in store
```

#### 5. Payout Processing
```
Chairman navigates to Payouts
→ Sees pending payouts list
→ Selects multiple payouts
→ Clicks "Process Selected"
→ Confirms total amount
→ Payouts marked as processing
→ External payment initiated
→ Status updates to completed
→ Users notified of payment
```

#### 6. Impersonation Flow
```
Chairman views agency list
→ Clicks "Impersonate" on agency
→ Banner shows impersonation active
→ Sees agency's dashboard view
→ Can browse as agency user
→ Actions logged with impersonation flag
→ Clicks "Exit Impersonation"
→ Returns to Chairman view
→ Audit log shows impersonation session
```

#### 7. Feature Toggle Update
```
Chairman navigates to Config > Feature Toggles
→ Views global feature list
→ Toggles "API Access" for specific agency
→ Change saved immediately
→ Agency's feature list updates
→ Audit log records change
→ Agency sees new feature available
```

#### 8. Webhook Integration
```
Developer navigates to Webhooks
→ Clicks "Add Webhook"
→ Enters URL, selects events
→ Saves webhook
→ Clicks "Send Test"
→ Views response in modal
→ Webhook receives events
→ Views logs for debugging
```

## Page-by-Page Verification

### Dashboard (`/admin/dashboard`)
- [ ] Role-specific dashboard renders
- [ ] Stats cards show accurate data
- [ ] Quick actions navigate correctly
- [ ] Recent activity loads

### Organization Section

#### Overview (`/admin/organization`)
- [ ] Stats summary loads
- [ ] Quick links work
- [ ] Activity feed updates

#### Agencies (`/admin/organization/agencies`)
- [ ] Table loads with pagination
- [ ] Search filters correctly
- [ ] Tier filter works
- [ ] Sort options work
- [ ] Row click navigates to detail

#### Agency Detail (`/admin/organization/agencies/[id]`)
- [ ] All tabs load correctly
- [ ] Quota usage displays
- [ ] Feature toggles work
- [ ] Creator list loads
- [ ] Danger zone actions work

#### Creators (`/admin/organization/creators`)
- [ ] Verification workflow works
- [ ] Agency filter works (or scoped)
- [ ] Platform badges display
- [ ] Verification badges accurate

### Config Section

#### Feature Toggles (`/admin/config/feature-toggles`)
- [ ] Global toggles list loads
- [ ] Per-agency overrides work
- [ ] Changes save immediately
- [ ] Descriptions helpful

#### Tiers (`/admin/config/tiers`)
- [ ] Tier comparison table loads
- [ ] Feature matrix accurate
- [ ] Upgrade path shown

### Rewards Section

#### Overview (`/admin/rewards`)
- [ ] All three layers shown
- [ ] Stats for each layer
- [ ] Quick links work

#### Platform Campaigns (`/admin/rewards/platform-campaigns`)
- [ ] Campaign list loads
- [ ] Create form works
- [ ] Status badges accurate
- [ ] Budget progress displays

#### Content Campaigns (`/admin/rewards/content-campaigns`)
- [ ] Campaign cards display
- [ ] Agency filter works
- [ ] Join functionality works

#### App Campaigns (`/admin/rewards/app-campaigns`)
- [ ] Developer can create
- [ ] Performance metrics show
- [ ] Clipper participation tracked

#### App Store (`/admin/rewards/app-store`)
- [ ] Grid layout displays
- [ ] Category filter works
- [ ] Search works
- [ ] Submission flow works

#### Affiliate (`/admin/rewards/affiliate`)
- [ ] Referral code generated
- [ ] Stats display
- [ ] Commission breakdown shows

#### Payouts (`/admin/rewards/payouts`)
- [ ] Pending queue loads
- [ ] Bulk selection works
- [ ] Processing flow works
- [ ] History tab loads

### Integrations Section

#### API Management (`/admin/integrations/api`)
- [ ] Keys list loads
- [ ] Generate new key works
- [ ] Copy to clipboard works
- [ ] Revoke confirmation works
- [ ] Usage stats display

#### Webhooks (`/admin/integrations/webhooks`)
- [ ] Webhook list loads
- [ ] Create modal works
- [ ] Test functionality works
- [ ] Logs modal shows history

### Audit Log (`/admin/audit-log`)
- [ ] Events list loads
- [ ] Filters work (action, resource, date)
- [ ] Expandable details work
- [ ] Export CSV works
- [ ] Scoped to user's permissions

### Control Center (`/admin/control-center`)
- [ ] System health summary
- [ ] Page health cards
- [ ] Component status table
- [ ] Accuracy metrics
- [ ] Error log displays

## API Route Verification

### Authentication Required
- [ ] `/api/admin/*` routes require auth
- [ ] `/api/system-health` returns 401 without auth

### Permission Checks
- [ ] Each route validates user role
- [ ] Scoped routes filter by agency/developer
- [ ] 403 returned for unauthorized access

### Data Validation
- [ ] Invalid input returns 400
- [ ] Required fields enforced
- [ ] Types validated

### Response Format
- [ ] Consistent JSON structure
- [ ] Error messages helpful
- [ ] Pagination metadata included

## Database Verification

### Table Existence
- [ ] All migration tables exist
- [ ] Indexes created correctly
- [ ] Foreign keys enforced
- [ ] Default values applied

### RLS Policies
- [ ] Chairman can access all data
- [ ] Agency scoped to own data
- [ ] Developer scoped to own apps
- [ ] Creator scoped to own profile
- [ ] Audit log insert-only for service

### Triggers
- [ ] `updated_at` auto-updates
- [ ] Audit log triggers fire
- [ ] Payout status changes logged

## Component Library Verification

### StatCard
- [ ] Renders with all props
- [ ] Trend indicator shows correctly
- [ ] Color variants work

### StatusBadge
- [ ] All status types render
- [ ] Dot animation works
- [ ] Colors correct

### TierBadge
- [ ] All tiers render
- [ ] Correct colors/borders

### DataTable
- [ ] Pagination works
- [ ] Sorting works
- [ ] Loading state shows
- [ ] Empty state shows

### Modal
- [ ] Opens/closes correctly
- [ ] Backdrop click closes
- [ ] Escape key closes
- [ ] Focus trapped inside

### Toast
- [ ] Success variant works
- [ ] Error variant works
- [ ] Auto-dismiss works
- [ ] Manual dismiss works

---

## Sign-Off Checklist

### Before Production

- [ ] All integration tests pass
- [ ] No console errors in any page
- [ ] All links navigate correctly
- [ ] All forms submit successfully
- [ ] All permissions enforced
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Security review completed

### Final Verification

- [ ] Chairman full walkthrough
- [ ] Agency owner walkthrough
- [ ] Developer walkthrough
- [ ] Creator walkthrough
- [ ] Clipper walkthrough

**Tested By:** _______________  
**Date:** _______________  
**Version:** _______________


























































































