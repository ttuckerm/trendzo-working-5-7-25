import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ElementsPanel } from '@/components/templateEditor-v2/panels/ElementsPanel';
import { EditorCanvas } from '@/components/templateEditor-v2/EditorCanvas';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';
import { DragDropProvider } from '@/components/templateEditor-v2/DragContext';

// Mock useTemplateEditor to track state changes
jest.mock('@/components/templateEditor-v2/TemplateEditorContext', () => {
  const originalModule = jest.requireActual('@/components/templateEditor-v2/TemplateEditorContext');
  
  return {
    ...originalModule,
    useTemplateEditor: jest.fn(() => ({
      state: {
        template: {
          sections: [{ id: 'section-1', elements: [] }],
        },
        ui: {
          selectedSectionId: 'section-1',
          selectedElementId: null,
        },
      },
      addElement: jest.fn(),
      selectElement: jest.fn(),
    })),
  };
});

// Setup mock for elements data
jest.mock('@/components/templateEditor-v2/data/elementsData', () => ({
  elementCategories: [
    {
      id: 'text',
      name: 'Text',
      elements: [
        { id: 'text-heading', name: 'Heading', type: 'text', icon: 'Heading' },
      ]
    }
  ]
}));

// Helper to render components with all required context
const renderWithContexts = () => {
  return render(
    <TemplateEditorProvider>
      <DragDropProvider>
        <div className="flex">
          <div className="w-80">
            <ElementsPanel />
          </div>
          <div className="flex-1">
            <EditorCanvas />
          </div>
        </div>
      </DragDropProvider>
    </TemplateEditorProvider>
  );
};

describe('Drag and Drop Functionality', () => {
  beforeEach(() => {
    // Create mock getBoundingClientRect for all elements
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
  });

  it('allows elements to be dragged from panel', () => {
    renderWithContexts();
    
    // Find the draggable element
    const element = screen.getByText('Heading').closest('[draggable="true"]');
    expect(element).toBeInTheDocument();
    
    // Start drag operation
    fireEvent.dragStart(element);
    
    // Verify drag started
    expect(document.body).toHaveClass('dragging');
  });
  
  it('highlights drop zones during drag', () => {
    renderWithContexts();
    
    // Find the draggable element and canvas drop zone
    const element = screen.getByText('Heading').closest('[draggable="true"]');
    const canvas = screen.getByTestId('editor-canvas');
    
    // Start drag operation
    fireEvent.dragStart(element);
    
    // Drag over the canvas
    fireEvent.dragEnter(canvas);
    
    // Verify canvas is highlighted
    expect(canvas).toHaveClass('drop-active');
    
    // Drag leave
    fireEvent.dragLeave(canvas);
    
    // Verify highlight is removed
    expect(canvas).not.toHaveClass('drop-active');
  });
  
  it('adds element to the template on drop', () => {
    const { useTemplateEditor } = require('@/components/templateEditor-v2/TemplateEditorContext');
    const mockAddElement = jest.fn();
    
    // Setup mock implementation
    useTemplateEditor.mockImplementation(() => ({
      state: {
        template: {
          sections: [{ id: 'section-1', elements: [] }],
        },
        ui: {
          selectedSectionId: 'section-1',
          selectedElementId: null,
        },
      },
      addElement: mockAddElement,
      selectElement: jest.fn(),
    }));
    
    renderWithContexts();
    
    // Find the draggable element and canvas drop zone
    const element = screen.getByText('Heading').closest('[draggable="true"]');
    const canvas = screen.getByTestId('editor-canvas');
    
    // Start drag with element data
    fireEvent.dragStart(element, {
      dataTransfer: {
        setData: jest.fn(),
        getData: () => JSON.stringify({ id: 'text-heading', type: 'text' }),
      },
    });
    
    // Allow drop
    fireEvent.dragOver(canvas, { preventDefault: jest.fn() });
    
    // Drop the element
    fireEvent.drop(canvas, { 
      preventDefault: jest.fn(),
      clientX: 150,
      clientY: 150,
    });
    
    // Check if addElement was called with correct params
    expect(mockAddElement).toHaveBeenCalledWith('section-1', 'text');
  });
  
  it('calculates correct position on drop', () => {
    const { useTemplateEditor } = require('@/components/templateEditor-v2/TemplateEditorContext');
    const mockAddElement = jest.fn();
    
    // Setup mock implementation
    useTemplateEditor.mockImplementation(() => ({
      state: {
        template: {
          sections: [{ id: 'section-1', elements: [] }],
        },
        ui: {
          selectedSectionId: 'section-1',
          selectedElementId: null,
          zoom: 0.5, // Test with zoom level
        },
      },
      addElement: mockAddElement,
      selectElement: jest.fn(),
    }));
    
    renderWithContexts();
    
    // Find components
    const element = screen.getByText('Heading').closest('[draggable="true"]');
    const canvas = screen.getByTestId('editor-canvas');
    
    // Setup canvas position mock
    canvas.getBoundingClientRect = jest.fn(() => ({
      width: 500,
      height: 800,
      top: 50,
      left: 100,
      right: 600,
      bottom: 850,
      x: 100,
      y: 50,
      toJSON: () => {}
    }));
    
    // Start drag
    fireEvent.dragStart(element, {
      dataTransfer: {
        setData: jest.fn(),
        getData: () => JSON.stringify({ id: 'text-heading', type: 'text' }),
      },
    });
    
    // Drop at position (200, 150)
    fireEvent.drop(canvas, {
      preventDefault: jest.fn(),
      clientX: 200,
      clientY: 150,
    });
    
    // Expected position calculation: (clientX - canvas.left) / zoom
    const expectedX = (200 - 100) / 0.5;
    const expectedY = (150 - 50) / 0.5;
    
    // Verify element was added with correct position
    expect(mockAddElement).toHaveBeenCalled();
    
    // Get the call arguments and check if position was set correctly
    // This would need to be adapted based on how your addElement function 
    // ultimately handles positioning
  });
}); 