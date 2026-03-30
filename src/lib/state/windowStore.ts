import { create } from 'zustand';

export type WindowKey =
  | 'recipeBook'
  | 'analyzer'
  | 'predictor'
  // Canvas panels/windows
  | 'dashboard'
  | 'scripts'
  | 'optimize'
  | 'abtest'
  | 'inception'
  | 'validate'
  | 'preview';

export type WindowState = {
  id: WindowKey;
  isOpen: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
};

type WindowsStore = {
  windows: Record<WindowKey, WindowState>;
  zCounter: number;
  open: (id: WindowKey) => void;
  close: (id: WindowKey) => void;
  bringToFront: (id: WindowKey) => void;
  move: (id: WindowKey, x: number, y: number) => void;
  resize: (id: WindowKey, width: number, height: number) => void;
};

const initialState: Record<WindowKey, WindowState> = {
  recipeBook: { id: 'recipeBook', isOpen: false, x: 120, y: 80, width: 920, height: 640, z: 1 },
  analyzer: { id: 'analyzer', isOpen: false, x: 160, y: 120, width: 800, height: 560, z: 0 },
  predictor: { id: 'predictor', isOpen: false, x: 200, y: 140, width: 800, height: 560, z: 0 },
  // Canvas windows defaults
  dashboard: { id: 'dashboard', isOpen: false, x: 140, y: 100, width: 860, height: 540, z: 0 },
  scripts: { id: 'scripts', isOpen: false, x: 160, y: 120, width: 720, height: 520, z: 0 },
  optimize: { id: 'optimize', isOpen: false, x: 180, y: 140, width: 720, height: 520, z: 0 },
  abtest: { id: 'abtest', isOpen: false, x: 200, y: 160, width: 720, height: 520, z: 0 },
  inception: { id: 'inception', isOpen: false, x: 220, y: 180, width: 720, height: 520, z: 0 },
  validate: { id: 'validate', isOpen: false, x: 240, y: 120, width: 520, height: 560, z: 0 },
  preview: { id: 'preview', isOpen: false, x: 480, y: 120, width: 720, height: 720, z: 0 },
};

export const useWindowsStore = create<WindowsStore>((set, get) => ({
  windows: initialState,
  zCounter: 2,
  open: (id) => set((state) => {
    const nextZ = state.zCounter + 1;
    return {
      zCounter: nextZ,
      windows: {
        ...state.windows,
        [id]: { ...state.windows[id], isOpen: true, z: nextZ },
      },
    };
  }),
  close: (id) => set((state) => ({
    windows: { ...state.windows, [id]: { ...state.windows[id], isOpen: false } },
  })),
  bringToFront: (id) => set((state) => {
    const nextZ = state.zCounter + 1;
    return {
      zCounter: nextZ,
      windows: {
        ...state.windows,
        [id]: { ...state.windows[id], z: nextZ },
      },
    };
  }),
  move: (id, x, y) => set((state) => ({
    windows: { ...state.windows, [id]: { ...state.windows[id], x, y } },
  })),
  resize: (id, width, height) => set((state) => ({
    windows: { ...state.windows, [id]: { ...state.windows[id], width, height } },
  })),
}));


