'use client';

import React from 'react';
import { useTemplateEditor } from './TemplateEditorContext';
import { 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Rows,
  Columns,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter
} from 'lucide-react';
import { ActionType, Template } from './types';

export const CanvasControls: React.FC = () => {
  const { state, dispatch } = useTemplateEditor();
  const { zoom, showGrid } = state.ui;
  const { aspectRatio } = state.template;

  const handleZoomIn = () => {
    dispatch({ type: ActionType.SET_ZOOM, payload: Math.min(zoom + 0.1, 3) }); // Max zoom 3x
  };

  const handleZoomOut = () => {
    dispatch({ type: ActionType.SET_ZOOM, payload: Math.max(zoom - 0.1, 0.5) }); // Min zoom 0.5x
  };

  const handleResetZoom = () => {
    dispatch({ type: ActionType.SET_ZOOM, payload: 1 });
  };

  const handleToggleGrid = () => {
    dispatch({ type: ActionType.TOGGLE_GRID });
  };
  
  const handleAspectRatioChange = (newAspectRatio: string) => {
    dispatch({ 
      type: ActionType.UPDATE_TEMPLATE, 
      payload: { aspectRatio: newAspectRatio as Template['aspectRatio'] }
    });
  };

  return (
    <div className="absolute bottom-4 right-4 flex bg-white shadow-md rounded-md overflow-hidden" data-testid="canvas-controls">
      {/* Zoom controls */}
      <button 
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100 transition-colors"
        title="Zoom out"
        data-testid="zoom-out-button"
      >
        <ZoomOut size={18} />
      </button>
      
      <div className="px-2 flex items-center justify-center border-l border-r border-gray-200">
        <span className="text-sm font-medium">
          {Math.round(zoom * 100)}%
        </span>
      </div>
      
      <button 
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 transition-colors"
        title="Zoom in"
        data-testid="zoom-in-button"
      >
        <ZoomIn size={18} />
      </button>
      
      <button 
        onClick={handleResetZoom}
        className="p-2 hover:bg-gray-100 transition-colors border-l border-gray-200"
        title="Reset zoom"
        data-testid="reset-zoom-button"
      >
        <RefreshCw size={18} />
      </button>
      
      {/* Grid toggle */}
      <button 
        onClick={handleToggleGrid}
        className={`p-2 hover:bg-gray-100 transition-colors border-l border-gray-200 ${
          showGrid ? 'bg-blue-50 text-blue-600' : ''
        }`}
        title="Toggle grid"
        data-testid="toggle-grid-button"
      >
        <Grid3X3 size={18} />
      </button>
      
      {/* Fullscreen toggle - simplified version */}
      <button 
        onClick={() => {
          // This is a simplified placeholder. A real implementation would
          // toggle fullscreen mode using the Fullscreen API
          console.log('Toggle fullscreen');
        }}
        className="p-2 hover:bg-gray-100 transition-colors border-l border-gray-200"
        title="Toggle fullscreen"
        data-testid="toggle-fullscreen-button"
      >
        {state.ui.panels.previewMode ? (
          <Minimize2 size={18} />
        ) : (
          <Maximize2 size={18} />
        )}
      </button>

      {/* Alignment tools */}
      <div className="border-l border-gray-200 flex" data-testid="alignment-tools">
        <button 
          onClick={() => {
            // Align selected elements to top
            if (state.ui.selectedElementId) {
              // This would typically call a function to align elements
              console.log('Align to top');
              // In a real implementation, this would dispatch an alignment action
            }
          }}
          className="p-2 hover:bg-gray-100 transition-colors"
          title="Align to top"
          data-testid="align-top-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <rect x="8" y="10" width="8" height="8" rx="1"></rect>
          </svg>
        </button>

        <button 
          onClick={() => {
            // Align selected elements to middle
            if (state.ui.selectedElementId) {
              console.log('Align to middle');
            }
          }}
          className="p-2 hover:bg-gray-100 transition-colors"
          title="Align to middle"
          data-testid="align-middle-button"
        >
          <AlignVerticalJustifyCenter size={18} />
        </button>

        <button 
          onClick={() => {
            // Align selected elements to bottom
            if (state.ui.selectedElementId) {
              console.log('Align to bottom');
            }
          }}
          className="p-2 hover:bg-gray-100 transition-colors"
          title="Align to bottom"
          data-testid="align-bottom-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="18" x2="20" y2="18"></line>
            <rect x="8" y="6" width="8" height="8" rx="1"></rect>
          </svg>
        </button>

        <button 
          onClick={() => {
            // Align selected elements to left
            if (state.ui.selectedElementId) {
              console.log('Align to left');
            }
          }}
          className="p-2 hover:bg-gray-100 transition-colors"
          title="Align to left"
          data-testid="align-left-button"
        >
          <AlignLeft size={18} />
        </button>

        <button 
          onClick={() => {
            // Align selected elements to center
            if (state.ui.selectedElementId) {
              console.log('Align to center');
            }
          }}
          className="p-2 hover:bg-gray-100 transition-colors"
          title="Align to center"
          data-testid="align-center-button"
        >
          <AlignCenter size={18} />
        </button>

        <button 
          onClick={() => {
            // Align selected elements to right
            if (state.ui.selectedElementId) {
              console.log('Align to right');
            }
          }}
          className="p-2 hover:bg-gray-100 transition-colors"
          title="Align to right"
          data-testid="align-right-button"
        >
          <AlignRight size={18} />
        </button>
      </div>

      {/* Aspect Ratio Controls */}
      <div className="border-l border-gray-200 flex" data-testid="aspect-ratio-controls">
        <button 
          onClick={() => handleAspectRatioChange('9:16')} 
          className={`p-2 hover:bg-gray-100 rounded-md ${aspectRatio === '9:16' ? 'bg-blue-100 text-blue-600' : ''}`}
          title="9:16 Aspect Ratio (TikTok, Reels)"
          data-testid="aspect-ratio-9-16-button"
        >
          <Rows size={18} /> <span className="ml-1 text-xs">9:16</span>
        </button>
        <button 
          onClick={() => handleAspectRatioChange('1:1')} 
          className={`p-2 hover:bg-gray-100 rounded-md ${aspectRatio === '1:1' ? 'bg-blue-100 text-blue-600' : ''}`}
          title="1:1 Aspect Ratio (Instagram Post)"
          data-testid="aspect-ratio-1-1-button"
        >
          <Square size={18} /> <span className="ml-1 text-xs">1:1</span> 
        </button>
        <button 
          onClick={() => handleAspectRatioChange('16:9')} 
          className={`p-2 hover:bg-gray-100 rounded-md ${aspectRatio === '16:9' ? 'bg-blue-100 text-blue-600' : ''}`}
          title="16:9 Aspect Ratio (YouTube Video)"
          data-testid="aspect-ratio-16-9-button"
        >
          <Columns size={18} /> <span className="ml-1 text-xs">16:9</span>
        </button>
      </div>
    </div>
  );
}; 