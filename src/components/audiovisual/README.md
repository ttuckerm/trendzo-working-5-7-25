# Audio-Visual Experience Framework Components

This directory contains the components that make up the Audio-Visual Experience Framework for the TikTok Template Tracker platform. The framework creates a seamless integration of sound, music, and visual elements across the platform, following the Unicorn UX/UI principles.

## Core Components

### AudioVisualSynchronizer

The `AudioVisualSynchronizer` component synchronizes audio playback with visual elements, automatically triggering visual changes at precise moments.

**Usage:**
```tsx
<AudioVisualSynchronizer
  sound={mySound}
  showControls={true}
  onPlayPauseChange={(isPlaying) => console.log('Playing:', isPlaying)}
  onTimeUpdate={(time) => console.log('Current time:', time)}
>
  <div>
    {/* Your content here */}
  </div>
</AudioVisualSynchronizer>
```

### WaveformVisualizer

The `WaveformVisualizer` component displays an audio waveform with playback position indication.

**Usage:**
```tsx
<WaveformVisualizer
  sound={mySound}
  isPlaying={isPlaying}
  currentTime={currentTime}
  duration={mySound.duration}
  height={100}
/>
```

### AudioResponsiveVisuals

The `AudioResponsiveVisuals` component creates dynamic visual effects that respond to audio characteristics.

**Usage:**
```tsx
<AudioResponsiveVisuals
  sound={mySound}
  isPlaying={isPlaying}
  currentTime={currentTime}
  duration={mySound.duration}
  visualMode="particles"
  intensity={5}
>
  <div>
    {/* Your content here will appear on top of the visuals */}
  </div>
</AudioResponsiveVisuals>
```

### AudioVisualDemo

The `AudioVisualDemo` component demonstrates the capabilities of the Audio-Visual framework, including synchronization, emotional tone mapping, and responsive visuals.

**Usage:**
```tsx
<AudioVisualProvider>
  <AudioVisualDemo />
</AudioVisualProvider>
```

## Demo Pages

Two demo pages are available to explore the framework:

1. `/audio-visual-demo` - Comprehensive demonstration of all features
2. `/audio-visual-test` - Simpler test page for individual components

## Implementing the Framework

To use the Audio-Visual Experience Framework in your application:

1. Ensure that `AudioVisualProvider` is available in the component tree
2. Use the appropriate components based on your needs
3. Connect the components together by sharing state (isPlaying, currentTime, etc.)

All components follow the Unicorn UX/UI principles:
- **Invisible Interface**: Technical complexity is hidden behind intuitive interfaces
- **Emotional Design**: Visuals reflect the emotional qualities of the sound
- **Contextual Intelligence**: The system anticipates user needs
- **Progressive Disclosure**: Features are revealed only when needed
- **Sensory Harmony**: Audio and visual elements work together seamlessly

## Core Principles

This framework implements five core Unicorn UX/UI principles:

1. **Invisible Interface** - Technical complexity is hidden, allowing users to focus on the experience rather than the controls.
2. **Emotional Design** - Visual and audio elements are mapped to evoke specific emotional responses.
3. **Contextual Intelligence** - The system adapts audio-visual elements based on content context.
4. **Progressive Disclosure** - Advanced functionality is revealed naturally when needed.
5. **Sensory Harmony** - Audio and visual elements work together to create a cohesive experience.

## Key Components

### Core Context

- **AudioVisualContext** - The central state management system for audio-visual experiences.
- **AudioVisualProvider** - Provider component that manages audio-visual state throughout the application.
- **useAudioVisual** - Custom hook for accessing audio-visual context functionality.

### Audio Analysis

- **useBeatDetection** - Hook for analyzing audio files to detect beats, BPM, and rhythmic patterns.
- **useEmotionalToneMapping** - Hook for mapping audio characteristics to emotional tones.
- **audioProcessing.ts** - Utility functions for deep audio analysis.

## Usage Examples

### Basic Audio-Visual Synchronization

```tsx
import { useAudioVisual } from '@/lib/contexts/audiovisual/AudioVisualContext';
import AudioVisualSynchronizer from '@/components/audiovisual/AudioVisualSynchronizer';

function BasicExample({ sound }) {
  const audioVisual = useAudioVisual();
  
  return (
    <AudioVisualSynchronizer
      sound={sound}
      showControls={true}
      autoPlay={false}
      loop={true}
    >
      <div className="content">
        <h2>This content will be synchronized with the audio</h2>
        <p>Visual elements can respond to beats and emotional tone</p>
      </div>
    </AudioVisualSynchronizer>
  );
}
```

### Beat-Responsive Visuals

```tsx
import { useState } from 'react';
import AudioResponsiveVisuals from '@/components/audiovisual/AudioResponsiveVisuals';

function ResponsiveVisualsExample({ sound }) {
  const [visualMode, setVisualMode] = useState('particles');
  const [intensity, setIntensity] = useState(5);
  
  return (
    <div>
      <div className="controls">
        <select value={visualMode} onChange={e => setVisualMode(e.target.value)}>
          <option value="particles">Particles</option>
          <option value="shapes">Shapes</option>
          <option value="waves">Waves</option>
          <option value="pulse">Pulse</option>
        </select>
        
        <input 
          type="range" 
          min="1" 
          max="10" 
          value={intensity}
          onChange={e => setIntensity(Number(e.target.value))}
        />
      </div>
      
      <AudioResponsiveVisuals
        sound={sound}
        visualMode={visualMode}
        intensity={intensity}
        className="h-[300px]"
      >
        <div className="content">
          <h2>Content with responsive background</h2>
        </div>
      </AudioResponsiveVisuals>
    </div>
  );
}
```

### Audio Waveform Visualization

```tsx
import WaveformVisualizer from '@/components/audiovisual/WaveformVisualizer';

function WaveformExample({ audioUrl, currentTime, duration, isPlaying }) {
  const handleSeek = (time) => {
    // Handle seeking logic
  };
  
  return (
    <WaveformVisualizer
      audioUrl={audioUrl}
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      height={80}
      showBeats={true}
      onSeek={handleSeek}
      responsive={true}
    />
  );
}
```

## Integration with Template Editor

The Audio-Visual Experience Framework integrates seamlessly with the TikTok Template Editor:

1. **Template-Sound Pairing** - Match templates with appropriate sounds based on emotional tone.
2. **Beat-Synchronized Animations** - Automatically sync animations with music beats.
3. **Audio-Visual Harmony Scoring** - Evaluate and suggest improvements for template-sound combinations.
4. **Music-Responsive Visual Elements** - Create visual elements that respond to music energy.
5. **Audio Timeline Integration** - Edit templates with audio timeline visualizations.

## Multi-Sensory User Profiles

The framework builds and refines multi-sensory preference profiles:

- Tracks user preferences for audio-visual combinations
- Learns patterns without explicit configuration
- Delivers time-aware suggestions matching creative energy patterns
- Maintains preference continuity across sessions

## Technical Implementation Details

### Music-Visual Synchronization

The framework uses the Web Audio API for advanced audio analysis:

- Beat detection extracts timing information from audio files
- Emotional tone analysis maps audio characteristics to visual styles
- Adaptive visualizations respond to music tempo and energy
- Frame-accurate synchronization ensures perfect timing

### Intelligent Asset Preloading

For optimal performance, the framework includes:

- Prediction system for likely audio-visual combinations
- Background loading for instant multi-sensory previews
- Graceful degradation for challenging network conditions
- Optimized caching strategies for frequently used pairs

### Cross-Browser Compatibility

The framework is built with broad browser compatibility in mind:

- Falls back to simpler visualizations on less capable browsers
- Uses feature detection to enable/disable advanced features
- Provides consistent behavior across modern browsers
- Degrades gracefully on mobile devices

## Roadmap

Future enhancements planned for the framework:

1. Advanced beat detection with machine learning
2. Audio fingerprinting for exact musical recognition
3. Enhanced emotional mapping using spectral analysis
4. 3D audio-visual experiences
5. API for third-party extensions
6. Performance optimizations for mobile devices

## Contributing

To contribute to the Audio-Visual Experience Framework:

1. Follow the established coding patterns and conventions
2. Maintain the Unicorn UX/UI principles in all new components
3. Add comprehensive tests for new functionality
4. Document new features and components
5. Consider performance implications, especially for mobile devices 