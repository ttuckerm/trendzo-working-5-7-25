## ryOS Parity Reference (Behavior Only)

Scope
- Mirror public, observable interaction patterns from ryOS in our `/os-canvas` area without copying code/assets.
- Use our Tailwind tokens, Unicorn UX, and existing components/state.

Key Areas and Decisions

1) Layout & Windowing
- Parity Decision: must-match
- Behaviors
  - Multi-window focus and z-index stacking
  - Drag to move, corner/edge drag to resize with snap feel
  - Quick open/close with tokenized motion
- Concrete Timings
  - Open: 180ms ease-out
  - Close: 160ms ease-in
  - Resize settle: 80ms ease-out
  - Bring-to-front focus ring fade: 100ms ease-out
- Keyboard
  - Toggle window: Ctrl/Cmd+J (example for Recipe Book)
  - Cycle focus: Alt+` (next window), Alt+Shift+` (prev)
  - Move window 10px: Alt+Arrow keys; Resize 10px: Alt+Shift+Arrow keys
- A11y
  - Focus trap within active window; Escape closes if allowed; ARIA role="dialog" with labelledby

2) Dock/Menu/Chrome
- Parity Decision: inspired
- Behaviors
  - Dock with app icons, active indicator, click to open/focus
  - Window controls (close/minimize) feel like OS chrome but keep our visual design
- Concrete Timings
  - Dock pop/tooltip: 130ms ease-out
  - Minimize/restore: 200ms ease-in-out
- Keyboard
  - Dock focus: Ctrl/Cmd+K to open command/menu palette (existing); Arrow navigate; Enter activate
- A11y
  - Buttons with aria-label; tooltip has role="tooltip" and is labelled

3) Motion & Micro-interactions
- Parity Decision: must-match
- Behaviors
  - GPU-friendly transitions using transform/opacity only
  - Hover states with quick in/out and slight scale or shadow lift
- Concrete Timings
  - Hover in: 100ms ease-out; Hover out: 80ms ease-in
  - Button press ripple/scale: 90ms ease-out
  - Context menu appear: 140ms ease-out

4) Keyboard Model
- Parity Decision: must-match
- Shortcuts (proposal)
  - Global: Ctrl/Cmd+P (search), Ctrl/Cmd+K (palette), Esc (close context)
  - Window ops: Alt+` cycle windows; Alt+Shift+` reverse; Alt+Arrows move; Alt+Shift+Arrows resize
  - App: Ctrl/Cmd+J toggles Recipe Book window
- Rationale
  - Matches observed OS-like flows; does not conflict with our existing shortcuts

5) Accessibility
- Parity Decision: must-match
- Requirements
  - Tab order stable; roving tabindex for dock icons
  - Dialog/window roles with labelledby/-describedby
  - Focus outline visible; no keyboard trap without escape path
  - Reduced motion: respects prefers-reduced-motion and lengthens/removes transitions

6) Persistence & Restore
- Parity Decision: inspired
- Behaviors
  - Remember open windows, positions, and sizes (localStorage)
  - Offer export/import JSON for backup/restore

Concrete Defaults (Tokenize in motion/theme config)
- Durations: 80ms, 100ms, 130ms, 140ms, 160ms, 180ms, 200ms
- Easing primary: cubic-bezier(0.2, 0.8, 0.2, 1); secondary: ease-in, ease-out

Diff Plan (files under `/os-canvas`)
- src/app/os-canvas/page.tsx
  - Add motion provider and tokenized timing variables
  - Wire global hotkeys for window cycle/toggle

- src/lib/state/windowStore.ts (or equivalent)
  - Extend state for z-index stack, minimized state, and persistence (localStorage)
  - Actions: bringToFront, minimize, restore, toggle(appId)

- src/components/canvas/Canvas.tsx
  - Provide focus ring portal layer; reduced-motion handling
  - Pointer capture helpers for resize/drag with settle timeout (80ms)

- src/components/dock/Dock.tsx
  - Add active indicators, roving tabindex, aria-labels
  - Tooltip timing 130ms; keyboard navigation

- src/components/windows/WindowShell.tsx (new)
  - Reusable chrome (close/minimize), header drag handle, resize handles
  - Props: id, title, minW/H, children; motion hooks for open/close

- src/components/windows/RecipeBookWindow.tsx
  - Migrate into WindowShell
  - Add keyboard resize/move, focus trap, ARIA labelling

- src/styles/motion.css (or theme tokens)
  - Export motion scale tokens and easings

Test & QA
- Unit: windowStore actions (bringToFront/minimize/restore/toggle, persistence)
- Integration: keyboard navigation focus cycle; resize/move settle
- Manual QA script covering open/close timing, dock navigation, a11y roles, reduced motion

Notes
- Behavior-only mirroring per policy; no code/assets from ryOS used.


