import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioProvider } from '@/lib/contexts/AudioContext';
import { TemplateEditorProvider } from '@/lib/contexts/TemplateEditorContext';
import TimelinesPanel from '@/components/templateEditor/panels/TimelinesPanel';
import BeatSyncController from '@/components/editor/BeatSyncController';

// Mock the essential context values
jest.mock('@/lib/contexts/AudioContext', () => ({
  ...jest.requireActual('@/lib/contexts/AudioContext'),
  useAudio: () => ({
    state: {
      currentSound: {
        id: 'test-sound-1',
        title: 'Test Sound',
        url: 'https://example.com/test-sound.mp3',
        duration: 30
      },
      isPlaying: false
    },
    actions: {
      selectSound: jest.fn(),
      playSound: jest.fn(),
      pauseSound: jest.fn()
    }
  })
}));

jest.mock('@/lib/contexts/TemplateEditorContext', () => ({
  ...jest.requireActual('@/lib/contexts/TemplateEditorContext'),
  useTemplateEditor: () => ({
    state: {
      template: {
        id: 'test-template-1',
        name: 'Test Template',
        sections: [
          {
            id: 'section-1',
            name: 'Intro Section',
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
        playing: false
      }
    },
    selectedSection: {
      id: 'section-1',
      name: 'Intro Section'
    },
    togglePlayback: jest.fn(),
    trackInteraction: jest.fn()
  })
}));

describe('Beat Sync Integration with Template Editor', () => {
  test('BeatSyncController is visible in the TimelinesPanel', () => {
    render(
      <AudioProvider>
        <TemplateEditorProvider>
          <TimelinesPanel />
        </TemplateEditorProvider>
      </AudioProvider>
    );
    
    // The BeatSyncController should be visible
    expect(screen.getByText('Beat Animation Sync')).toBeInTheDocument();
  });
  
  test('BeatSyncController shows correct UI elements', () => {
    render(
      <AudioProvider>
        <BeatSyncController />
      </AudioProvider>
    );
    
    // The controller should show the detect beats button
    expect(screen.getByText(/Detect Beats|Analyzing.../)).toBeInTheDocument();
    
    // The controller should show the clear sync button
    expect(screen.getByText('Clear Sync')).toBeInTheDocument();
  });
}); 