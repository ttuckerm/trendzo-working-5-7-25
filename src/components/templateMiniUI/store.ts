"use client";

import { createStore } from "zustand/vanilla";

export type TemplateSlotName =
  | "hook"
  | "onScreenText"
  | "captions"
  | "hashtags"
  | "shotList"
  | "thumbnailBrief"
  | "first3sCue";

export interface TemplateSlotsState {
  hook: string;
  onScreenText: string;
  captions: string;
  hashtags: string[];
  shotList: string[];
  thumbnailBrief: string;
  first3sCue: string;
}

export interface HistoryEntry {
  description: string;
  state: TemplateSlotsState;
  ts: number;
}

export interface TemplateInstanceState {
  templateId: string;
  platform: "tiktok" | "instagram" | "youtube" | string;
  slots: TemplateSlotsState;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  isDirty: boolean;
}

export type TemplateInstanceActions = {
  setSlot: (name: TemplateSlotName, value: string | string[], description?: string) => void;
  bulkUpdate: (partial: Partial<TemplateSlotsState>, description?: string) => void;
  undo: () => void;
  redo: () => void;
  resetDirty: () => void;
};

export type TemplateInstanceStore = ReturnType<typeof createTemplateStore>;

export function createTemplateStore(params: {
  templateId: string;
  platform: TemplateInstanceState["platform"];
  initial?: Partial<TemplateSlotsState>;
}) {
  const initialState: TemplateInstanceState = {
    templateId: params.templateId,
    platform: params.platform,
    slots: {
      hook: "",
      onScreenText: "",
      captions: "",
      hashtags: [],
      shotList: [],
      thumbnailBrief: "",
      first3sCue: "",
      ...(params.initial || {}),
    },
    undoStack: [],
    redoStack: [],
    isDirty: false,
  };

  type State = TemplateInstanceState & TemplateInstanceActions;

  const store = createStore<State>()((set, get) => ({
    ...initialState,
    setSlot: (name, value, description = `update:${name}`) => {
      const prev = get();
      const snapshot: HistoryEntry = {
        description,
        state: structuredClone(prev.slots),
        ts: Date.now(),
      };
      const nextSlots = { ...prev.slots } as TemplateSlotsState;
      (nextSlots as any)[name] = value as any;
      set({
        slots: nextSlots,
        undoStack: [...prev.undoStack, snapshot],
        redoStack: [],
        isDirty: true,
      });
    },
    bulkUpdate: (partial, description = "bulkUpdate") => {
      const prev = get();
      const snapshot: HistoryEntry = {
        description,
        state: structuredClone(prev.slots),
        ts: Date.now(),
      };
      set({
        slots: { ...prev.slots, ...partial },
        undoStack: [...prev.undoStack, snapshot],
        redoStack: [],
        isDirty: true,
      });
    },
    undo: () => {
      const prev = get();
      if (prev.undoStack.length === 0) return;
      const last = prev.undoStack[prev.undoStack.length - 1];
      set({
        slots: last.state,
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [...prev.redoStack, {
          description: "redoPoint",
          state: structuredClone(prev.slots),
          ts: Date.now(),
        }],
        isDirty: true,
      });
    },
    redo: () => {
      const prev = get();
      if (prev.redoStack.length === 0) return;
      const last = prev.redoStack[prev.redoStack.length - 1];
      set({
        slots: last.state,
        redoStack: prev.redoStack.slice(0, -1),
        undoStack: [...prev.undoStack, {
          description: "undoPoint",
          state: structuredClone(prev.slots),
          ts: Date.now(),
        }],
        isDirty: true,
      });
    },
    resetDirty: () => set({ isDirty: false }),
  }));

  return store;
}


