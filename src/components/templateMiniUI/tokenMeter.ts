import { createStore } from "zustand/vanilla";

export interface TokenUsage {
  softCap: number;
  hardCap: number;
  used: number;
}

export interface TokenMeterState {
  workspaceId: string;
  renderTokens: TokenUsage;
  lastError?: string;
}

export type TokenMeterActions = {
  charge: (tokens: number) => { ok: boolean; error?: string };
  setCaps: (softCap: number, hardCap: number) => void;
  reset: () => void;
};

export type TokenMeterStore = ReturnType<typeof createTokenMeter>;

export function createTokenMeter(params: { workspaceId: string; softCap: number; hardCap: number }) {
  type State = TokenMeterState & TokenMeterActions;
  const store = createStore<State>()((set, get) => ({
    workspaceId: params.workspaceId,
    renderTokens: { softCap: params.softCap, hardCap: params.hardCap, used: 0 },
    charge: (tokens) => {
      const s = get();
      const nextUsed = s.renderTokens.used + tokens;
      if (nextUsed > s.renderTokens.hardCap) {
        const err = "hard_cap_exceeded";
        set({ lastError: err });
        return { ok: false, error: err };
      }
      if (nextUsed > s.renderTokens.softCap) {
        set({ renderTokens: { ...s.renderTokens, used: nextUsed }, lastError: "soft_cap_exceeded" });
        return { ok: true, error: "soft_cap_exceeded" };
      }
      set({ renderTokens: { ...s.renderTokens, used: nextUsed }, lastError: undefined });
      return { ok: true };
    },
    setCaps: (softCap, hardCap) => set((s) => ({ renderTokens: { ...s.renderTokens, softCap, hardCap } })),
    reset: () => set((s) => ({ renderTokens: { ...s.renderTokens, used: 0 }, lastError: undefined })),
  }));
  return store;
}


