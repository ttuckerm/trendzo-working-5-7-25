# Template Editor and Library Integration

## Overview

This document explains the integration between the Template Editor and Template Library components in the Trendzo application. The integration provides a seamless user experience with animations, state persistence, and tracking capabilities.

## Components Involved

1. **AppIntegration**: Provides animated transitions between different views with direction-aware animations
2. **TemplateEditor**: Main editor component for modifying templates with error handling and type safety
3. **TemplateLibrary**: Template browsing and selection interface
4. **useTemplateIntegration**: Hook for managing template navigation and state persistence

## How It Works

### State Persistence

The integration uses the StateContext to persist information between components:

- Template selection is stored in `templateLibrary.selectedTemplateId`
- Scroll positions are saved in `templateLibrary.scrollPosition`
- Navigation paths are tracked in `navigation.previousPath` and `navigation.currentPath`

### Animations

Transitions between components use Framer Motion animations with direction awareness:
- Template Library → Editor: Slide left animation
- Editor → Template Library: Slide right animation
- Analytics → Template Library: Slide left animation
- Dashboard → Analytics: Slide left animation
- Home → Auth: Slide up animation

The transitions can be disabled for users with reduced motion preferences.

### Tracking and Analytics

User interactions are tracked through the UsabilityTestContext:
- Template selection
- Editor navigation
- Save operations
- Template modifications

### Error Handling

The integration includes improved error handling:
- Handling missing sections when accessing via URL parameters
- Confirming navigation when there are unsaved changes
- Managing inconsistent state between URL and data

## Usage

### Navigating from Template Library to Editor

```tsx
// In a Template Library component
import { useTemplateIntegration } from '@/lib/hooks/useTemplateIntegration';

function TemplateItem({ template }) {
  const { navigateToEditor } = useTemplateIntegration();
  
  const handleSelect = () => {
    navigateToEditor(template.id, 'template-library');
  };
  
  return (
    <div onClick={handleSelect}>
      {/* Template content */}
    </div>
  );
}
```

### Navigating from Editor back to Library

```tsx
// In an Editor component
import { useTemplateIntegration } from '@/lib/hooks/useTemplateIntegration';

function EditorHeader() {
  const { navigateToTemplateLibrary } = useTemplateIntegration();
  
  return (
    <button onClick={navigateToTemplateLibrary}>
      Back to Library
    </button>
  );
}
```

### Saving Templates with Tracking

```tsx
// In an Editor component
import { useTemplateIntegration } from '@/lib/hooks/useTemplateIntegration';

function SaveButton({ templateId }) {
  const { saveTemplateWithTracking } = useTemplateIntegration();
  const { saveTemplate } = useEditor();
  
  const handleSave = async () => {
    try {
      await saveTemplateWithTracking(saveTemplate, templateId);
      // Show success message
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <button onClick={handleSave}>
      Save Template
    </button>
  );
}
```

### Using the Enhanced AppIntegration Component

```tsx
// In a layout or page component
import AppIntegration from '@/components/AppIntegration';

function MyLayout({ children }) {
  return (
    <AppIntegration
      disableAnimations={false} // Optional: disable animations
      preserveScroll={true} // Optional: preserve scroll position on navigation
    >
      {children}
    </AppIntegration>
  );
}
```

## Implementation Details

The implementation uses the following contexts and hooks:
- `StateContext` for persisting data between components
- `UsabilityTestContext` for tracking user interactions
- `AppIntegration` for animated transitions with direction awareness
- `useTemplateIntegration` for convenient integration methods

## Recent Improvements

- **Enhanced Animations**: Added direction-aware animations based on navigation pattern
- **Type Safety**: Fixed TypeScript type issues in component props
- **Error Handling**: Added proper error handling for missing templates/sections
- **Accessibility**: Added support for reduced motion preferences
- **State Management**: Improved state persistence and restoration

## Extending the Integration

To add more components to this integration:
1. Update the `getTransitionDirection` function in `AppIntegration.tsx`
2. Create appropriate navigation methods in `useTemplateIntegration.ts`
3. Add any necessary state keys to store component-specific data

## Best Practices

- Always use the `useTemplateIntegration` hook for navigation between related components
- Store component state in the `StateContext` for persistence
- Wrap components with `AppIntegration` for transitions
- Track meaningful interactions with the `trackInteraction` function
- Ensure all component props are properly typed
- Handle potential errors like missing data or inconsistent state 