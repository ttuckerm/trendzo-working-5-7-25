# Global Audio Controller

The Global Audio Controller is a centralized system for managing audio playback throughout the application. It provides a persistent player UI that allows users to continue listening to audio while navigating between different parts of the application.

## Key Features

- **Single Instance Audio Controller**: Manages all audio playback through a unified controller
- **Persistent Player UI**: Mini player that stays visible while browsing the app
- **Background Playback**: Continue listening while navigating between pages
- **State Synchronization**: All components share the same audio state
- **Expandable Interface**: Toggle between mini and full player views
- **Context-Aware Behavior**: Adapts to the current app context

## Components

The Global Audio Controller consists of these main components:

1. **AudioContext**: Context provider that manages the global audio state
2. **GlobalAudioPlayer**: Wrapper that renders either MiniPlayer or FullPlayer
3. **MiniPlayer**: Compact player with basic controls
4. **FullPlayer**: Expanded player with advanced controls and visualizations

## Usage

### Adding to a Layout

The Global Audio Controller is already set up in the main application providers:

```tsx
// src/app/providers.tsx
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // ...other providers
    <AudioProvider>
      {children}
      <GlobalAudioPlayer />
    </AudioProvider>
    // ...other providers
  );
}
```

### Playing Audio from Components

To play audio from any component:

```tsx
import { useAudio } from '@/lib/contexts/AudioContext';
import { Sound } from '@/lib/types/audio';

function MyComponent() {
  const { loadSound, play } = useAudio();
  
  const handlePlaySound = (sound: Sound) => {
    loadSound(sound);
    play();
  };
  
  return (
    <button onClick={() => handlePlaySound(mySound)}>
      Play Sound
    </button>
  );
}
```

### Advanced Features

The AudioContext provides many more functions for controlling playback:

- `togglePlay()`: Toggle play/pause state
- `seek(time)`: Seek to a specific position
- `setVolume(volume)`: Change volume (0-1)
- `toggleMute()`: Toggle mute state
- `setLoop(loop)`: Toggle loop mode
- `expandPlayer()`: Show the full player
- `collapsePlayer()`: Minimize to the mini player
- `addToFavorites(sound)`: Add a sound to favorites

## Demo

A complete demo of the Global Audio Controller is available at `/sounds`. This page showcases all audio components and their interactions with the global controller.

## Implementation Details

- Uses a single HTML `<audio>` element managed by the AudioContext
- State persistence between page navigations
- Responsive design that works on all device sizes
- Keyboard shortcuts for common actions
- Background playback capabilities 