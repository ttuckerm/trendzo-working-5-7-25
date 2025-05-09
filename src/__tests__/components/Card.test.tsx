import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card-component';

describe('Card Component', () => {
  // Test Card component
  it('renders Card correctly', () => {
    render(<Card data-testid="card">Card Content</Card>);
    const card = screen.getByTestId('card');
    
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveTextContent('Card Content');
  });

  // Test CardHeader component
  it('renders CardHeader correctly', () => {
    render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
    const header = screen.getByTestId('card-header');
    
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(header).toHaveClass('p-6');
    expect(header).toHaveTextContent('Header Content');
  });

  // Test CardTitle component
  it('renders CardTitle correctly', () => {
    render(<CardTitle data-testid="card-title">Card Title</CardTitle>);
    const title = screen.getByTestId('card-title');
    
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveTextContent('Card Title');
  });

  // Test CardDescription component
  it('renders CardDescription correctly', () => {
    render(<CardDescription data-testid="card-desc">Card Description</CardDescription>);
    const desc = screen.getByTestId('card-desc');
    
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveClass('text-sm');
    expect(desc).toHaveClass('text-gray-500');
    expect(desc).toHaveTextContent('Card Description');
  });

  // Test CardContent component
  it('renders CardContent correctly', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>);
    const content = screen.getByTestId('card-content');
    
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
    expect(content).toHaveTextContent('Content');
  });

  // Test CardFooter component
  it('renders CardFooter correctly', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
    const footer = screen.getByTestId('card-footer');
    
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('p-6');
    expect(footer).toHaveClass('pt-0');
    expect(footer).toHaveTextContent('Footer');
  });

  // Test custom className on all components
  it('applies custom className to all components', () => {
    render(
      <Card className="custom-card" data-testid="custom-card">
        <CardHeader className="custom-header" data-testid="custom-header">
          <CardTitle className="custom-title" data-testid="custom-title">Title</CardTitle>
          <CardDescription className="custom-desc" data-testid="custom-desc">Description</CardDescription>
        </CardHeader>
        <CardContent className="custom-content" data-testid="custom-content">Content</CardContent>
        <CardFooter className="custom-footer" data-testid="custom-footer">Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByTestId('custom-card')).toHaveClass('custom-card');
    expect(screen.getByTestId('custom-header')).toHaveClass('custom-header');
    expect(screen.getByTestId('custom-title')).toHaveClass('custom-title');
    expect(screen.getByTestId('custom-desc')).toHaveClass('custom-desc');
    expect(screen.getByTestId('custom-content')).toHaveClass('custom-content');
    expect(screen.getByTestId('custom-footer')).toHaveClass('custom-footer');
  });

  // Test full card composition
  it('renders a complete card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Main Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });
}); 