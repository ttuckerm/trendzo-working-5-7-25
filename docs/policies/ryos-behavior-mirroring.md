## ryOS Behavior Mirroring Policy (AGPL-safe)

Purpose
- Mirror the observable interaction patterns, motion feel, and UX rhythms of ryOS while strictly using our own stack, design tokens, and Unicorn UX principles.
- This is behavioral reimplementation based on public observation, not code reuse.

Sources for observation (no code reuse)
- README only: `https://github.com/ryokun6/ryos`
- Live site for behavior study: `https://os.ryo.lu`
- Workspace notes referencing “Git Ryo Lu Design” are for behavior inference only

License and compliance
- ryOS is AGPL-3.0. We do not copy or adapt any of its source code, CSS, assets, or proprietary strings.
- Only mirror high-level behaviors (flows, patterns, timings, state transitions) inferred from publicly observable UX.
- Never paste or paraphrase ryOS code; do not rely on internal identifiers or assets.
- This policy governs contributions; CI will enforce a guard against accidental inclusion of disallowed terms in `src/`.

Our stack and constraints
- Use our stack (Next.js/React/TypeScript), Tailwind tokens from `tailwind.config.ts`, and shared components.
- Follow Unicorn UX principles; do not introduce off-system styles or ad-hoc tokens.
- Prefer additive changes. Do not remove working patterns without an explicit migration plan.

Patterns to mirror (behavior only)
- Windowing: multi-window management, focus/z-index stacking, snap/resize handles, quick open/close.
- Chrome: retain our chrome; mirror affordances (menu/taskbar focus, app activation, window controls feel).
- Views: icon/list grid spacing feel, selection states, drag-select lasso, hover/focus behaviors.
- Motion: fast, crisp micro-interactions using transform/opacity for GPU-friendly transitions.
- Theme system: switchable themes as a behavioral reference; implement via our variables/tokens; no imported assets.
- Sounds (optional, feature-flagged): subtle open/close/notify; provide user controls.
- Persistence: local-first virtual file state with backup/restore (export/import JSON).
- System-wide assistant affordance: contextual presence that reads active app context (no persona cloning).
- Wallpapers: theme-specific defaults as a concept; use our assets/placeholders mapped to tokens.

Timings and motion scale (tokenized)
- Window open/close: 160–220ms (ease-out on open, ease-in on close)
- Drag/resize feedback: immediate with 60–90ms settle
- Hover/focus: 80–120ms ease-out
- Menu/taskbar pop: 120–150ms; consider cubic-bezier(0.2, 0.8, 0.2, 1)
- Centralize durations/easings in a motion scale mapped to our Tailwind tokens

Implementation requirements
- Use only our tokens and component primitives; extend tokens via design-system PR when needed.
- Theming via CSS variables mapped to tokens; no hard-coded theme values.
- A11y: roles, labels, focus management, keyboard navigation parity.
- Predictable, testable state; avoid hidden globals.
- TypeScript-first; explicit prop types; no `any`.
- Performance: target 60fps; memoize and avoid unnecessary re-renders.
- Feature flags for sounds/advanced visuals; graceful degradation on low-power devices.

Outputs required
- Short plan mapping mirrored behaviors to concrete files/components in our codebase.
- Code using our tokens/components only; no ryOS code or assets.
- Centralized motion/theme config (durations, easings) expressed in our tokens.
- Tests for windowing logic and critical interactions (focus, keyboard, resize, persistence).
- Accessibility notes and a brief QA script for manual verification.

Guardrails
- If an observed ryOS behavior is unclear, choose a sensible default consistent with Unicorn UX and note the choice.
- If a behavior conflicts with our patterns, prefer ours and document the deviation.
- Do not include any third-party assets, fonts, icons, or sounds from ryOS.
- Do not mimic persona or copy tone guidelines; only mirror interaction feel.

Acceptance checklist (PRs should meet these)
- Uses only our tokens/components; no imported ryOS code/assets.
- Windowing/menu/taskbar affordances feel crisp and responsive with tokenized motion.
- Theme switching wired via variables/tokens; no hard-coded theme values.
- Local persistence works and is recoverable via backup/restore.
- Keyboard/focus and screen reader flows validated.
- Code is typed, organized, and tested; performance is smooth on mid-tier devices.


