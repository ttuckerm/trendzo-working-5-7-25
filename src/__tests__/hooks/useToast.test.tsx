import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { useToast } from '@/components/ui/use-toast';

// Mock component that uses the toast hook
function ToastTest({ showToast = false, toastProps = {} }) {
  const { toast } = useToast();
  
  React.useEffect(() => {
    if (showToast) {
      toast(toastProps);
    }
  }, [showToast, toast, toastProps]);
  
  return <button onClick={() => toast(toastProps)}>Show Toast</button>;
}

describe('useToast Hook', () => {
  beforeEach(() => {
    // Clean up DOM before each test
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('creates a toast container when a toast is shown', async () => {
    render(<ToastTest showToast={true} toastProps={{ title: 'Test Toast' }} />);
    
    // Fast-forward timers to ensure useEffect has run
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    const container = document.getElementById('toast-container');
    expect(container).not.toBeNull();
    expect(container?.className).toContain('fixed');
    expect(container?.className).toContain('z-50');
  });
  
  it('renders toast with title', async () => {
    render(<ToastTest showToast={true} toastProps={{ title: 'Test Title' }} />);
    
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    const container = document.getElementById('toast-container');
    expect(container?.textContent).toContain('Test Title');
  });
  
  it('renders toast with description', async () => {
    render(
      <ToastTest 
        showToast={true} 
        toastProps={{ 
          title: 'Test Title',
          description: 'Test Description'
        }} 
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    const container = document.getElementById('toast-container');
    expect(container?.textContent).toContain('Test Title');
    expect(container?.textContent).toContain('Test Description');
  });
  
  it('removes toast after duration', async () => {
    render(
      <ToastTest 
        showToast={true} 
        toastProps={{ 
          title: 'Temporary Toast',
          duration: 1000
        }} 
      />
    );
    
    // Initial render
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    let container = document.getElementById('toast-container');
    expect(container?.textContent).toContain('Temporary Toast');
    
    // After duration, toast should be hidden
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Check if opacity has been changed to 0
    container = document.getElementById('toast-container');
    const toastElement = container?.firstChild as HTMLElement;
    expect(toastElement?.className).toContain('opacity-0');
    
    // After animation, toast should be removed
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    container = document.getElementById('toast-container');
    expect(container?.hasChildNodes()).toBeFalsy();
  });
  
  it('renders destructive toast with correct styling', async () => {
    render(
      <ToastTest 
        showToast={true} 
        toastProps={{ 
          title: 'Error Toast',
          variant: 'destructive'
        }} 
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    const container = document.getElementById('toast-container');
    const toastElement = container?.firstChild as HTMLElement;
    expect(toastElement?.className).toContain('bg-red-600');
    expect(toastElement?.className).toContain('text-white');
  });
  
  it('renders multiple toasts', async () => {
    const { rerender } = render(<ToastTest showToast={true} toastProps={{ title: 'Toast 1' }} />);
    
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    rerender(<ToastTest showToast={true} toastProps={{ title: 'Toast 2' }} />);
    
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    const container = document.getElementById('toast-container');
    expect(container?.childNodes.length).toBe(2);
    expect(container?.textContent).toContain('Toast 1');
    expect(container?.textContent).toContain('Toast 2');
  });
}); 