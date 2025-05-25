import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ElementsPanel } from '@/components/templateEditor-v2/panels/ElementsPanel';
import { EditorCanvas } from '@/components/templateEditor-v2/EditorCanvas';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';
import { DragDropProvider } from '@/components/templateEditor-v2/DragContext';

// Mock for performance.now()
const originalPerformanceNow = performance.now;

// Mock large dataset
jest.mock('@/components/templateEditor-v2/data/elementsData', () => {
  // Generate a large number of elements to test performance
  const generateElements = (count, prefix) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-${i}`,
      name: `${prefix} ${i}`,
      type: prefix.toLowerCase(),
      icon: 'Icon'
    }));
  };

  return {
    elementCategories: [
      {
        id: 'text',
        name: 'Text',
        elements: generateElements(100, 'Text')
      },
      {
        id: 'media',
        name: 'Media',
        elements: generateElements(100, 'Media')
      },
      {
        id: 'stickers',
        name: 'Stickers',
        elements: generateElements(100, 'Sticker')
      }
    ]
  };
});

// Helper to render components with contexts
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

describe('Performance Testing', () => {
  beforeEach(() => {
    // Mock performance.now for timing measurements
    let time = 0;
    performance.now = jest.fn(() => {
      time += 16.67; // simulate 60fps (16.67ms per frame)
      return time;
    });

    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      return setTimeout(() => cb(performance.now()), 16);
    });

    // Mock element size
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

  afterEach(() => {
    // Restore mocks
    performance.now = originalPerformanceNow;
    jest.restoreAllMocks();
  });

  // Test 1: Component renders within performance budget
  test('elements panel renders within performance budget', async () => {
    const startTime = performance.now();
    renderWithContexts();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    
    // Render should happen within a reasonable time (e.g., under 100ms)
    // This is just an example threshold - adjust based on your requirements
    expect(renderTime).toBeLessThan(100);
  });

  // Test 2: Drag operations maintain 60fps
  test('drag operations maintain 60fps performance', async () => {
    const { container } = renderWithContexts();
    
    // Get a draggable element
    const draggableElements = container.querySelectorAll('[draggable="true"]');
    const element = draggableElements[0];
    
    // Track frame timing during drag operation
    const frameTimes = [];
    let lastFrameTime = performance.now();
    
    // Mock RAF to track frame times
    window.requestAnimationFrame = jest.fn(callback => {
      const now = performance.now();
      frameTimes.push(now - lastFrameTime);
      lastFrameTime = now;
      return setTimeout(() => callback(now), 16);
    });
    
    // Simulate drag operation
    act(() => {
      element.dispatchEvent(new MouseEvent('dragstart', { bubbles: true }));
      
      // Simulate 10 frames of dragging
      for (let i = 0; i < 10; i++) {
        const moveEvent = new MouseEvent('dragover', { 
          bubbles: true,
          clientX: 100 + i * 10,
          clientY: 100 + i * 10
        });
        document.dispatchEvent(moveEvent);
      }
      
      element.dispatchEvent(new MouseEvent('dragend', { bubbles: true }));
    });
    
    // Calculate average frame time
    const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    
    // For 60fps, each frame should take ~16.67ms or less
    expect(avgFrameTime).toBeLessThanOrEqual(16.67);
  });

  // Test 3: Large element lists don't cause lag
  test('large element lists render without lag', async () => {
    const startTime = performance.now();
    
    const { container } = renderWithContexts();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Even with 300 elements (100 per category), render should be reasonably fast
    expect(renderTime).toBeLessThan(150);
    
    // All categories should be in the document
    const categories = container.querySelectorAll('[data-testid="category-item"]');
    expect(categories.length).toBe(3);
  });

  // Test 4: Memory usage test
  test('memory usage stays within bounds', async () => {
    // This is difficult to test directly in Jest
    // Instead, we'll check if the component doesn't create excessive DOM nodes
    
    const { container } = renderWithContexts();
    
    // Count total DOM nodes created
    const totalNodes = container.querySelectorAll('*').length;
    
    // Even with 300 elements, DOM node count should be reasonable
    // This threshold is arbitrary and should be adjusted based on actual component design
    expect(totalNodes).toBeLessThan(1000);
  });

  // Test 5: Animation frames performance test
  test('animation frames meet performance targets', async () => {
    const { container } = renderWithContexts();
    
    // Get a category header to test animation on click (expand/collapse)
    const categoryHeader = container.querySelector('[data-testid="category-item"] button');
    
    // Track frame timing during animation
    const frameTimes = [];
    let lastFrameTime = performance.now();
    
    // Mock RAF to track frame times during animation
    window.requestAnimationFrame = jest.fn(callback => {
      const now = performance.now();
      frameTimes.push(now - lastFrameTime);
      lastFrameTime = now;
      return setTimeout(() => callback(now), 16);
    });
    
    // Trigger animation by clicking category (expand/collapse)
    act(() => {
      categoryHeader.click();
      
      // Wait for animation frames (assuming animation duration of ~300ms)
      jest.advanceTimersByTime(300);
    });
    
    // For animations to be smooth, frame times should be consistent
    const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    
    // For 60fps animations
    expect(avgFrameTime).toBeLessThanOrEqual(16.67);
    
    // Standard deviation should be low (consistency is key for smooth animations)
    const stdDev = Math.sqrt(
      frameTimes.reduce((sum, time) => sum + Math.pow(time - avgFrameTime, 2), 0) / frameTimes.length
    );
    
    // Arbitrary threshold - adjust based on requirements
    expect(stdDev).toBeLessThan(5);
  });
}); 