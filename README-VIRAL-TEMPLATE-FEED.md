# Viral Template Library Feed

A stunning, TikTok-inspired template library with advanced animations, real-time updates, and viral DNA indicators.

## Features

### 🎨 Visual Effects
- **Custom Cursor**: Smooth-following cursor with hover effects
- **Floating Orbs**: Ambient background animations with parallax scrolling
- **Gradient Animations**: Dynamic color transitions and glow effects
- **Video Previews**: Auto-play on hover with smooth transitions

### 📊 Viral Metrics
- **Viral DNA Indicators**: Visual representation of viral potential (1-3 dots based on score)
- **Real-time Stats**: Live view/like counts with formatted numbers (12.4M, 2.1K)
- **Trending Badge**: Live count of currently trending templates
- **Engagement Scores**: Viral score calculation based on views and engagement

### 🚀 Performance
- **Infinite Scroll**: Smooth pagination with Intersection Observer
- **Optimistic UI**: Immediate feedback on interactions
- **Real-time Updates**: Supabase real-time subscriptions for live data
- **Lazy Loading**: Video and image content loaded on demand

## Setup Instructions

### 1. Database Migration

Run the following SQL in your Supabase SQL editor:

```sql
-- First, run the migration to add viral columns
-- Located in: scripts/add-viral-columns.sql

-- Then, seed sample data
-- Located in: scripts/seed-viral-templates.sql
```

### 2. Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

Navigate to: `http://localhost:3000/dashboard-view/template-library/view`

## Component Structure

```
src/
├── app/dashboard-view/template-library/view/
│   └── page.tsx                    # Main feed page
├── components/templates/
│   ├── TemplateGrid.tsx           # Grid container with loading states
│   ├── ViralTemplateCard.tsx      # Individual template card
│   ├── ViralDNA.tsx              # Viral score indicator dots
│   ├── TrendingBadge.tsx         # Live trending count badge
│   ├── CustomCursor.tsx          # Custom cursor implementation
│   ├── FloatingOrbs.tsx          # Background ambient effects
│   └── LoadingIndicator.tsx      # Infinite scroll loader
```

## Database Schema

### Templates View
```sql
CREATE VIEW templates AS
SELECT 
  id::TEXT as id,
  title,
  category,
  description,
  thumbnail_url as "thumbnailUrl",
  video_url as "videoUrl",
  views,
  likes,
  viral_score,
  duration,
  sound_id,
  sound_title,
  sound_author,
  created_at,
  updated_at
FROM tiktok_templates;
```

### Key Fields
- `viral_score`: 0-100 score indicating viral potential
- `views` & `likes`: Engagement metrics
- `sound_*`: Trending audio information
- `thumbnailUrl` & `videoUrl`: Media assets

## Customization

### Styling
- Colors defined in Tailwind config
- Animations in `tailwind.config.ts`
- Component-specific styles using Tailwind classes

### Behavior
- Adjust infinite scroll threshold in `useInView` hook
- Modify auto-play delay in `ViralTemplateCard`
- Configure real-time update channels in main page

## Integration with Template Editor

When a template is clicked, it navigates to:
```
/dashboard-view/template-editor?templateId={id}
```

The template editor should handle the `templateId` query parameter to load the selected template.

## Future Enhancements

1. **Search & Filters**
   - Category filters
   - Sound-based search
   - Viral score ranges

2. **User Features**
   - Save/bookmark templates
   - Usage history
   - Personal recommendations

3. **Analytics**
   - Template performance tracking
   - A/B testing support
   - Conversion metrics

4. **Advanced Features**
   - AI-powered recommendations
   - Template remixing
   - Collaborative editing

## Troubleshooting

### Templates Not Loading
1. Check Supabase connection in browser console
2. Verify the `templates` view exists in Supabase
3. Ensure RLS policies allow SELECT access

### Animations Laggy
1. Reduce floating orb count
2. Disable custom cursor on lower-end devices
3. Use `will-change` CSS property sparingly

### Real-time Updates Not Working
1. Check Supabase real-time is enabled
2. Verify subscription channel names
3. Check browser WebSocket support 