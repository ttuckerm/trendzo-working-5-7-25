import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ZeroUIEditing } from '@/components/templateEditor-v2/ZeroUIEditing';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';
import { DragDropProvider } from '@/components/templateEditor-v2/DragContext';

// Mock the SpeechRecognition API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.SpeechRecognition = jest.fn().mockImplementation(() => mockSpeechRecognition);
global.webkitSpeechRecognition = jest.fn().mockImplementation(() => mockSpeechRecognition);

describe('ZeroUIEditing', () => {
  // Basic template for testing
  const basicTemplate = {
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
        }
      ],
      backgroundColor: '#ffffff'
    }]
  };

  const renderZeroUIEditor = (customTemplate = basicTemplate) => {
    return render(
      <TemplateEditorProvider initialData={{ template: customTemplate }}>
        <DragDropProvider>
          <ZeroUIEditing />
        </DragDropProvider>
      </TemplateEditorProvider>
    );
  };

  it('renders the zero UI interface', () => {
    renderZeroUIEditor();
    const zeroUIContainer = screen.getByTestId('zero-ui-container');
    expect(zeroUIContainer).toBeInTheDocument();
  });

  it('correctly auto-aligns content to template structure', async () => {
    // Set up a template with multiple elements for alignment testing
    const templateWithMultipleElements = {
      ...basicTemplate,
      sections: [{
        ...basicTemplate.sections[0],
        elements: [
          ...basicTemplate.sections[0].elements,
          {
            id: 'text2',
            type: 'text',
            content: 'Second Text',
            x: 48, // Slightly misaligned
            y: 200,
            width: 200,
            height: 100,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            hidden: false
          }
        ]
      }]
    };
    
    renderZeroUIEditor(templateWithMultipleElements);
    
    // Trigger auto-alignment
    const autoAlignButton = screen.getByTestId('auto-align-button');
    fireEvent.click(autoAlignButton);
    
    // Check if elements are aligned
    await waitFor(() => {
      const text1 = screen.getByTestId('element-text1');
      const text2 = screen.getByTestId('element-text2');
      
      const text1Style = window.getComputedStyle(text1);
      const text2Style = window.getComputedStyle(text2);
      
      expect(text1Style.left).toBe(text2Style.left); // Should be aligned
    });
  });

  it('processes voice commands correctly', async () => {
    renderZeroUIEditor();
    
    // Find voice command button
    const voiceButton = screen.getByTestId('voice-command-button');
    expect(voiceButton).toBeInTheDocument();
    
    // Click to start voice recognition
    fireEvent.click(voiceButton);
    
    // Verify recognition started
    expect(mockSpeechRecognition.start).toHaveBeenCalled();
    
    // Simulate voice recognition result
    act(() => {
      // Find the registered event listener and simulate a result
      const resultCallback = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )[1];
      
      // Create a mock result event
      const mockResultEvent = {
        results: [
          [{ transcript: 'add text hello world' }]
        ],
        resultIndex: 0
      };
      
      // Call the callback with the mock event
      resultCallback(mockResultEvent);
    });
    
    // Verify new text element was added
    await waitFor(() => {
      const newTextElement = screen.getByText('hello world');
      expect(newTextElement).toBeInTheDocument();
    });
  });

  it('detects user intent from interactions', async () => {
    renderZeroUIEditor();
    
    // Find the text element
    const textElement = screen.getByTestId('element-text1');
    
    // Simulate rapid back-and-forth dragging (indecisive user)
    fireEvent.mouseDown(textElement, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 100, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 60, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 90, clientY: 50 });
    fireEvent.mouseUp(document);
    
    // Intent detection should offer help
    await waitFor(() => {
      const intentHelp = screen.getByTestId('intent-assistance');
      expect(intentHelp).toBeInTheDocument();
      expect(intentHelp).toHaveTextContent(/need help positioning/i);
    });
  });

  it('provides intelligent positioning suggestions', async () => {
    renderZeroUIEditor();
    
    // Find the text element
    const textElement = screen.getByTestId('element-text1');
    
    // Select it
    fireEvent.click(textElement);
    
    // Wait for AI suggestions to appear
    await waitFor(() => {
      const positioningSuggestions = screen.getByTestId('positioning-suggestions');
      expect(positioningSuggestions).toBeInTheDocument();
      
      // Should have at least one suggestion button
      const suggestionButtons = screen.getAllByRole('button', { 
        name: /suggestion/i 
      });
      expect(suggestionButtons.length).toBeGreaterThan(0);
    });
    
    // Click on a suggestion
    const firstSuggestion = screen.getByTestId('suggestion-1');
    fireEvent.click(firstSuggestion);
    
    // Element should be repositioned
    await waitFor(() => {
      const newStyle = window.getComputedStyle(textElement);
      expect(parseInt(newStyle.left)).not.toBe(50); // Original position was 50px
    });
  });

  it('responds to voice shortcuts for canvas manipulation', async () => {
    renderZeroUIEditor();
    
    // Start voice recognition
    const voiceButton = screen.getByTestId('voice-command-button');
    fireEvent.click(voiceButton);
    
    // Simulate voice command for centering
    act(() => {
      const resultCallback = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )[1];
      
      resultCallback({
        results: [
          [{ transcript: 'center text' }]
        ],
        resultIndex: 0
      });
    });
    
    // Verify text was centered
    await waitFor(() => {
      const textElement = screen.getByTestId('element-text1');
      const canvasWidth = screen.getByTestId('canvas-container').clientWidth;
      const textWidth = textElement.clientWidth;
      const expectedLeft = (canvasWidth - textWidth) / 2;
      
      const textStyle = window.getComputedStyle(textElement);
      expect(Math.abs(parseInt(textStyle.left) - expectedLeft)).toBeLessThan(5); // Allow small rounding differences
    });
  });

  it('makes automatic adjustments to maintain aesthetics', async () => {
    // Create a template with imbalanced elements
    const imbalancedTemplate = {
      ...basicTemplate,
      sections: [{
        ...basicTemplate.sections[0],
        elements: [
          ...basicTemplate.sections[0].elements,
          {
            id: 'text2',
            type: 'text',
            content: 'Off-balance Text',
            x: 300,
            y: 50,
            width: 200,
            height: 100,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            hidden: false
          }
        ]
      }]
    };
    
    renderZeroUIEditor(imbalancedTemplate);
    
    // Trigger auto-aesthetic adjustment
    const balanceButton = screen.getByTestId('balance-composition-button');
    fireEvent.click(balanceButton);
    
    // Check if layout was balanced
    await waitFor(() => {
      const text1 = screen.getByTestId('element-text1');
      const text2 = screen.getByTestId('element-text2');
      
      const text1Left = parseInt(window.getComputedStyle(text1).left);
      const text2Left = parseInt(window.getComputedStyle(text2).left);
      
      // Elements should be more evenly distributed
      expect(Math.abs(text2Left - text1Left)).toBeLessThan(250); // Was 250px apart originally
    });
  });

  it('provides error handling for speech recognition', async () => {
    renderZeroUIEditor();
    
    // Start voice recognition
    const voiceButton = screen.getByTestId('voice-command-button');
    fireEvent.click(voiceButton);
    
    // Simulate speech recognition error
    act(() => {
      const errorCallback = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      
      errorCallback({ error: 'not-allowed' });
    });
    
    // Error message should be displayed
    await waitFor(() => {
      const errorMessage = screen.getByTestId('voice-error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent(/microphone access/i);
    });
  });
}); 