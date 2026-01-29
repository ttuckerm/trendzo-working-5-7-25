import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast, ToastProvider } from '@/components/ui/toast';

describe('Toast Component', () => {
  // Test basic rendering
  it('renders correctly with title and description', () => {
    render(
      <Toast 
        title="Test Title" 
        description="Test Description" 
        data-testid="test-toast"
      />
    );
    
    const toast = screen.getByTestId('test-toast');
    expect(toast).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  // Test with only title
  it('renders with only title', () => {
    render(<Toast title="Only Title" data-testid="title-toast" />);
    
    const toast = screen.getByTestId('title-toast');
    expect(toast).toBeInTheDocument();
    expect(screen.getByText('Only Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  // Test with only description
  it('renders with only description', () => {
    render(<Toast description="Only Description" data-testid="desc-toast" />);
    
    const toast = screen.getByTestId('desc-toast');
    expect(toast).toBeInTheDocument();
    expect(screen.getByText('Only Description')).toBeInTheDocument();
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  // Test close button functionality
  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Toast 
        title="Closable Toast" 
        onClose={handleClose} 
        data-testid="close-toast"
      />
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // Test different variants
  it('renders different variants with appropriate classes', () => {
    const { rerender } = render(
      <Toast 
        title="Default Toast" 
        variant="default" 
        data-testid="variant-toast"
      />
    );
    
    let toast = screen.getByTestId('variant-toast');
    expect(toast).toHaveClass('bg-background');
    
    rerender(
      <Toast 
        title="Destructive Toast" 
        variant="destructive" 
        data-testid="variant-toast"
      />
    );
    
    toast = screen.getByTestId('variant-toast');
    expect(toast).toHaveClass('destructive');
  });

  // Test custom className
  it('applies custom className', () => {
    render(
      <Toast 
        title="Custom Class Toast" 
        className="custom-test-class" 
        data-testid="custom-toast"
      />
    );
    
    const toast = screen.getByTestId('custom-toast');
    expect(toast).toHaveClass('custom-test-class');
  });

  // Test ToastProvider rendering
  it('renders ToastProvider with toast container', () => {
    render(
      <ToastProvider>
        <div>Child Element</div>
      </ToastProvider>
    );
    
    expect(screen.getByText('Child Element')).toBeInTheDocument();
    const toastContainer = document.getElementById('toast-container');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer).toHaveClass('fixed');
    expect(toastContainer).toHaveClass('z-50');
  });
}); 