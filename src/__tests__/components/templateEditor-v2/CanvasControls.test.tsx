import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CanvasControls } from '../../../components/templateEditor-v2/CanvasControls';
import { useTemplateEditor } from '../../../components/templateEditor-v2/TemplateEditorContext';
import { ActionType, EditorState, EditorUIState, Template, EditorSettings } from '../../../components/templateEditor-v2/types';

// Mock the useTemplateEditor hook
jest.mock('../../../components/templateEditor-v2/TemplateEditorContext');

const mockUseTemplateEditor = useTemplateEditor as jest.MockedFunction<typeof useTemplateEditor>;

const mockInitialTemplate: Template = {
  id: 'test-template',
  name: 'Test Template',
  aspectRatio: '9:16',
  sections: [],
};

const mockInitialUIState: EditorUIState = {
  selectedSectionId: null,
  selectedElementId: null,
  activeTool: null,
  zoom: 1,
  showGrid: false,
  gridSize: 10,
  snapToGrid: true,
  panels: { elementsOpen: true, propertiesOpen: true, previewMode: false },
  history: { past: [], future: [] },
  contextMenuPosition: null,
};

const mockInitialSettings: EditorSettings = {
  autosaveEnabled: false,
  autosaveInterval: 30000,
  defaultAspectRatio: '9:16',
  defaultFontFamily: 'Inter',
  defaultTextColor: '#000000',
  defaultBackgroundColor: '#ffffff',
  showDimensionsOnResize: true,
  showPositionOnMove: true,
  useSmartGuides: true,
};

let mockDispatch: jest.Mock;

const setupMockContext = (uiState?: Partial<EditorUIState>, templateState?: Partial<Template>) => {
  mockDispatch = jest.fn();
  const mockState: EditorState = {
    template: { ...mockInitialTemplate, ...templateState },
    ui: { ...mockInitialUIState, ...uiState },
    settings: mockInitialSettings,
    activeDevice: 'desktop',
    cloudSyncStatus: 'not-synced',
    lastSavedAt: null,
  };
  mockUseTemplateEditor.mockReturnValue({
    state: mockState,
    dispatch: mockDispatch,
    // Mock other context functions if CanvasControls uses them directly (it doesn't)
  } as any); // Use 'as any' to simplify if not all context functions are mocked
};

describe('CanvasControls', () => {
  beforeEach(() => {
    setupMockContext(); // Default setup
  });

  test('renders all control buttons', () => {
    render(<CanvasControls />);
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Show Grid')).toBeInTheDocument(); // Initial title when showGrid is false
    expect(screen.getByTitle('9:16 Aspect Ratio (TikTok, Reels)')).toBeInTheDocument();
    expect(screen.getByTitle('1:1 Aspect Ratio (Instagram Post)')).toBeInTheDocument();
    expect(screen.getByTitle('16:9 Aspect Ratio (YouTube Video)')).toBeInTheDocument();
  });

  test('displays current zoom level', () => {
    setupMockContext({ zoom: 0.75 });
    render(<CanvasControls />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  test('dispatches SET_ZOOM action on zoom in button click', () => {
    setupMockContext({ zoom: 1 });
    render(<CanvasControls />);
    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.SET_ZOOM,
      payload: 1 * 1.2,
    });
  });

  test('dispatches SET_ZOOM action on zoom out button click', () => {
    setupMockContext({ zoom: 1 });
    render(<CanvasControls />);
    fireEvent.click(screen.getByTitle('Zoom Out'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.SET_ZOOM,
      payload: 1 / 1.2,
    });
  });

  test('dispatches TOGGLE_GRID action on grid button click', () => {
    render(<CanvasControls />);
    fireEvent.click(screen.getByTitle('Show Grid'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.TOGGLE_GRID });
  });

  test('grid button title changes when grid is active', () => {
    setupMockContext({ showGrid: true });
    render(<CanvasControls />);
    expect(screen.getByTitle('Hide Grid')).toBeInTheDocument();
  });

  test('dispatches UPDATE_TEMPLATE action with new aspect ratio for 9:16', () => {
    render(<CanvasControls />);
    fireEvent.click(screen.getByTitle('9:16 Aspect Ratio (TikTok, Reels)'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.UPDATE_TEMPLATE,
      payload: { aspectRatio: '9:16' },
    });
  });

  test('dispatches UPDATE_TEMPLATE action with new aspect ratio for 1:1', () => {
    render(<CanvasControls />);
    fireEvent.click(screen.getByTitle('1:1 Aspect Ratio (Instagram Post)'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.UPDATE_TEMPLATE,
      payload: { aspectRatio: '1:1' },
    });
  });

  test('dispatches UPDATE_TEMPLATE action with new aspect ratio for 16:9', () => {
    render(<CanvasControls />);
    fireEvent.click(screen.getByTitle('16:9 Aspect Ratio (YouTube Video)'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.UPDATE_TEMPLATE,
      payload: { aspectRatio: '16:9' },
    });
  });

  test('zoom buttons are disabled at min/max zoom', () => {
    setupMockContext({ zoom: 3 }); // Max zoom
    render(<CanvasControls />);
    expect(screen.getByTitle('Zoom In')).toBeDisabled();
    expect(screen.getByTitle('Zoom Out')).not.toBeDisabled();

    setupMockContext({ zoom: 0.1 }); // Min zoom
    render(<CanvasControls />); // Re-render with new context
    expect(screen.getByTitle('Zoom In')).not.toBeDisabled();
    expect(screen.getByTitle('Zoom Out')).toBeDisabled();
  });

}); 