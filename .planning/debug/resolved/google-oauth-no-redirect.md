---
status: resolved
trigger: "Google OAuth sign-in not redirecting - button shows 'Signing in...' but no redirect to Google happens"
created: 2026-01-21T12:00:00Z
updated: 2026-01-21T12:25:00Z
---

## Current Focus

hypothesis: AuthProvider not mounted in app hierarchy - useContext returns default empty function
test: Verify AuthProvider is missing from app providers chain
expecting: AuthProvider not present in layout/providers hierarchy
next_action: Add AuthProvider to providers.tsx to wrap the app

## Symptoms

expected: Click "Sign in with Google" → redirect to Google OAuth consent screen → return to app authenticated
actual: Click button → shows "Signing in..." → stays on page → after 5 seconds shows error "Redirect to Google did not happen"
errors: Console shows "AuthForm: Calling signInWithGoogle..." and "AuthForm: signInWithGoogle completed, should redirect now" but NO logs from inside the signInWithGoogle function (no "=== GOOGLE SIGN IN START ===" visible)
reproduction: Go to localhost:3003/auth, click "Sign in with Google" button
started: After migrating from Firebase to Supabase auth

## Eliminated

[none yet]

## Evidence

- timestamp: 2026-01-21T12:15:00Z
  checked: src/app/providers.tsx and src/app/_app.tsx
  found: Neither file includes AuthProvider - providers.tsx has ThemeProvider, FeatureProvider, SubscriptionProvider, AnimationProvider, AudioProvider, AudioVisualProvider but NO AuthProvider
  implication: useContext(AuthContext) returns default context value with no-op functions

- timestamp: 2026-01-21T12:16:00Z
  checked: src/lib/contexts/AuthContext.tsx default context value (lines 48-59)
  found: Default context has `signInWithGoogle: async () => {}` which is an empty no-op function
  implication: When AuthProvider is not mounted, calling signInWithGoogle does nothing - explains why console shows "AuthForm: signInWithGoogle completed" but no "=== GOOGLE SIGN IN START ===" logs

- timestamp: 2026-01-21T12:17:00Z
  checked: Two different AuthContext files exist
  found: src/contexts/AuthContext.tsx (older, simpler) and src/lib/contexts/AuthContext.tsx (newer, has Google OAuth)
  implication: The useAuth hook imports from src/lib/contexts/AuthContext.tsx which is the correct one with Google support, but the provider is never mounted

- timestamp: 2026-01-21T12:18:00Z
  checked: src/lib/hooks/useAuth.ts
  found: imports AuthContext from "../contexts/AuthContext" which correctly resolves to src/lib/contexts/AuthContext.tsx
  implication: The hook is pointing to the right context, but the provider isn't in the component tree

## Resolution

root_cause: AuthProvider from src/lib/contexts/AuthContext.tsx was never mounted in the application's provider hierarchy. The useAuth() hook called useContext(AuthContext) which returned the default context value containing no-op empty functions (`signInWithGoogle: async () => {}`). This is why clicking the button showed logs from AuthForm but NOT from the actual signInWithGoogle function - the real function was never being called.

fix: Added AuthProvider import and wrapped it in the provider chain in src/app/providers.tsx. AuthProvider is now mounted between ThemeProvider and FeatureProvider, ensuring all components using useAuth() receive the actual authentication functions.

verification: TypeScript compilation passes for providers.tsx. The AuthProvider will now properly provide the signInWithGoogle function from src/lib/contexts/AuthContext.tsx to all child components via context.

files_changed:
  - src/app/providers.tsx: Added AuthProvider import and wrapped children in AuthProvider component
