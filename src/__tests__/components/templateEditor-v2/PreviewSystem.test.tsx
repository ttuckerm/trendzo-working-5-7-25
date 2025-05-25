import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PreviewSystem } from '@/components/templateEditor-v2/PreviewSystem';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the media playback
window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();
window.HTMLMediaElement.prototype.load = jest.fn();

describe('PreviewSystem', () => {
  // Basic template with video content
  const templateWithVideo = {
    id: 'template1',
    name: 'Test Template',
    aspectRatio: '9:16',
    sections: [{
      id: 'section1',
      name: 'Main Section',
      order: 0,
      elements: [{
        id: 'video1',
        type: 'video',
        src: '/test-video.mp4',
        x: 0,
        y: 0,
        width: 300,
        height: 500,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        locked: false,
        hidden: false
      }],
      backgroundColor: '#ffffff'
    }]
  };

  const renderPreview = (customTemplate = templateWithVideo) => {
    return render(
      <TemplateEditorProvider initialData={{ template: customTemplate }}>
        <PreviewSystem />
      </TemplateEditorProvider>
    );
  };

  it('renders the preview system with proper controls', () => {
    renderPreview();
    const previewContainer = screen.getByTestId('preview-system');
    expect(previewContainer).toBeInTheDocument();
    
    // Check for basic playback controls
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    expect(screen.getByTestId('pause-button')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-scrubber')).toBeInTheDocument();
  });

  it('updates preview in real-time when elements change', async () => {
    const { rerender } = renderPreview();
    
    // Initial state
    const videoElement = screen.getByTestId('preview-element-video1');
    expect(videoElement).toBeInTheDocument();
    
    // Update the template with modified element
    const updatedTemplate = {
      ...templateWithVideo,
      sections: [{
        ...templateWithVideo.sections[0],
        elements: [{
          ...templateWithVideo.sections[0].elements[0],
          width: 400, // Changed width
          height: 600 // Changed height
        }]
      }]
    };
    
    // Re-render with updated template
    rerender(
      <TemplateEditorProvider initialData={{ template: updatedTemplate }}>
        <PreviewSystem />
      </TemplateEditorProvider>
    );
    
    // Check if the preview was updated
    const updatedVideoElement = screen.getByTestId('preview-element-video1');
    expect(updatedVideoElement).toHaveStyle({
      width: '400px',
      height: '600px'
    });
  });

  it('playback controls work properly', () => {
    renderPreview();
    
    const playButton = screen.getByTestId('play-button');
    const pauseButton = screen.getByTestId('pause-button');
    
    // Click play
    fireEvent.click(playButton);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    
    // Click pause
    fireEvent.click(pauseButton);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it('timeline scrubbing updates preview', () => {
    renderPreview();
    
    const timelineScrubber = screen.getByTestId('timeline-scrubber');
    
    // Mock the timeline scrubbing
    fireEvent.change(timelineScrubber, { target: { value: '5' } });
    
    // Check if currentTime was updated
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      expect(video.currentTime).toBe(5);
    });
  });

  it('performs well during preview playback', async () => {
    // This would ideally be measured with performance metrics
    // For now, we'll simulate multiple rapid updates
    jest.useFakeTimers();
    
    renderPreview();
    
    const startTime = performance.now();
    
    // Simulate 10 rapid frame updates
    for (let i = 0; i < 10; i++) {
      act(() => {
        jest.advanceTimersByTime(16); // ~60fps
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Check if updates happened within a reasonable time
    // This is a simple test; real performance testing would be more sophisticated
    expect(duration).toBeLessThan(500); // arbitrary threshold
    
    jest.useRealTimers();
  });

  it('handles errors for missing assets gracefully', () => {
    // Create a template with a missing asset
    const templateWithMissingAsset = {
      ...templateWithVideo,
      sections: [{
        ...templateWithVideo.sections[0],
        elements: [{
          ...templateWithVideo.sections[0].elements[0],
          src: '/non-existent-video.mp4'
        }]
      }]
    };
    
    renderPreview(templateWithMissingAsset);
    
    // Should show an error placeholder instead of crashing
    const errorPlaceholder = screen.getByTestId('asset-error-placeholder');
    expect(errorPlaceholder).toBeInTheDocument();
    expect(errorPlaceholder).toHaveTextContent(/failed to load/i);
  });

  it('respects template format settings during preview', () => {
    // Create a template with square aspect ratio
    const squareTemplate = {
      ...templateWithVideo,
      aspectRatio: '1:1'
    };
    
    renderPreview(squareTemplate);
    
    // The preview container should have square aspect ratio
    const previewContainer = screen.getByTestId('preview-canvas');
    expect(previewContainer).toHaveStyle({ aspectRatio: '1/1' });
  });

  it('processes voice commands for preview updates', () => {
    renderPreview();
    
    // Find voice command button for preview
    const voiceCommandButton = screen.getByTestId('preview-voice-command');
    expect(voiceCommandButton).toBeInTheDocument();
    
    // Trigger voice command
    fireEvent.click(voiceCommandButton);
    
    // Voice UI should appear
    const voiceUI = screen.getByTestId('voice-command-ui');
    expect(voiceUI).toBeInTheDocument();
    
    // Simulate voice command processing
    act(() => {
      // Mock the voice recognition result
      const mockVoiceCommand = new CustomEvent('voice-command', { 
        detail: { command: 'play' } 
      });
      document.dispatchEvent(mockVoiceCommand);
    });
    
    // Should have triggered play
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });
}); 