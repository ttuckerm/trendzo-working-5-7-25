import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextAnimations } from '../../../components/templateEditor-v2/PropertyControls/TextAnimations';
import { TextAnimationEngine } from '../../../components/templateEditor-v2/TextAnimationEngine';
import { TemplateEditorProvider } from '../../../components/templateEditor-v2/TemplateEditorContext';

// Mock tier system
jest.mock('../../../lib/utils/userTier', () => ({
  getUserTier: jest.fn().mockReturnValue('premium'),
  isTierFeatureAvailable: jest.fn().mockImplementation((tier, feature) => {
    if (tier === 'free' && feature === 'basicTextAnimations') return true;
    if (tier === 'free' && feature === 'advancedTextAnimations') return false;
    if (tier === 'premium' && feature === 'advancedTextAnimations') return true;
    if (tier === 'premium' && feature === 'beatSyncedAnimations') return true;
    if (tier === 'platinum' && feature === 'aiKineticText') return true;
    return false;
  }),
}));

// Mock AI service
jest.mock('../../../lib/services/aiService', () => ({
  generateTextAnimationSuggestions: jest.fn().mockResolvedValue([
    { name: 'Trendy Bounce', keyframes: { /* animation data */ } },
    { name: 'Subtle Fade', keyframes: { /* animation data */ } },
  ]),
}));

// Mock audio analysis service
jest.mock('../../../lib/services/audioAnalysisService', () => ({
  detectBeats: jest.fn().mockResolvedValue([0.5, 1.2, 1.8, 2.4]),
  analyzeAudioTempo: jest.fn().mockResolvedValue({
    tempo: 120,
    beatDuration: 0.5,
  }),
}));

describe('TextAnimations Component', () => {
  const defaultProps = {
    text: 'Sample Text',
    animation: null,
    onChange: jest.fn(),
    userTier: 'premium',
    context: {
      templateType: 'trending',
      audioTrack: 'https://example.com/audio.mp3',
    },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders basic text animation controls', () => {
    render(<TextAnimations {...defaultProps} />);
    
    expect(screen.getByText(/text animations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/animation preset/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });
  
  test('renders AI-suggested animations for platinum users', () => {
    render(<TextAnimations {...defaultProps} userTier="platinum" />);
    
    expect(screen.getByText(/ai kinetic text/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate suggestions/i })).toBeInTheDocument();
  });
  
  test('restricts AI features for non-platinum users', () => {
    render(<TextAnimations {...defaultProps} userTier="premium" />);
    
    expect(screen.getByText(/ai kinetic text/i)).toBeInTheDocument();
    expect(screen.getByText(/upgrade to platinum/i)).toBeInTheDocument();
  });
  
  test('loads trending animation presets based on context', async () => {
    render(
      <TextAnimations 
        {...defaultProps} 
        context={{ templateType: 'trending', audioTrack: null }}
      />
    );
    
    const presetSelect = screen.getByLabelText(/animation preset/i);
    expect(presetSelect).toBeInTheDocument();
    
    // Trending presets should be loaded
    await waitFor(() => {
      expect(screen.getByText(/trending presets/i)).toBeInTheDocument();
    });
  });
  
  test('syncs animations with audio beats when enabled', async () => {
    render(
      <TextAnimations 
        {...defaultProps} 
        animation={{ 
          type: 'fade', 
          duration: 1000, 
          beatSync: true 
        }}
      />
    );
    
    expect(screen.getByLabelText(/sync with audio/i)).toBeChecked();
    
    // Check that beat detection is called
    await waitFor(() => {
      expect(require('../../../lib/services/audioAnalysisService').detectBeats).toHaveBeenCalled();
    });
  });
  
  test('calls onChange when animation settings are modified', async () => {
    render(<TextAnimations {...defaultProps} />);
    
    // Select a preset
    const presetSelect = screen.getByLabelText(/animation preset/i);
    await userEvent.selectOptions(presetSelect, 'bounce');
    
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ 
        type: 'bounce',
      })
    );
  });
  
  test('preview button shows animation preview', async () => {
    render(<TextAnimations {...defaultProps} />);
    
    const previewButton = screen.getByRole('button', { name: /preview/i });
    await userEvent.click(previewButton);
    
    // Preview container should be visible
    expect(screen.getByTestId('animation-preview')).toBeInTheDocument();
    expect(screen.getByTestId('animation-preview')).toHaveClass('animating');
  });
});

describe('TextAnimationEngine', () => {
  test('generates default animation for text element', () => {
    const element = {
      id: 'text-1',
      type: 'text',
      content: 'Test Content',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
    };
    
    const animation = TextAnimationEngine.generateDefaultAnimation(element);
    
    expect(animation).toEqual(expect.objectContaining({
      type: expect.any(String),
      duration: expect.any(Number),
      delay: expect.any(Number),
    }));
  });
  
  test('adjusts animation timing based on text length', () => {
    const shortElement = {
      id: 'text-1',
      type: 'text',
      content: 'Short',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
    };
    
    const longElement = {
      id: 'text-2',
      type: 'text',
      content: 'This is a much longer text that should have a different animation timing',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
    };
    
    const shortAnimation = TextAnimationEngine.generateDefaultAnimation(shortElement);
    const longAnimation = TextAnimationEngine.generateDefaultAnimation(longElement);
    
    // Longer text should have longer duration
    expect(longAnimation.duration).toBeGreaterThan(shortAnimation.duration);
  });
  
  test('syncs animation with audio beats', async () => {
    const element = {
      id: 'text-1',
      type: 'text',
      content: 'Beat Synced',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
    };
    
    const audioTrack = 'https://example.com/audio.mp3';
    const beats = [0.5, 1.2, 1.8, 2.4];
    
    const syncedAnimation = await TextAnimationEngine.syncWithAudio(element, audioTrack);
    
    expect(syncedAnimation).toEqual(expect.objectContaining({
      beatSync: true,
      beatPoints: expect.arrayContaining([expect.any(Number)]),
    }));
  });
  
  test('applies trending animation style based on context', () => {
    const element = {
      id: 'text-1',
      type: 'text',
      content: 'Trendy Text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
    };
    
    const context = {
      templateType: 'trending',
      trendCategory: 'dance',
    };
    
    const trendAnimation = TextAnimationEngine.applyTrendStyle(element, context);
    
    expect(trendAnimation).toEqual(expect.objectContaining({
      type: expect.any(String),
      trendCategory: 'dance',
    }));
  });
}); 