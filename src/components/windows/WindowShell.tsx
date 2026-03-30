"use client";

import React, { PropsWithChildren, useEffect } from 'react';
import Draggable from 'react-draggable';
import { X, Minus } from 'lucide-react';
import { useWindowsStore, WindowKey } from '@/lib/state/windowStore';
import { transitions } from '@/styles/motion';

type WindowShellProps = {
  id: WindowKey;
  title: string;
  minWidth?: number;
  minHeight?: number;
  onClose?: () => void;
  onMinimize?: () => void;
};

export function WindowShell({ id, title, minWidth = 420, minHeight = 300, onClose, onMinimize, children }: PropsWithChildren<WindowShellProps>) {
  const state = useWindowsStore();
  const wnd = state.windows[id];

  useEffect(() => {
    // Bring to front when opening
    if (wnd?.isOpen) state.bringToFront(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wnd?.isOpen]);

  if (!wnd?.isOpen) return null;

  const onStart = () => state.bringToFront(id);
  const onDrag = (_e: any, data: any) => state.move(id, data.x, data.y);

  const onResize = (evt: React.MouseEvent<HTMLDivElement>) => {
    const startX = evt.clientX;
    const startY = evt.clientY;
    const startW = wnd.width;
    const startH = wnd.height;
    const onMove = (e: MouseEvent) => {
      const dw = Math.max(minWidth, startW + (e.clientX - startX));
      const dh = Math.max(minHeight, startH + (e.clientY - startY));
      state.resize(id, dw, dh);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const close = () => {
    state.close(id);
    onClose?.();
  };

  return (
    <Draggable position={{ x: wnd.x, y: wnd.y }} onStart={onStart} onDrag={onDrag} handle={`.wnd-${id}-header`}>
      <div
        className="fixed"
        style={{ width: wnd.width, height: wnd.height, zIndex: wnd.z }}
        onMouseDown={() => state.bringToFront(id)}
      >
        <div
          className="flex h-full w-full flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`wnd-${id}-title`}
          style={{
            ...transitions.medium,
            background: 'var(--panel-bg)',
            backdropFilter: `blur(var(--blur))`,
            WebkitBackdropFilter: `blur(var(--blur))`,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-chrome)'
          }}
        >
          <div className={`wnd-${id}-header flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2`} role="toolbar" aria-label="Window controls">
            <div id={`wnd-${id}-title`} className="select-none text-sm font-semibold text-white">{title}</div>
            <div className="ml-auto flex items-center gap-1">
              <button
                aria-label="Minimize"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                onClick={onMinimize}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                onClick={close}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">{children}</div>
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
            onMouseDown={onResize}
            aria-label="Resize"
            role="separator"
          />
        </div>
      </div>
    </Draggable>
  );
}



