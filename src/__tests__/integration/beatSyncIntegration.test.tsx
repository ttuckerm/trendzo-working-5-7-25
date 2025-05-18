import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioProvider } from '@/lib/contexts/AudioContext';
import { EditorProvider } from '@/lib/contexts/EditorContext';
import EditorTimeline from '@/components/editor/EditorTimeline';
import BeatSyncController from '@/components/editor/BeatSyncController';
import { useBeatSyncAnimation } from '@/lib/hooks/useBeatSyncAnimation';

// Mock AudioContext
jest.mock('@/lib/contexts/AudioContext', () => {
  const originalModule = jest.requireActual('@/lib/contexts/AudioContext');
  const mockState = {
    currentSound: {
      id: 'test-sound-1',
      title: 'Test Sound',
      url: '/test-sound.mp3',
      playUrl: '/test-sound.mp3',
      duration: 30
    },
    isPlaying: false,
    playback: {
      currentTime: 0,
      volume: 0.8,
      loop: false
    }
  };
  
  return {
    ...originalModule,
    useAudio: () => ({
      state: mockState,
      play: jest.fn(),
      pause: jest.fn(),
      toggle: jest.fn(),
      setVolume: jest.fn(),
      isPlaying: false
    })
  };
});

// Mock EditorContext
jest.mock('@/lib/contexts/EditorContext', () => {
  const originalModule = jest.requireActual('@/lib/contexts/EditorContext');
  const mockState = {
    template: {
      id: 'test-template-1',
      name: 'Test Template',
      sections: [
        {
          id: 'section-1',
          name: 'Intro',
          type: 'intro',
          duration: 5,
          elements: [
            { id: 'text-1', type: 'text', content: 'Test Text' },
            { id: 'image-1', type: 'image', src: '/test-image.jpg' }
          ]
        }
      ]
    },
    ui: {
      selectedSectionId: 'section-1',
      currentTime: 0,
      playing: false
    }
  };
  
  return {
    ...originalModule,
    useEditor: () => ({
      state: mockState,
      addSection: jest.fn(),
      selectSection: jest.fn(),
      setCurrentTime: jest.fn(),
      togglePlayback: jest.fn(),
      updateElement: jest.fn()
    })
  };
});

// Mock useBeatSyncAnimation
jest.mock('@/lib/hooks/useBeatSyncAnimation', () => {
  return {
    useBeatSyncAnimation: jest.fn().mockReturnValue({
      syncPoints: [],
      isSyncing: false, 
      error: null,
      generateSyncPoints: jest.fn(),
      clearSyncPoints: jest.fn(),
      hasSyncPoints: false
    })
  };
});

describe('Beat Sync Animation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('BeatSyncController is visible in the timeline', async () => {
    render(
      <AudioProvider>
        <EditorProvider>
          <EditorTimeline />
        </EditorProvider>
      </AudioProvider>
    );
    
    // Check if Beat Sync button is visible
    const beatSyncButton = screen.getByText('Beat Sync');
    expect(beatSyncButton).toBeInTheDocument();
  });
  
  test('BeatSyncController can generate sync points', async () => {
    const mockGenerateSyncPoints = jest.fn();
    (useBeatSyncAnimation as jest.Mock).mockReturnValue({
      syncPoints: [],
      isSyncing: false,
      error: null,
      generateSyncPoints: mockGenerateSyncPoints,
      clearSyncPoints: jest.fn(),
      hasSyncPoints: false
    });
    
    render(<BeatSyncController />);
    
    // Expand the controller
    const beatSyncButton = screen.getByText('Beat Sync');
    fireEvent.click(beatSyncButton);
    
    // Click the Detect Beats button
    const detectBeatsButton = screen.getByText('Detect Beats');
    fireEvent.click(detectBeatsButton);
    
    // Check if generateSyncPoints was called
    expect(mockGenerateSyncPoints).toHaveBeenCalled();
  });
  
  test('BeatSyncController shows success message when sync points are created', async () => {
    (useBeatSyncAnimation as jest.Mock).mockReturnValue({
      syncPoints: [
        { id: 'sync-1', timestamp: 1.0, elementId: 'text-1', elementType: 'text', action: 'pulse' },
        { id: 'sync-2', timestamp: 2.0, elementId: 'image-1', elementType: 'image', action: 'highlight' }
      ],
      isSyncing: false,
      error: null,
      generateSyncPoints: jest.fn(),
      clearSyncPoints: jest.fn(),
      hasSyncPoints: true
    });
    
    render(<BeatSyncController />);
    
    // Expand the controller
    const beatSyncButton = screen.getByText('Beat Sync');
    fireEvent.click(beatSyncButton);
    
    // Check if success message is displayed
    const successMessage = screen.getByText('2 beat-synced animations ready');
    expect(successMessage).toBeInTheDocument();
  });
}); 