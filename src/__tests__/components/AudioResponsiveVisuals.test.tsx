import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioResponsiveVisuals from '@/components/audiovisual/AudioResponsiveVisuals';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';

// Mock window.AudioContext
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

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  callback(0);
  return 0;
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = jest.fn();

// Mock window.innerWidth and innerHeight
Object.defineProperty(window, 'innerWidth', { value: 1024 });
Object.defineProperty(window, 'innerHeight', { value: 768 });

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('AudioResponsiveVisuals', () => {
  const renderComponent = (props: any = {}) => {
    const defaultProps = {
      audioUrl: 'https://example.com/audio.mp3',
      isPlaying: false,
      currentTime: 0,
      duration: 60,
      visualMode: 'particles',
      intensity: 5,
      responsive: true,
      className: 'test-class',
    };
    
    return render(
      <AudioVisualProvider>
        <AudioResponsiveVisuals {...defaultProps} {...props}>
          <div data-testid="child-content">Test Content</div>
        </AudioResponsiveVisuals>
      </AudioVisualProvider>
    );
  };
  
  test('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
  
  test('applies provided className', () => {
    renderComponent({ className: 'custom-class' });
    const container = screen.getByTestId('child-content').parentElement;
    expect(container).toHaveClass('custom-class');
  });
  
  test('renders different visual modes', () => {
    const { rerender } = renderComponent({ visualMode: 'particles' });
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    
    rerender(
      <AudioVisualProvider>
        <AudioResponsiveVisuals
          audioUrl="https://example.com/audio.mp3"
          visualMode="waves"
          intensity={5}
        >
          <div data-testid="child-content">Test Content</div>
        </AudioResponsiveVisuals>
      </AudioVisualProvider>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    
    rerender(
      <AudioVisualProvider>
        <AudioResponsiveVisuals
          audioUrl="https://example.com/audio.mp3"
          visualMode="shapes"
          intensity={5}
        >
          <div data-testid="child-content">Test Content</div>
        </AudioResponsiveVisuals>
      </AudioVisualProvider>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    
    rerender(
      <AudioVisualProvider>
        <AudioResponsiveVisuals
          audioUrl="https://example.com/audio.mp3"
          visualMode="pulse"
          intensity={5}
        >
          <div data-testid="child-content">Test Content</div>
        </AudioResponsiveVisuals>
      </AudioVisualProvider>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
  
  test('adjusts to different intensity levels', () => {
    const { rerender } = renderComponent({ intensity: 1 });
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    
    rerender(
      <AudioVisualProvider>
        <AudioResponsiveVisuals
          audioUrl="https://example.com/audio.mp3"
          visualMode="particles"
          intensity={10}
        >
          <div data-testid="child-content">Test Content</div>
        </AudioResponsiveVisuals>
      </AudioVisualProvider>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
  
  test('handles sound object correctly', () => {
    const sound = {
      id: 'test-sound',
      title: 'Test Sound',
      url: 'https://example.com/audio.mp3',
      artist: 'Test Artist',
      duration: 60,
    };
    
    renderComponent({ sound, audioUrl: undefined });
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  test('handles no audio source gracefully', () => {
    renderComponent({ audioUrl: undefined });
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
}); 