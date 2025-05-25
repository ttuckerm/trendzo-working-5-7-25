import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateEditorV2 } from '../../../components/templateEditor-v2/TemplateEditorV2';

// Mock the necessary providers
jest.mock('../../../../src/lib/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true,
  }),
}));

describe('TemplateEditorV2', () => {
  test('renders without crashing', () => {
    render(<TemplateEditorV2 />);
    // A basic check, assuming TemplateEditorV2 renders some identifiable content or role.
    // For a more robust test, we'd look for a specific element unique to TemplateEditorV2.
    // As TemplateEditorV2 wraps EditorLayout which contains "Elements", "Canvas", "Properties" landmarks,
    // we can expect one of those to be present if it renders its child structure.
    // Let's assume the Elements panel's initial state might render a heading or accessible name.
    // Or, more simply, the main container of EditorLayout.
    // For now, a simple check if anything with 'main' role (often used for primary content area) is rendered.
    // This might need refinement based on actual TemplateEditorV2 and EditorLayout structure.
    
    // TemplateEditorV2 directly renders TemplateEditorProvider which then renders EditorLayout.
    // EditorLayout has three main sections. Let's check if "Elements" heading/landmark is present from ElementsPanel via EditorLayout.
    // This is an indirect check but confirms rendering flow.
    expect(screen.getByRole('heading', { name: /Elements/i })).toBeInTheDocument();
  });

  // Test for auth integration
  test('displays user ID from AuthContext', () => {
    // To make this test pass, TemplateEditorV2 or a child component 
    // needs to call useAuth() and render the user.id.
    // For example, in TemplateEditorV2.tsx:
    // const { user } = useAuth();
    // return (<div>{user?.id} <TemplateEditorProvider>...</TemplateEditorProvider></div>);
    render(<TemplateEditorV2 />);
    expect(screen.getByText('test-user-id')).toBeInTheDocument();
  });

  it('renders with the correct layout structure', () => {
    render(<TemplateEditorV2 />);
    
    // Check for the main layout sections
    expect(screen.getByTestId('editor-elements-panel')).toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('editor-properties-panel')).toBeInTheDocument();
  });

  it('includes basic editor tools', () => {
    render(<TemplateEditorV2 />);
    
    // Check for basic editor functionality
    expect(screen.getByTestId('element-toolbox')).toBeInTheDocument();
  });

  // Add more tests here for TemplateEditorV2 specific functionalities if any,
  // beyond what's covered by EditorLayout and TemplateEditorContext tests.
}); 