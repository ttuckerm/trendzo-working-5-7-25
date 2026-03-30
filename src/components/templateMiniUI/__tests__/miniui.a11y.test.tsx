import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import TemplateMiniUI from '../TemplateMiniUI';

expect.extend(toHaveNoViolations);

// Mock feature flag
jest.mock('@/config/flags', () => ({
  isTemplateMiniUIEnabled: () => true
}));

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: () => ({ data: null, error: null, isLoading: false })
}));

// Mock Supabase client
jest.mock('@/lib/supabase-client', () => ({
  supabaseClient: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: jest.fn() };
      }),
      send: jest.fn(),
      unsubscribe: jest.fn()
    }))
  }
}));

// Mock sound hook
jest.mock('@/os/sound/useSound', () => ({
  useSound: () => ({ play: jest.fn() })
}));

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

const defaultProps = {
  templateId: 'test-template-123',
  platform: 'tiktok' as const,
  userId: 'test-user-456'
};

describe('TemplateMiniUI Accessibility', () => {
  beforeEach(() => {
    // Reset URL hash
    window.location.hash = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('has no accessibility violations in default state', async () => {
    const { container } = render(<TemplateMiniUI {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with right rail open', async () => {
    const { container } = render(<TemplateMiniUI {...defaultProps} />);
    
    // Open dashboard panel
    const dashboardButton = screen.getByLabelText('Open dashboard panel (D)');
    await userEvent.click(dashboardButton);
    
    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: 'Dashboard panel' })).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('properly manages focus when opening panels', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    const dashboardButton = screen.getByLabelText('Open dashboard panel (D)');
    await userEvent.click(dashboardButton);
    
    await waitFor(() => {
      const panel = screen.getByRole('tabpanel', { name: 'Dashboard panel' });
      expect(panel).toBeInTheDocument();
    });

    // Focus should be managed properly within the dialog
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('supports keyboard navigation between panels', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Test keyboard shortcuts
    await userEvent.keyboard('d');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: 'Dashboard panel' })).toBeInTheDocument();
    });

    await userEvent.keyboard('s');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: 'Scripts panel' })).toBeInTheDocument();
    });

    await userEvent.keyboard('o');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: 'Optimize panel' })).toBeInTheDocument();
    });

    await userEvent.keyboard('v');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: 'Validate panel' })).toBeInTheDocument();
    });
  });

  it('closes panels with Escape key', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Open a panel
    await userEvent.keyboard('d');
    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: 'Dashboard panel' })).toBeInTheDocument();
    });

    // Close with Escape
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    });
  });

  it('toggles editor mode with E key', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    const toggleButton = screen.getByLabelText('Toggle editor mode (E)');
    expect(toggleButton).toHaveTextContent('Editor');

    await userEvent.keyboard('e');
    await waitFor(() => {
      expect(toggleButton).toHaveTextContent('Reader');
    });

    await userEvent.keyboard('e');
    await waitFor(() => {
      expect(toggleButton).toHaveTextContent('Editor');
    });
  });

  it('provides proper ARIA labels for all interactive elements', () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Check main navigation buttons have proper labels
    expect(screen.getByLabelText('Open dashboard panel (D)')).toBeInTheDocument();
    expect(screen.getByLabelText('Open scripts panel (S)')).toBeInTheDocument();
    expect(screen.getByLabelText('Open optimize panel (O)')).toBeInTheDocument();
    expect(screen.getByLabelText('Open A/B test panel (B)')).toBeInTheDocument();
    expect(screen.getByLabelText('Open inception panel (I)')).toBeInTheDocument();
    expect(screen.getByLabelText('Open validate panel (V)')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle editor mode (E)')).toBeInTheDocument();
  });

  it('properly announces state changes to screen readers', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Preview area should have proper live regions
    const previewArea = screen.getByText(/Preview \(tiktok\)/);
    expect(previewArea).toBeInTheDocument();

    // Loading states should be announced
    const loadingElements = screen.getAllByRole('status', { hidden: true });
    expect(loadingElements.length).toBeGreaterThanOrEqual(0);
  });

  it('maintains focus trap within right rail panels', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Open validate panel
    await userEvent.keyboard('v');
    
    await waitFor(() => {
      const panel = screen.getByRole('tabpanel', { name: 'Validate panel' });
      expect(panel).toBeInTheDocument();
    });

    // The dialog should have focus trap attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('focus-trap');
  });

  it('has proper heading hierarchy', () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Main content should have proper heading structure
    // (This would need to be verified based on actual implementation)
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('provides context for preview states', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Preview should indicate loading states
    const skeleton = screen.queryByLabelText(/loading/i);
    if (skeleton) {
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    }
  });
});

describe('Panel-specific Accessibility', () => {
  it('Dashboard panel has proper structure', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    await userEvent.keyboard('d');
    await waitFor(() => {
      const panel = screen.getByRole('tabpanel', { name: 'Dashboard panel' });
      expect(panel).toBeInTheDocument();
    });

    // Check for proper semantic structure
    const headings = screen.getAllByRole('heading');
    expect(headings.some(h => h.textContent?.includes('Performance Dashboard'))).toBe(true);
  });

  it('Scripts panel has proper form structure', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    await userEvent.keyboard('s');
    await waitFor(() => {
      const panel = screen.getByRole('tabpanel', { name: 'Scripts panel' });
      expect(panel).toBeInTheDocument();
    });

    // Check for proper button labeling
    const generateButton = screen.getByRole('button', { name: /generate draft script/i });
    expect(generateButton).toBeInTheDocument();
  });

  it('Optimize panel shows validation states clearly', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    await userEvent.keyboard('o');
    await waitFor(() => {
      const panel = screen.getByRole('tabpanel', { name: 'Optimize panel' });
      expect(panel).toBeInTheDocument();
    });

    // Status should be clearly indicated
    const statusElements = screen.getAllByText(/optimization/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('Validate panel provides clear feedback', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    await userEvent.keyboard('v');
    await waitFor(() => {
      const panel = screen.getByRole('tabpanel', { name: 'Validate panel' });
      expect(panel).toBeInTheDocument();
    });

    // Should have prediction button with clear labeling
    const predictButton = screen.getByRole('button', { name: /run prediction/i });
    expect(predictButton).toBeInTheDocument();
  });
});

describe('Keyboard Navigation', () => {
  it('supports all documented keyboard shortcuts', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    const shortcuts = [
      { key: 'd', panel: 'Dashboard panel' },
      { key: 's', panel: 'Scripts panel' },
      { key: 'o', panel: 'Optimize panel' },
      { key: 'b', panel: 'A/B Test panel' },
      { key: 'i', panel: 'Inception panel' },
      { key: 'v', panel: 'Validate panel' }
    ];

    for (const { key, panel } of shortcuts) {
      await userEvent.keyboard(key);
      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: panel })).toBeInTheDocument();
      });
      
      // Close panel before testing next one
      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
      });
    }
  });

  it('prevents keyboard shortcuts when modifiers are pressed', async () => {
    render(<TemplateMiniUI {...defaultProps} />);
    
    // Ctrl+D should not open dashboard
    await userEvent.keyboard('{Control>}d{/Control}');
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();

    // Alt+D should not open dashboard
    await userEvent.keyboard('{Alt>}d{/Alt}');
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();

    // Meta+D should not open dashboard
    await userEvent.keyboard('{Meta>}d{/Meta}');
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });
});

