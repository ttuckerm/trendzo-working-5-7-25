export type UIEventKey =
  | 'canvas_open'
  | 'canvas_close'
  | 'panel_open'
  | 'panel_close'
  | 'button_hover'
  | 'preview_ready'
  | 'validation_pass'
  | 'error_toast';

export const eventToSoundKey: Record<UIEventKey, string> = {
  canvas_open: 'canvas_open',
  canvas_close: 'canvas_close',
  panel_open: 'panel_open',
  panel_close: 'panel_close',
  button_hover: 'hover_soft',
  preview_ready: 'confirm_soft',
  validation_pass: 'success',
  error_toast: 'error',
};



