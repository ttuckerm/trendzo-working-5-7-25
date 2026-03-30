import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  // Test basic rendering
  it('renders correctly with default props', () => {
    render(<Input data-testid="test-input" />);
    
    const input = screen.getByTestId('test-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveClass('flex');
    expect(input).toHaveClass('h-10');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
  });

  // Test with custom type
  it('renders with specified type', () => {
    render(<Input type="email" data-testid="email-input" />);
    
    const input = screen.getByTestId('email-input');
    expect(input).toHaveAttribute('type', 'email');
  });

  // Test with custom className
  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="custom-input" />);
    
    const input = screen.getByTestId('custom-input');
    expect(input).toHaveClass('custom-class');
  });

  // Test with placeholder
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" data-testid="placeholder-input" />);
    
    const input = screen.getByTestId('placeholder-input');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  // Test value change
  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input data-testid="change-input" onChange={handleChange} />);
    
    const input = screen.getByTestId('change-input');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  // Test disabled state
  it('applies disabled state correctly', () => {
    render(<Input disabled data-testid="disabled-input" />);
    
    const input = screen.getByTestId('disabled-input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed');
    expect(input).toHaveClass('disabled:opacity-50');
  });

  // Test required attribute
  it('adds required attribute when specified', () => {
    render(<Input required data-testid="required-input" />);
    
    const input = screen.getByTestId('required-input');
    expect(input).toHaveAttribute('required');
  });

  // Test other HTML attributes
  it('passes through other HTML attributes', () => {
    render(
      <Input 
        data-testid="attrs-input"
        name="username"
        aria-label="Username"
        maxLength={10}
      />
    );
    
    const input = screen.getByTestId('attrs-input');
    expect(input).toHaveAttribute('name', 'username');
    expect(input).toHaveAttribute('aria-label', 'Username');
    expect(input).toHaveAttribute('maxLength', '10');
  });
}); 