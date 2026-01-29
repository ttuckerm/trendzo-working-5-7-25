import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioVisualSynchronizer from '@/components/audiovisual/AudioVisualSynchronizer';
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

// Mock audio element
window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = jest.fn();
window.HTMLMediaElement.prototype.load = jest.fn();

describe('AudioVisualSynchronizer', () => {
  // Test sound
  const testSound = {
    id: 'test-sound',
    title: 'Test Sound',
    artist: 'Test Artist',
    url: 'https://example.com/test.mp3',
    duration: 180
  };
  
  const renderComponent = (props = {}) => {
    return render(
      <AudioVisualProvider>
        <AudioVisualSynchronizer 
          sound={testSound}
          showControls={true}
          {...props}
        >
          <div data-testid="test-content">Test Content</div>
        </AudioVisualSynchronizer>
      </AudioVisualProvider>
    );
  };
  
  test('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
  
  test('displays children content', () => {
    renderComponent();
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Content');
  });
  
  test('shows controls when showControls is true', () => {
    renderComponent({ showControls: true });
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
  
  test('does not show controls when showControls is false', () => {
    renderComponent({ showControls: false });
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument();
  });
  
  test('handles play and pause clicks', () => {
    renderComponent();
    
    // Get play button and click it
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    // HTML media element play should have been called
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    
    // Since play is mocked to immediately resolve, the button should now be a pause button
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    
    // HTML media element pause should have been called
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
  
  test('displays time information', () => {
    renderComponent();
    // Initial time should be 00:00 / [duration]
    expect(screen.getByText('00:00 / 03:00')).toBeInTheDocument();
  });
  
  test('handles undefined sound gracefully', () => {
    renderComponent({ sound: undefined });
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
  
  test('handles empty audio URL gracefully', () => {
    const emptySound = { ...testSound, url: '' };
    renderComponent({ sound: emptySound });
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
}); 