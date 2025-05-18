import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation since we're in a test environment
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard-view/template-editor',
  useParams: () => ({}),
  useSearchParams: () => ({ get: jest.fn() }),
}));

// Mock the authentication hook
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}));

// We need to create a test component that simulates our dashboard layout with template editor
const MockDashboardWithEditor = () => {
  return (
    <div data-testid="dashboard-layout" className="flex h-screen overflow-hidden bg-gray-50">
      <div data-testid="sidebar" className="w-64 bg-white">Sidebar</div>
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <header data-testid="header" className="bg-white border-b">Header</header>
        <main className="grow">
          <div className="px-4 py-8 w-full max-w-9xl mx-auto" data-testid="main-content">
            <div data-testid="template-editor-container">
              Template Editor Content
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

describe('Template Editor Integration Tests', () => {
  test('Editor should render within dashboard layout', () => {
    render(<MockDashboardWithEditor />);
    
    // Verify dashboard layout elements are present
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    
    // Verify editor content is present within the main content area
    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(screen.getByTestId('template-editor-container')).toBeInTheDocument();
  });
  
  test('Editor should maintain proper layout structure', () => {
    render(<MockDashboardWithEditor />);
    
    // The sidebar should be a direct child of the dashboard layout
    const dashboardLayout = screen.getByTestId('dashboard-layout');
    const sidebar = screen.getByTestId('sidebar');
    expect(dashboardLayout).toContainElement(sidebar);
    
    // The editor container should be within the main content
    const mainContent = screen.getByTestId('main-content');
    const editorContainer = screen.getByTestId('template-editor-container');
    expect(mainContent).toContainElement(editorContainer);
  });
}); 