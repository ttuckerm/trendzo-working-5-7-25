# Trendzo Audio System

## Overview

The Trendzo Audio System provides a seamless audio experience across the application, handling everything from sound playback to user collections and template sound integration. This system follows the Unicorn UX principles to ensure an intuitive and delightful user experience.

## Architecture

The audio system is built with a centralized state management approach using React Context, with specialized hooks providing targeted functionality for different use cases.

### Core Components

1. **AudioContext & AudioProvider**
   - Central state management for all audio functionality
   - Manages the audio element, playback state, and user collections
   - Provides methods for controlling playback and managing audio state

2. **GlobalAudioPlayer**
   - Main entry point for audio playback UI
   - Dynamically renders either the MiniPlayer or FullPlayer based on state
   - Should be included once in the application's root layout

3. **MiniPlayer**
   - Compact player that appears at the bottom of the screen
   - Shows essential controls and current sound information
   - Follows the "Invisible Interface" principle by staying out of the way

4. **FullPlayer**
   - Expanded player with advanced controls and visualizations
   - Includes waveform visualization and additional playback options
   - Shows recent sounds to improve user workflow

5. **SoundButton**
   - Reusable button component for playing sounds throughout the app
   - Supports multiple variants for different UI contexts
   - Shows playback state and allows quick access to sound controls

### Hooks

1. **useAudio**
   - Direct access to the audio context and all its methods
   - Use when you need full control over the audio system

2. **useSound**
   - Manages individual sounds, simplifying interaction with specific sounds
   - Provides sound-specific state and methods
   - Ideal for components that work with a single sound

3. **useSoundCollection**
   - Handles collections of sounds such as favorites and recently played
   - Provides filtering, searching, and collection management
   - Use for building UI that displays multiple sounds

4. **useTemplateSound**
   - Links templates with sounds, creating a connection between them
   - Handles loading, updating, and playing template-specific sounds
   - Use in template editing and playback workflows

## Features

- **Consistent Sound Playback**: Play sounds seamlessly across the entire application
- **Sound History**: Track recently played sounds for quick access
- **Favorites**: Allow users to mark and quickly access favorite sounds
- **Volume & Playback Controls**: Comprehensive controls for sound playback
- **Premium Features**: Support for advanced features like trimming and waveform visualization
- **Local Storage**: Persistent user preferences and sound collections
- **Template Integration**: Connect sounds with templates for synchronized experiences

## Usage Examples

### Basic Audio Playback

```tsx
import { useAudio } from '@/lib/contexts/AudioContext';

function MyComponent() {
  const { loadSound, play, pause } = useAudio();
  
  const handlePlaySound = (sound) => {
    loadSound(sound);
    play();
  };
  
  return (
    <button onClick={() => handlePlaySound(mySoundObject)}>
      Play Sound
    </button>
  );
}
```

### Using the SoundButton Component

```tsx
import SoundButton from '@/components/audio/SoundButton';

function SoundList({ sounds }) {
  return (
    <div>
      {sounds.map(sound => (
        <SoundButton 
          key={sound.id}
          sound={sound}
          variant="inline"
          showFavorite={true}
        />
      ))}
    </div>
  );
}
```

### Working with Sound Collections

```tsx
import { useSoundCollection } from '@/lib/hooks/useSoundCollection';

function FavoritesList() {
  const { sounds, isEmpty, toggleFavorite } = useSoundCollection('favorites');
  
  if (isEmpty) {
    return <p>No favorite sounds yet</p>;
  }
  
  return (
    <div>
      {sounds.map(sound => (
        <div key={sound.id}>
          <h3>{sound.title}</h3>
          <button onClick={() => toggleFavorite(sound)}>
            Remove from favorites
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Template Sound Integration

```tsx
import { useTemplateSound } from '@/lib/hooks/useTemplateSound';

function TemplateEditor({ templateId }) {
  const { 
    templateSound, 
    isLoading, 
    updateTemplateSound,
    playTemplateSound 
  } = useTemplateSound(templateId);
  
  return (
    <div>
      <h2>Template Sound</h2>
      {isLoading ? (
        <p>Loading sound...</p>
      ) : templateSound ? (
        <div>
          <p>{templateSound.title}</p>
          <button onClick={playTemplateSound}>Play</button>
          <button onClick={() => updateTemplateSound(null)}>Remove</button>
        </div>
      ) : (
        <p>No sound selected</p>
      )}
    </div>
  );
}
```

## Implementation Considerations

1. **Performance**: The audio system uses React's context with memoization to prevent unnecessary re-renders
2. **Accessibility**: All audio controls are accessible and include proper ARIA attributes
3. **Mobile Support**: The audio interface is responsive and works well on mobile devices
4. **Error Handling**: Comprehensive error handling for failed loads and unsupported formats
5. **Testing**: Components and hooks are designed for easy unit testing

## Premium Features

The audio system supports premium features that can be enabled or disabled based on the user's subscription:

- **Waveform Visualization**: Visual representation of the audio waveform
- **Audio Trimming**: Ability to set start and end points for sounds
- **Advanced Sound Analytics**: Insights into sound performance and usage
- **Enhanced Sound Library**: Access to premium sound collections

## Demo Page

A comprehensive demo page showcasing all audio functionality is available at `/sound-demo`. This page demonstrates:

- Sound playback controls
- Favorites functionality
- Recent sounds tracking
- Different player modes
- Premium features (with toggle)

## Conclusion

The Trendzo Audio System provides a robust foundation for all audio-related functionality in the application. By following consistent patterns and principles, it ensures a cohesive and delightful user experience when working with sounds. 