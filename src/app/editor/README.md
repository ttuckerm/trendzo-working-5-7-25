# TikTok Template Editor

This is the Template Editor page for creating and customizing TikTok templates.

## Features

- **Template Structure Management**: Add, edit, and arrange template sections with specific durations
- **Text Overlay Customization**: Add and edit text overlays for each template section
- **Visual Preview**: Real-time preview of how the template will look on a mobile device
- **Settings Management**: Configure template name, industry, category, and other settings
- **Subscription-Based Features**: 
  - Free tier: Basic editing functionality
  - Premium tier: Analytics data
  - Business tier: AI script generation

## Implementation Details

### State Management

The editor uses React state to manage:
- Template data (sections, text overlays, settings)
- UI state (selected section, loading states)

### Subscription Integration

The page uses the `useSubscription` hook to:
- Check user's subscription tier
- Enable/disable features based on access level
- Show appropriate upgrade prompts

### Layout

The editor employs a three-column layout:
1. **Left Column**: Template structure and text overlays
2. **Middle Column**: Preview area with mobile phone mockup
3. **Right Column**: Template settings and actions

## Usage

Access this page at `/editor` route. Users must be authenticated to use this feature.

```jsx
// Example of how to access a feature based on subscription tier
import { useSubscription } from '@/lib/contexts/SubscriptionContext'

function FeatureComponent() {
  const { canAccess } = useSubscription()
  
  if (canAccess('business')) {
    // Render business tier feature
  }
  
  return <div>/* Component content */</div>
} 