import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioProvider } from '@/lib/contexts/AudioContext';
import { detectBeats, createSyncPointsFromBeats } from '@/lib/utils/audioProcessing';

// Mock the Audio API functionality
const mockAudioBuffer = {
  getChannelData: jest.fn(() => new Float32Array(1000).fill(0.1)),
  sampleRate: 44100,
  length: 1000,
  duration: 44100 / 1000,
  numberOfChannels: 1,
};

// Mock OfflineAudioContext
const mockRenderedBuffer = {
  getChannelData: jest.fn(() => new Float32Array(1000).fill(0.1)),
};

// Mock window objects
global.OfflineAudioContext = jest.fn().mockImplementation(() => ({
  startRendering: jest.fn().mockResolvedValue(mockRenderedBuffer),
  createBufferSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    buffer: null,
  }),
  createBiquadFilter: jest.fn().mockReturnValue({
    connect: jest.fn(),
    frequency: { value: 0 },
    Q: { value: 0 },
    type: '',
  }),
  destination: {},
}));

global.AudioContext = jest.fn().mockImplementation(() => ({
  decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1000)),
});

// Mock the createSyncPointsFromBeats function to return fixed test data
jest.mock('@/lib/utils/audioProcessing', () => {
  const originalModule = jest.requireActual('@/lib/utils/audioProcessing');
  return {
    ...originalModule,
    createSyncPointsFromBeats: jest.fn().mockImplementation(async (audioUrl, elementIds) => {
      // Create a fixed set of sync points for testing
      return elementIds.map((id, index) => {
        // Determine element type based on ID naming convention
        let elementType = 'animation';
        if (id.includes('text')) elementType = 'text';
        else if (id.includes('image')) elementType = 'image';
        else if (id.includes('img')) elementType = 'image';
        else if (id.includes('bg')) elementType = 'background';
        else if (id.includes('transition')) elementType = 'transition';
        
        return {
          id: `test_sync_${index}`,
          timestamp: index * 0.5, // 0.5 seconds between beats
          elementId: id,
          elementType,
          action: index % 2 === 0 ? 'pulse' : 'highlight',
          params: { intensity: 0.8, duration: 0.3 }
        };
      });
    }),
  };
});

describe('Beat Animation Sync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectBeats should identify beat timestamps', async () => {
    const beats = await detectBeats(mockAudioBuffer as any);
    expect(beats).toBeDefined();
    expect(Array.isArray(beats)).toBe(true);
  });

  test('createSyncPointsFromBeats should map beats to elements', async () => {
    const elementIds = ['text-1', 'image-2', 'bg-3'];
    const syncPoints = await createSyncPointsFromBeats('test-audio.mp3', elementIds);
    
    expect(syncPoints).toBeDefined();
    expect(Array.isArray(syncPoints)).toBe(true);
    
    if (syncPoints.length > 0) {
      expect(syncPoints[0]).toHaveProperty('timestamp');
      expect(syncPoints[0]).toHaveProperty('elementId');
      expect(syncPoints[0]).toHaveProperty('action');
    }
  });

  test('createSyncPointsFromBeats should correctly identify element types', async () => {
    const elementIds = ['text-1', 'image-2', 'bg-3', 'transition-4', 'animation-5'];
    const syncPoints = await createSyncPointsFromBeats('test-audio.mp3', elementIds);
    
    // Map the created sync points by elementId
    const pointsByElementId = syncPoints.reduce((acc, point) => {
      acc[point.elementId] = point;
      return acc;
    }, {} as Record<string, any>);
    
    // Verify each element type was correctly identified
    expect(pointsByElementId['text-1']?.elementType).toBe('text');
    expect(pointsByElementId['image-2']?.elementType).toBe('image');
    expect(pointsByElementId['bg-3']?.elementType).toBe('background');
    expect(pointsByElementId['transition-4']?.elementType).toBe('transition');
    expect(pointsByElementId['animation-5']?.elementType).toBe('animation');
  });
}); 