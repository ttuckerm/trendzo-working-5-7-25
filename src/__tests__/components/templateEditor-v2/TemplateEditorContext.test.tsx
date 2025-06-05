import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TemplateEditorProvider,
  useTemplateEditor,
  templateEditorReducer,
  initialState,
} from '../../../components/templateEditor-v2/TemplateEditorContext';
import { ActionType, ElementType, EditorState, Element } from '../../../components/templateEditor-v2/types';

// Test Component to consume the context
const TestConsumerComponent = () => {
  const { state, dispatch, addElement } = useTemplateEditor();
  return (
    <div>
      <div data-testid="selected-section-id">
        {state.ui.selectedSectionId || 'null'}
      </div>
      <div data-testid="element-count">
        {state.template.sections[0]?.elements.length || 0}
      </div>
      <button 
        onClick={() => {
          // Ensure there's a section to add to
          if (state.template.sections.length > 0) {
            addElement(state.template.sections[0].id, 'text');
          } else {
            // Handle case with no sections if necessary for test setup, or ensure sections exist
            console.warn('No sections available to add element');
          }
        }}
      >
        Add Text Element
      </button>
      <button onClick={() => dispatch({ type: ActionType.SELECT_SECTION, payload: 'section-test-1'})}>
        Select Test Section
      </button>
    </div>
  );
};

describe('TemplateEditorContext & Reducer', () => {
  describe('templateEditorReducer', () => {
    test('should handle ADD_ELEMENT action', () => {
      const testSectionId = 'section1';
      const action = {
        type: ActionType.ADD_ELEMENT,
        payload: { sectionId: testSectionId, type: 'text' as ElementType },
      };
      const stateWithSection: EditorState = {
        ...initialState,
        template: {
          ...initialState.template,
          sections: [
            {
              id: testSectionId,
              name: 'Test Section',
              order: 0,
              elements: [],
              backgroundColor: '#ffffff',
            },
          ],
        },
        ui: {
            ...initialState.ui,
            selectedSectionId: testSectionId, // Select the section for context
        }
      };

      const updatedState = templateEditorReducer(stateWithSection, action);
      expect(updatedState.template.sections[0].elements.length).toBe(1);
      const newElement = updatedState.template.sections[0].elements[0];
      expect(newElement.type).toBe('text');
      expect(updatedState.ui.selectedElementId).toBe(newElement.id); // Check if new element is selected
    });

    test('should handle SELECT_SECTION action', () => {
      const action = { type: ActionType.SELECT_SECTION, payload: 'section-abc' };
      const updatedState = templateEditorReducer(initialState, action);
      expect(updatedState.ui.selectedSectionId).toBe('section-abc');
    });

    // Add more reducer tests for other actions (UPDATE_ELEMENT, DELETE_ELEMENT, etc.)
  });

  describe('TemplateEditorProvider and useTemplateEditor hook', () => {
    test('provides initial state and dispatch function', () => {
      render(
        <TemplateEditorProvider>
          <TestConsumerComponent />
        </TemplateEditorProvider>
      );
      expect(screen.getByTestId('selected-section-id').textContent).toBe('sec1'); // from initial state
      expect(screen.getByTestId('element-count').textContent).toBe('1'); // from initial state
    });

    test('addElement context function dispatches correctly', () => {
        const mockDispatch = jest.fn();
        const stateWithSectionAndNoElements: EditorState = {
            ...initialState,
            template: {
                ...initialState.template,
                sections: [{
                    id: 'sec1', // Matches initial selectedSectionId
                    name: 'Initial Section',
                    order: 0,
                    elements: [], // Start with no elements for this test
                    backgroundColor: '#fff',
                }],
            },
             ui: {
                ...initialState.ui,
                selectedSectionId: 'sec1', // Ensure a section is selected
                selectedElementId: null, // No element selected initially
            }
        };

      render(
        <TemplateEditorProvider initialDataForTests={stateWithSectionAndNoElements} mockDispatchForTests={mockDispatch}>
          <TestConsumerComponent />
        </TemplateEditorProvider>
      );
      
      act(() => {
        screen.getByText('Add Text Element').click();
      });

      // Check if dispatch was called with ADD_ELEMENT type
      // The actual payload for ADD_ELEMENT through the `addElement` wrapper is more complex 
      // as it generates an ID and default properties. We check the type and if sectionId matches.
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: ActionType.ADD_ELEMENT,
        payload: expect.objectContaining({ sectionId: 'sec1', type: 'text' }),
      }));
    });

    test('dispatch function updates state via context', () => {
      render(
        <TemplateEditorProvider>
          <TestConsumerComponent />
        </TemplateEditorProvider>
      );
      act(() => {
        screen.getByText('Select Test Section').click();
      });
      expect(screen.getByTestId('selected-section-id').textContent).toBe('section-test-1');
    });
  });
}); 