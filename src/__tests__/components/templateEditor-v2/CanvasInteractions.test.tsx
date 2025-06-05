import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorCanvas } from '@/components/templateEditor-v2/EditorCanvas';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';
import { DragDropProvider } from '@/components/templateEditor-v2/DragContext';
import userEvent from '@testing-library/user-event';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Set up clipboard API mock
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    readText: jest.fn().mockImplementation(() => Promise.resolve('Clipboard text')),
  },
});

describe('Canvas Interactions', () => {
  // Template with multiple elements for testing interactions
  const templateWithElements = {
    id: 'template1',
    name: 'Test Template',
    aspectRatio: '9:16',
    sections: [{
      id: 'section1',
      name: 'Main Section',
      order: 0,
      elements: [
        {
          id: 'text1',
          type: 'text',
          content: 'Sample Text',
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          hidden: false
        },
        {
          id: 'image1',
          type: 'image',
          src: '/sample-image.jpg',
          x: 50,
          y: 200,
          width: 200,
          height: 200,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          hidden: false
        }
      ],
      backgroundColor: '#ffffff'
    }]
  };

  const renderCanvas = (customTemplate = templateWithElements) => {
    return render(
      <TemplateEditorProvider initialData={{ template: customTemplate }}>
        <DragDropProvider>
          <EditorCanvas />
        </DragDropProvider>
      </TemplateEditorProvider>
    );
  };

  it('allows click-to-select elements', async () => {
    const { container } = renderCanvas();
    
    // Find the text element
    const textElement = screen.getByTestId('element-text1');
    expect(textElement).toBeInTheDocument();
    
    // Initially, it should not be selected
    expect(textElement).not.toHaveClass('selected');
    
    // Click to select
    fireEvent.click(textElement);
    
    // Now it should be selected
    await waitFor(() => {
      expect(textElement).toHaveClass('selected');
    });
    
    // Click on the image element
    const imageElement = screen.getByTestId('element-image1');
    fireEvent.click(imageElement);
    
    // Now the image should be selected and the text deselected
    await waitFor(() => {
      expect(imageElement).toHaveClass('selected');
      expect(textElement).not.toHaveClass('selected');
    });
  });

  it('allows drag-to-reposition elements', async () => {
    const { container } = renderCanvas();
    
    // Find the text element
    const textElement = screen.getByTestId('element-text1');
    
    // Get initial position
    const initialStyle = window.getComputedStyle(textElement);
    const initialLeft = initialStyle.left;
    const initialTop = initialStyle.top;
    
    // Perform drag operation
    fireEvent.mouseDown(textElement, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(document);
    
    // Check if position was updated
    await waitFor(() => {
      const newStyle = window.getComputedStyle(textElement);
      expect(newStyle.left).not.toBe(initialLeft);
      expect(newStyle.top).not.toBe(initialTop);
    });
  });

  it('has resize handles that work correctly', async () => {
    const { container } = renderCanvas();
    
    // Find and select the image element
    const imageElement = screen.getByTestId('element-image1');
    fireEvent.click(imageElement);
    
    // Wait for selection handles to appear
    const resizeHandles = await screen.findAllByTestId(/handle-/);
    expect(resizeHandles.length).toBeGreaterThan(0);
    
    // Get initial size
    const initialStyle = window.getComputedStyle(imageElement);
    const initialWidth = initialStyle.width;
    const initialHeight = initialStyle.height;
    
    // Get the bottom-right resize handle
    const bottomRightHandle = screen.getByTestId('handle-bottom-right');
    
    // Perform resize operation
    fireEvent.mouseDown(bottomRightHandle, { clientX: 250, clientY: 400 });
    fireEvent.mouseMove(document, { clientX: 300, clientY: 450 });
    fireEvent.mouseUp(document);
    
    // Check if size was updated
    await waitFor(() => {
      const newStyle = window.getComputedStyle(imageElement);
      expect(newStyle.width).not.toBe(initialWidth);
      expect(newStyle.height).not.toBe(initialHeight);
    });
  });

  it('supports multi-selection capabilities', async () => {
    const { container } = renderCanvas();
    
    // Find elements
    const textElement = screen.getByTestId('element-text1');
    const imageElement = screen.getByTestId('element-image1');
    
    // Multi-select using Shift key
    fireEvent.click(textElement);
    fireEvent.click(imageElement, { shiftKey: true });
    
    // Both elements should be selected
    await waitFor(() => {
      expect(textElement).toHaveClass('selected');
      expect(imageElement).toHaveClass('selected');
    });
    
    // Check for multi-selection controls
    const multiSelectionControls = screen.getByTestId('multi-selection-controls');
    expect(multiSelectionControls).toBeInTheDocument();
  });

  it('responds to keyboard shortcuts', async () => {
    const user = userEvent.setup();
    const { container } = renderCanvas();
    
    // Find and select the text element
    const textElement = screen.getByTestId('element-text1');
    fireEvent.click(textElement);
    
    // Delete with Delete key
    await user.keyboard('{Delete}');
    
    // Element should be removed
    await waitFor(() => {
      expect(screen.queryByTestId('element-text1')).not.toBeInTheDocument();
    });
    
    // Select the image element
    const imageElement = screen.getByTestId('element-image1');
    fireEvent.click(imageElement);
    
    // Copy with Ctrl+C
    await user.keyboard('{Control>}c{/Control}');
    
    // Paste with Ctrl+V
    await user.keyboard('{Control>}v{/Control}');
    
    // Should have a duplicate image element
    await waitFor(() => {
      const imageElements = screen.getAllByTestId(/element-image/);
      expect(imageElements.length).toBe(2);
    });
  });

  it('supports touch interactions for mobile', async () => {
    // Mock touch events
    const mockTouch = { 
      identifier: 1,
      clientX: 100, 
      clientY: 100, 
      target: document.createElement('div') 
    };
    
    const { container } = renderCanvas();
    
    // Find the text element
    const textElement = screen.getByTestId('element-text1');
    
    // Simulate touch start
    fireEvent.touchStart(textElement, { 
      touches: [mockTouch],
      targetTouches: [mockTouch],
      changedTouches: [mockTouch]
    });
    
    // Element should be selected
    await waitFor(() => {
      expect(textElement).toHaveClass('selected');
    });
    
    // Update touch position
    const movedTouch = { ...mockTouch, clientX: 150, clientY: 150 };
    
    // Simulate touch move
    fireEvent.touchMove(textElement, {
      touches: [movedTouch],
      targetTouches: [movedTouch],
      changedTouches: [movedTouch]
    });
    
    // Simulate touch end
    fireEvent.touchEnd(textElement);
    
    // Element should have moved
    await waitFor(() => {
      const newStyle = window.getComputedStyle(textElement);
      expect(parseInt(newStyle.left)).toBeGreaterThan(50);
      expect(parseInt(newStyle.top)).toBeGreaterThan(50);
    });
  });

  it('provides smart snap-to-grid and alignment', async () => {
    const { container } = renderCanvas();
    
    // Enable grid
    const gridToggle = screen.getByTestId('grid-toggle');
    fireEvent.click(gridToggle);
    
    // Find and select the text element
    const textElement = screen.getByTestId('element-text1');
    fireEvent.click(textElement);
    
    // Drag near a grid line
    fireEvent.mouseDown(textElement, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 48, clientY: 50 }); // Just off a grid line
    fireEvent.mouseUp(document);
    
    // Should snap to the grid line
    await waitFor(() => {
      const newStyle = window.getComputedStyle(textElement);
      expect(newStyle.left).toBe('50px'); // Snapped back to grid
    });
  });

  it('shows/hides contextual controls appropriately', async () => {
    const { container } = renderCanvas();
    
    // Initially, no contextual controls should be visible
    expect(screen.queryByTestId('contextual-controls')).not.toBeInTheDocument();
    
    // Select an element
    const textElement = screen.getByTestId('element-text1');
    fireEvent.click(textElement);
    
    // Contextual controls should appear
    await waitFor(() => {
      const contextualControls = screen.getByTestId('contextual-controls');
      expect(contextualControls).toBeInTheDocument();
    });
    
    // Click on the canvas background to deselect
    const canvasBackground = screen.getByTestId('canvas-background');
    fireEvent.click(canvasBackground);
    
    // Contextual controls should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('contextual-controls')).not.toBeInTheDocument();
    });
  });
}); 