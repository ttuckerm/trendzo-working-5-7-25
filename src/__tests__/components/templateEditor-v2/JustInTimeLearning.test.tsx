import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JustInTimeLearning } from '../../../components/templateEditor-v2/JustInTimeLearning';
import { TemplateEditorProvider } from '../../../components/templateEditor-v2/TemplateEditorContext';

// Mock user behavior tracking
jest.mock('../../../lib/analytics/userBehavior', () => ({
  trackUserInteraction: jest.fn(),
  getUserFeatureUsage: jest.fn().mockReturnValue({
    basicFeaturesUsageCount: 5,
    advancedFeaturesAttempts: 2,
    timeSpentInEditor: 3600, // 1 hour
    completedTutorials: ['basic', 'text'],
  }),
  identifyStruggle: jest.fn().mockImplementation((feature) => {
    // Simulate user struggling with specific features
    return feature === 'animations' || feature === 'layering';
  }),
}));

// Mock tier system
jest.mock('../../../lib/utils/userTier', () => ({
  getUserTier: jest.fn().mockReturnValue('free'),
  isTierFeatureAvailable: jest.fn().mockImplementation((tier, feature) => {
    if (tier === 'free' && feature === 'basicFeatures') return true;
    if (tier === 'free' && feature === 'advancedFeatures') return false;
    if (tier === 'premium' && feature === 'advancedFeatures') return true;
    return false;
  }),
}));

// Mock trend data service
jest.mock('../../../lib/services/trendDataService', () => ({
  getTrendingTemplateData: jest.fn().mockResolvedValue({
    topAnimations: ['bounce', 'fade-in-up', 'wave'],
    popularColors: ['#FF5733', '#33FF57', '#3357FF'],
    effectiveFonts: ['Bebas Neue', 'Montserrat', 'Playfair Display'],
  }),
}));

describe('JustInTimeLearning', () => {
  const defaultProps = {
    currentContext: {
      selectedElement: {
        id: 'element-1',
        type: 'text',
      },
      currentAction: 'editing',
      activePanel: 'properties',
    },
    onHelpRequested: jest.fn(),
    onFeatureIntroduced: jest.fn(),
    onTutorialComplete: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders help tooltips for features user is struggling with', async () => {
    render(<JustInTimeLearning {...defaultProps} />);
    
    // Simulate user interacting with animations panel
    fireEvent.mouseEnter(screen.getByTestId('animations-panel'));
    
    // Should show help tooltip for animations since user is struggling with it
    await waitFor(() => {
      expect(screen.getByText(/need help with animations/i)).toBeInTheDocument();
    });
  });
  
  test('shows contextual suggestions based on user behavior', async () => {
    render(
      <JustInTimeLearning 
        {...defaultProps} 
        currentContext={{
          ...defaultProps.currentContext,
          currentAction: 'idle',
          timeInCurrentView: 30, // 30 seconds idle
        }}
      />
    );
    
    // Should show suggestions since user has been idle
    await waitFor(() => {
      expect(screen.getByText(/try this feature/i)).toBeInTheDocument();
    });
  });
  
  test('progressively introduces features based on user skill level', async () => {
    const userBehavior = require('../../../lib/analytics/userBehavior');
    
    // Mock user as having mastered basic features
    userBehavior.getUserFeatureUsage.mockReturnValueOnce({
      basicFeaturesUsageCount: 25, // High usage count
      advancedFeaturesAttempts: 0,
      timeSpentInEditor: 10800, // 3 hours
      completedTutorials: ['basic', 'text', 'images', 'layout'],
    });
    
    render(<JustInTimeLearning {...defaultProps} />);
    
    // Should suggest advanced features
    await waitFor(() => {
      expect(screen.getByText(/ready for advanced features/i)).toBeInTheDocument();
    });
    
    // Clicking the suggestion should call the onFeatureIntroduced callback
    await userEvent.click(screen.getByText(/ready for advanced features/i));
    expect(defaultProps.onFeatureIntroduced).toHaveBeenCalledWith('advancedAnimations');
  });
  
  test('tracks skill progression', async () => {
    const userBehavior = require('../../../lib/analytics/userBehavior');
    
    render(<JustInTimeLearning {...defaultProps} />);
    
    // Simulate completing a tutorial
    fireEvent.click(screen.getByTestId('complete-tutorial'));
    
    expect(defaultProps.onTutorialComplete).toHaveBeenCalled();
    expect(userBehavior.trackUserInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'tutorial_complete',
      })
    );
  });
  
  test('promotes premium features to free users at appropriate times', async () => {
    render(
      <JustInTimeLearning 
        {...defaultProps} 
        currentContext={{
          ...defaultProps.currentContext,
          selectedElement: {
            id: 'element-1',
            type: 'text',
            animations: [{ type: 'fade', duration: 1000 }],
          },
          currentAction: 'animating',
        }}
      />
    );
    
    // Should show premium upgrade suggestion when user reaches limits of free features
    await waitFor(() => {
      expect(screen.getByText(/unlock advanced animations/i)).toBeInTheDocument();
    });
  });
  
  test('provides educational tooltips with trend data', async () => {
    render(
      <JustInTimeLearning 
        {...defaultProps} 
        currentContext={{
          ...defaultProps.currentContext,
          selectedElement: {
            id: 'element-1',
            type: 'text',
          },
          currentAction: 'styling',
        }}
      />
    );
    
    // Hover over the trend insights area
    fireEvent.mouseEnter(screen.getByTestId('trend-insights'));
    
    // Should show tooltip with trending data
    await waitFor(() => {
      expect(screen.getByText(/trending fonts/i)).toBeInTheDocument();
      expect(screen.getByText(/Bebas Neue/i)).toBeInTheDocument();
    });
  });
  
  test('adapts help based on user tier', async () => {
    const userTier = require('../../../lib/utils/userTier');
    
    // First render with free tier
    const { rerender } = render(<JustInTimeLearning {...defaultProps} />);
    
    // Should show tier-appropriate help
    expect(screen.getByText(/free tier tips/i)).toBeInTheDocument();
    
    // Now update to premium tier
    userTier.getUserTier.mockReturnValue('premium');
    
    rerender(<JustInTimeLearning {...defaultProps} />);
    
    // Should show premium tier help
    await waitFor(() => {
      expect(screen.getByText(/premium tier tips/i)).toBeInTheDocument();
    });
  });
  
  test('maintains user learning state between sessions', async () => {
    // Mock local storage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock stored learning state
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      lastSession: Date.now() - 86400000, // 1 day ago
      completedLessons: ['basic', 'text'],
      skillLevel: 'intermediate',
      recommendedNextFeatures: ['animations', 'effects'],
    }));
    
    render(<JustInTimeLearning {...defaultProps} />);
    
    // Should load previous learning state and show appropriate recommendations
    await waitFor(() => {
      expect(screen.getByText(/continue your learning/i)).toBeInTheDocument();
      expect(screen.getByText(/animations/i)).toBeInTheDocument();
    });
  });
}); 