import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorLayout } from '../../../components/templateEditor-v2/EditorLayout';
import { TemplateEditorProvider, useTemplateEditor } from '../../../components/templateEditor-v2/TemplateEditorContext';
import { EditorState, EditorUIState, EditorSettings, Template } from '../../../components/templateEditor-v2/types';

// Mock the useTemplateEditor hook
jest.mock('../../../components/templateEditor-v2/TemplateEditorContext', () => ({
  ...jest.requireActual('../../../components/templateEditor-v2/TemplateEditorContext'),
  useTemplateEditor: jest.fn(),
}));

const mockUseTemplateEditor = useTemplateEditor as jest.MockedFunction<typeof useTemplateEditor>;

const initialMockTemplate: Template = {
  id: 'test-template',
  name: 'Test Template',
  aspectRatio: '9:16',
  sections: [
    {
      id: 'section-1',
      name: 'Section 1',
      order: 0,
      elements: [],
      backgroundColor: '#ffffff',
    },
  ],
};

const initialMockUIState: EditorUIState = {
  selectedSectionId: 'section-1',
  selectedElementId: null,
  activeTool: null,
  zoom: 1,
  showGrid: false,
  gridSize: 10,
  snapToGrid: true,
  panels: {
    elementsOpen: true,
    propertiesOpen: true,
    previewMode: false,
  },
  history: { past: [], future: [] },
  contextMenuPosition: null,
};

const initialMockSettings: EditorSettings = {
  autosaveEnabled: true,
  autosaveInterval: 30000,
  defaultAspectRatio: '9:16',
  defaultFontFamily: 'Inter',
  defaultTextColor: '#000000',
  defaultBackgroundColor: '#ffffff',
  showDimensionsOnResize: true,
  showPositionOnMove: true,
  useSmartGuides: true,
};

const mockEditorState: EditorState = {
  template: initialMockTemplate,
  ui: initialMockUIState,
  settings: initialMockSettings,
  activeDevice: 'desktop',
  cloudSyncStatus: 'not-synced',
  lastSavedAt: null,
};

describe('EditorLayout', () => {
  beforeEach(() => {
    mockUseTemplateEditor.mockReturnValue({
      state: mockEditorState,
      dispatch: jest.fn(),
      selectSection: jest.fn(),
      selectElement: jest.fn(),
      addSection: jest.fn(),
      addElement: jest.fn(),
      updateElement: jest.fn(),
      moveElement: jest.fn(),
      resizeElement: jest.fn(),
      deleteElement: jest.fn(),
      duplicateElement: jest.fn(),
      updateSection: jest.fn(),
      deleteSection: jest.fn(),
      setActiveTool: jest.fn(),
      toggleGrid: jest.fn(),
      setZoom: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
    });
  });

  test('renders the three main panels (Elements, Canvas, Properties)', () => {
    render(
      <TemplateEditorProvider initialData={mockEditorState}>
        <EditorLayout />
      </TemplateEditorProvider>
    );

    expect(screen.getByTestId('editor-elements-panel')).toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('editor-properties-panel')).toBeInTheDocument();
  });

  test('Elements panel is hidden when panels.elementsOpen is false', () => {
    const modifiedState = {
      ...mockEditorState,
      ui: {
        ...mockEditorState.ui,
        panels: { ...mockEditorState.ui.panels, elementsOpen: false },
      },
    };
    mockUseTemplateEditor.mockReturnValue({
      state: modifiedState,
      dispatch: jest.fn(),
      selectSection: jest.fn(),
      selectElement: jest.fn(),
      addSection: jest.fn(),
      addElement: jest.fn(),
      updateElement: jest.fn(),
      moveElement: jest.fn(),
      resizeElement: jest.fn(),
      deleteElement: jest.fn(),
      duplicateElement: jest.fn(),
      updateSection: jest.fn(),
      deleteSection: jest.fn(),
      setActiveTool: jest.fn(),
      toggleGrid: jest.fn(),
      setZoom: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
    });

    render(
      <TemplateEditorProvider initialData={modifiedState}>
        <EditorLayout />
      </TemplateEditorProvider>
    );

    expect(screen.queryByTestId('editor-elements-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('editor-properties-panel')).toBeInTheDocument(); // Assuming properties panel is still open
  });

  test('Properties panel is hidden when panels.propertiesOpen is false', () => {
    const modifiedState = {
      ...mockEditorState,
      ui: {
        ...mockEditorState.ui,
        panels: { ...mockEditorState.ui.panels, propertiesOpen: false },
      },
    };
     mockUseTemplateEditor.mockReturnValue({
      state: modifiedState,
      dispatch: jest.fn(),
      selectSection: jest.fn(),
      selectElement: jest.fn(),
      addSection: jest.fn(),
      addElement: jest.fn(),
      updateElement: jest.fn(),
      moveElement: jest.fn(),
      resizeElement: jest.fn(),
      deleteElement: jest.fn(),
      duplicateElement: jest.fn(),
      updateSection: jest.fn(),
      deleteSection: jest.fn(),
      setActiveTool: jest.fn(),
      toggleGrid: jest.fn(),
      setZoom: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
    });

    render(
      <TemplateEditorProvider initialData={modifiedState}>
        <EditorLayout />
      </TemplateEditorProvider>
    );

    expect(screen.getByTestId('editor-elements-panel')).toBeInTheDocument(); // Assuming elements panel is still open
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-properties-panel')).not.toBeInTheDocument();
  });
}); 