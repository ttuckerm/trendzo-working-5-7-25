import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoPreview } from '../../../components/templateEditor-v2/VideoPreview'; // Corrected path

// Mocking HTMLMediaElement.prototype.play and pause
beforeAll(() => {
  jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('VideoPreview', () => {
  const testSrc = "test.mp4";

  test('renders video element with correct src', () => {
    render(<VideoPreview src={testSrc} />);
    const videoElement = screen.getByRole('img'); // Video tag is often role 'img' or no specific role by default in RTL
    // A more reliable way to get video if role isn't set:
    // const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', testSrc);
  });

  test('applies width and height props', () => {
    render(<VideoPreview src={testSrc} width={300} height={200} />);
    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveAttribute('width', '300');
    expect(videoElement).toHaveAttribute('height', '200');
  });

  test('shows controls when controls prop is true', () => {
    render(<VideoPreview src={testSrc} controls={true} />);
    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveAttribute('controls');
  });

  test('shows controls when isSelected prop is true', () => {
    render(<VideoPreview src={testSrc} isSelected={true} />);
    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveAttribute('controls');
  });

  test('does not show controls by default', () => {
    render(<VideoPreview src={testSrc} />);
    const videoElement = document.querySelector('video');
    expect(videoElement).not.toHaveAttribute('controls');
  });

  test('sets autoplay, loop, muted attributes based on props', () => {
    render(<VideoPreview src={testSrc} autoplay={true} loop={true} muted={false} />);
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    expect(videoElement).toHaveAttribute('autoplay');
    expect(videoElement).toHaveAttribute('loop');
    expect(videoElement.muted).toBe(false); // Corrected check for muted property
  });

  test('is muted by default', () => {
    render(<VideoPreview src={testSrc} />);
    const videoElement = document.querySelector('video');
    expect(videoElement?.muted).toBe(true);
  });
  
  test('applies className prop', () => {
    const customClass = "my-custom-video-class";
    render(<VideoPreview src={testSrc} className={customClass} />);
    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveClass(customClass);
    expect(videoElement).toHaveClass('block'); // Default class
    expect(videoElement).toHaveClass('object-cover'); // Default class
  });

  // Testing useEffect behavior related to time updates is more complex
  // It requires mocking video events and properties like currentTime, readyState, duration

  test('sets currentTime to startTime on loadedmetadata', () => {
    const startTime = 5;
    render(<VideoPreview src={testSrc} startTime={startTime} />);
    const videoElement = document.querySelector('video') as HTMLVideoElement;

    // Mock readyState before firing event
    Object.defineProperty(videoElement, 'readyState', { value: 1, writable: true });
    act(() => {
      fireEvent(videoElement, new Event('loadedmetadata'));
    });
    expect(videoElement.currentTime).toBe(startTime);
  });

  // Test for endTime and loop behavior
  test('pauses and loops when currentTime reaches endTime if loop is true', () => {
    const startTime = 2;
    const endTime = 5;
    const onTimeUpdate = jest.fn();
    render(<VideoPreview src={testSrc} startTime={startTime} endTime={endTime} loop={true} onTimeUpdate={onTimeUpdate} />);
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const pauseSpy = jest.spyOn(videoElement, 'pause');
    const playSpy = jest.spyOn(videoElement, 'play');

    // Simulate video playing and reaching endTime
    act(() => {
      Object.defineProperty(videoElement, 'currentTime', { value: endTime, writable: true });
      fireEvent(videoElement, new Event('timeupdate'));
    });

    expect(pauseSpy).toHaveBeenCalled();
    expect(videoElement.currentTime).toBe(startTime); // Should reset to startTime
    expect(playSpy).toHaveBeenCalled();
    expect(onTimeUpdate).toHaveBeenCalledWith(endTime);
  });

  test('pauses and resets to startTime when currentTime reaches endTime if loop is false', () => {
    const startTime = 2;
    const endTime = 5;
    render(<VideoPreview src={testSrc} startTime={startTime} endTime={endTime} loop={false} />);
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const pauseSpy = jest.spyOn(videoElement, 'pause');
    const playSpy = jest.spyOn(videoElement, 'play');

    act(() => {
      Object.defineProperty(videoElement, 'currentTime', { value: endTime, writable: true });
      fireEvent(videoElement, new Event('timeupdate'));
    });

    expect(pauseSpy).toHaveBeenCalled();
    expect(videoElement.currentTime).toBe(startTime); // Resets to startTime
    expect(playSpy).not.toHaveBeenCalled(); // Should not replay if not looping
  });

  test('calls onLoadedData when video data is loaded', () => {
    const handleLoadedData = jest.fn();
    render(<VideoPreview src={testSrc} onLoadedData={handleLoadedData} />);
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    fireEvent(videoElement, new Event('loadeddata'));
    expect(handleLoadedData).toHaveBeenCalled();
  });

  test('calls onError when video encounters an error', () => {
    const handleError = jest.fn();
    render(<VideoPreview src={testSrc} onError={handleError} />);
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    fireEvent(videoElement, new Event('error'));
    expect(handleError).toHaveBeenCalled();
  });

}); 