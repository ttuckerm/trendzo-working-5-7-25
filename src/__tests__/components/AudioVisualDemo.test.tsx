import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioVisualDemo from '@/components/audiovisual/AudioVisualDemo';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';

// Mock window.AudioContext since it's not available in test environment
class MockAudioContext {
  createAnalyser = jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 0,
    frequencyBinCount: 0,
    getByteFrequencyData: jest.fn(),
  });
  createMediaElementSource = jest.fn().mockReturnValue({
    connect: jest.fn(),
  });
  destination = {};
}

window.AudioContext = MockAudioContext as any;
window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();
window.HTMLMediaElement.prototype.load = jest.fn();

// Mock the components used by AudioVisualDemo
jest.mock('@/components/audiovisual/AudioResponsiveVisuals', () => {
  return function MockAudioResponsiveVisuals({ children, ...props }: any) {
    return <div data-testid="audio-responsive-visuals" {...props}>{children}</div>;
  };
});

jest.mock('@/components/audiovisual/WaveformVisualizer', () => {
  return function MockWaveformVisualizer(props: any) {
    return <div data-testid="waveform-visualizer" {...props} />;
  };
});

jest.mock('@/components/audiovisual/AudioVisualSynchronizer', () => {
  return function MockAudioVisualSynchronizer({ children, ...props }: any) {
    return <div data-testid="audio-visual-synchronizer" {...props}>{children}</div>;
  };
});

jest.mock('@/lib/hooks/audiovisual/useEmotionalToneMapping', () => {
  return jest.fn().mockReturnValue({
    toneMapping: {
      matchedTone: {
        id: 'energetic',
        name: 'Energetic',
        colorScheme: ['#ff7b00', '#ff9500', '#ffb700'],
        animationStyle: 'bounce',
        visualIntensity: 8
      },
      confidence: 0.8,
      alternativeTones: [],
      characteristics: {
        tempo: 120,
        energy: 0.8,
        valence: 0.7,
        danceability: 0.8,
      }
    },
    loading: false,
    error: null,
    refreshMapping: jest.fn()
  });
});

describe('AudioVisualDemo', () => {
  const renderComponent = (props = {}) => {
    return render(
      <AudioVisualProvider>
        <AudioVisualDemo {...props} />
      </AudioVisualProvider>
    );
  };

  test('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Audio-Visual Experience Demo')).toBeInTheDocument();
  });

  test('displays tabs correctly', () => {
    renderComponent();
    expect(screen.getByRole('tab', { name: /synchronization/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /emotional tone/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /responsive visuals/i })).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    renderComponent();
    
    // Click on Emotional Tone tab
    fireEvent.click(screen.getByRole('tab', { name: /emotional tone/i }));
    expect(await screen.findByText('Current Emotional Tone')).toBeInTheDocument();
    
    // Click on Responsive Visuals tab
    fireEvent.click(screen.getByRole('tab', { name: /responsive visuals/i }));
    expect(await screen.findByText('Visual Mode')).toBeInTheDocument();
  });

  test('changes sound selection', async () => {
    renderComponent();
    
    // Open sound selector dropdown
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Wait for dropdown to appear and select a different sound
    await waitFor(() => {
      const calmOption = screen.getByText('Calm Piano - Demo Artist');
      fireEvent.click(calmOption);
    });
    
    // Should remain stable after selection
    expect(screen.getByText('Audio-Visual Experience Demo')).toBeInTheDocument();
  });

  test('shows proper audio-visual elements', () => {
    renderComponent();
    expect(screen.getByTestId('audio-visual-synchronizer')).toBeInTheDocument();
  });
}); 