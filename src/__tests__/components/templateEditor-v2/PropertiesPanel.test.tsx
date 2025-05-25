import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertiesPanel } from '../../../components/templateEditor-v2/panels/PropertiesPanel';
import { useTemplateEditor } from '../../../components/templateEditor-v2/TemplateEditorContext';
import { Element, Template, EditorState, EditorUIState, EditorSettings, ElementType, ActionType, AudioProperties, AnimationProperties } from '../../../components/templateEditor-v2/types';

// Mock child components to isolate PropertiesPanel logic
jest.mock('../../../components/templateEditor-v2/PropertyGroup', () => ({
  PropertyGroup: jest.fn(({ title, children, id }) => <div data-testid={`pg-${id || title}`}>{children}</div>),
}));
jest.mock('../../../components/templateEditor-v2/PropertyControls/ColorPicker', () => ({
  ColorPicker: jest.fn(() => <div data-testid="mock-color-picker">ColorPicker</div>),
}));
jest.mock('../../../components/templateEditor-v2/PropertyControls/FontControls', () => ({
  FontControls: jest.fn(() => <div data-testid="mock-font-controls">FontControls</div>),
}));
jest.mock('../../../components/templateEditor-v2/PropertyControls/AnimationControls', () => ({
  AnimationControls: jest.fn(() => <div data-testid="mock-animation-controls">AnimationControls</div>),
}));
jest.mock('../../../components/templateEditor-v2/PropertyControls/TextAnimations', () => ({
  TextAnimations: jest.fn(() => <div data-testid="mock-text-animations">TextAnimations</div>),
}));
jest.mock('../../../components/templateEditor-v2/JustInTimeLearning', () => ({
  JustInTimeLearning: jest.fn(() => <div data-testid="mock-jit-learning">JustInTimeLearning</div>),
}));
// TierAccessManager and ProgressiveSkillSystem are static, usually don't need direct mocking for rendering tests unless their methods are called directly and affect render.


const mockUseTemplateEditor = useTemplateEditor as jest.MockedFunction<typeof useTemplateEditor>;
let mockDispatch: jest.Mock;

const baseMockElement: Element = {
  id: 'elem1',
  type: 'text',
  x: 0, y: 0, width: 100, height: 50, rotation: 0, opacity: 1, locked: false, hidden: false, zIndex: 1,
  content: 'Test Content',
  fontSize: 16,
  fontFamily: 'Arial',
  color: '#000000',
};

const setupMockContext = (
  selectedElement: Element | null = null, 
  selectedSectionId: string | null = 'section1',
  sections: Template['sections'] = [{id: 'section1', name:'S1', order:0, elements: selectedElement ? [selectedElement] : [], backgroundColor: '#fff'}]
) => {
  mockDispatch = jest.fn();
  const mockState: EditorState = {
    template: {
      id: 'tpl1',
      name: 'Test Template',
      aspectRatio: '9:16',
      sections: sections,
      category: 'general',
      tiktokSpecific: { soundId: 'sound123' }
    },
    ui: {
      selectedSectionId: selectedSectionId,
      selectedElementId: selectedElement ? selectedElement.id : null,
      activeTool: null, zoom: 1, showGrid: false, gridSize: 10, snapToGrid: true,
      panels: { elementsOpen: true, propertiesOpen: true, previewMode: false },
      history: { past: [], future: [] },
      contextMenuPosition: null,
    },
    settings: { autosaveEnabled: false, autosaveInterval: 0, defaultAspectRatio: '9:16', defaultFontFamily: 'Arial', defaultTextColor: '#000', defaultBackgroundColor: '#fff', showDimensionsOnResize:true, showPositionOnMove:true, useSmartGuides:true },
    activeDevice: 'desktop',
    cloudSyncStatus: 'not-synced',
    lastSavedAt: null,
  };

  mockUseTemplateEditor.mockReturnValue({
    state: mockState,
    dispatch: mockDispatch,
    updateElement: jest.fn((sectionId, elementId, updates) => {
      mockDispatch({ type: ActionType.UPDATE_ELEMENT, payload: { sectionId, elementId, updates } });
    }),
    updateSection: jest.fn((sectionId, updates) => {
      mockDispatch({ type: ActionType.UPDATE_SECTION, payload: { sectionId, updates } });
    }),
    selectElement: jest.fn(),
  } as any);
};

describe('PropertiesPanel', () => {
  test('renders empty state when no element or section is selected', () => {
    setupMockContext(null, null, []); // No selected element, no selected section, empty sections array
    render(<PropertiesPanel />);
    expect(screen.getByText('No Selection')).toBeInTheDocument();
    expect(screen.getByText('Select a section or element to view and edit its properties.')).toBeInTheDocument();
  });

  test('renders section properties when a section is selected but no element', () => {
    const section = { id: 'section1', name: 'My Section', order: 0, elements: [], backgroundColor: '#eee' };
    setupMockContext(null, 'section1', [section]);
    render(<PropertiesPanel />);
    expect(screen.getByDisplayValue('My Section')).toBeInTheDocument(); // Checks for section name input
    // Check for background color control or other section-specific items
    expect(screen.getByLabelText('Background Image URL')).toBeInTheDocument();
  });

  test('renders basic properties for a selected text element', () => {
    const textElement = { ...baseMockElement, type: 'text' as ElementType, content: 'Hello Text' };
    setupMockContext(textElement);
    render(<PropertiesPanel />);
    expect(screen.getByTestId('pg-basic-properties')).toBeInTheDocument();
    expect(screen.getByTestId('pg-text-properties')).toBeInTheDocument();
    expect(screen.getByTestId('mock-font-controls')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hello Text')).toBeInTheDocument();
  });

  test('renders basic properties for a selected image element', () => {
    const imageElement = { ...baseMockElement, type: 'image' as ElementType, src: 'test.jpg' };
    setupMockContext(imageElement);
    render(<PropertiesPanel />);
    expect(screen.getByTestId('pg-basic-properties')).toBeInTheDocument();
    expect(screen.getByTestId('pg-image-properties')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test.jpg')).toBeInTheDocument();
  });
  
  test('renders basic properties for a selected video element', () => {
    const videoElement = { ...baseMockElement, type: 'video' as ElementType, src: 'test.mp4' };
    setupMockContext(videoElement);
    render(<PropertiesPanel />);
    expect(screen.getByTestId('pg-basic-properties')).toBeInTheDocument();
    expect(screen.getByTestId('pg-video-properties')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test.mp4')).toBeInTheDocument();
  });

  test('renders basic properties for a selected shape element', () => {
    const shapeElement = { ...baseMockElement, type: 'shape' as ElementType, backgroundColor: '#ff0000' };
    setupMockContext(shapeElement);
    render(<PropertiesPanel />);
    expect(screen.getByTestId('pg-basic-properties')).toBeInTheDocument();
    expect(screen.getByTestId('pg-shape-properties')).toBeInTheDocument();
    // Check for a specific control within shape properties, e.g., color picker
    expect(screen.getByTestId('mock-color-picker')).toBeInTheDocument(); 
  });

  test('updates text content on change', () => {
    const textElement = { ...baseMockElement, type: 'text' as ElementType, content: 'Old Text' };
    setupMockContext(textElement);
    render(<PropertiesPanel />);
    const textarea = screen.getByLabelText('Text content') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'New Text' } });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.UPDATE_ELEMENT,
      payload: { sectionId: 'section1', elementId: textElement.id, updates: { content: 'New Text' } },
    });
  });
  
  test('updates image src on change', () => {
    const imageElement = { ...baseMockElement, type: 'image' as ElementType, src: 'old.jpg' };
    setupMockContext(imageElement);
    render(<PropertiesPanel />);
    const input = screen.getByLabelText('Image URL');
    fireEvent.change(input, { target: { value: 'new.jpg' } });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.UPDATE_ELEMENT,
      payload: { sectionId: 'section1', elementId: imageElement.id, updates: { src: 'new.jpg' } },
    });
  });

  // Add more tests for other property changes (position, size, color, video props, etc.)
  // Test that correct PropertyGroup titles are rendered based on selected element
});
