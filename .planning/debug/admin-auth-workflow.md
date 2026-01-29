---
status: investigating
trigger: "Admin login redirects to /dashboard instead of /admin/studio AND workflow APIs return Unauthorized"
created: 2026-01-22T10:00:00Z
updated: 2026-01-22T10:00:00Z
---

## Current Focus

hypothesis: useSearchParams() in callback-handler may need Suspense boundary, also added detailed logging
test: User logs out, logs in via /admin/login, checks browser console for log sequence
expecting: See "=== ADMIN LOGIN START ===" with intent set, then "=== CALLBACK HANDLER ===" with intent present
next_action: User tests the flow and checks console output

## Symptoms

expected:
- Admin login from /admin/login -> OAuth -> /admin/studio
- Workflow API returns user's workflows

actual:
- Admin login from /admin/login -> OAuth -> /dashboard (wrong!)
- Workflow API returns "Unauthorized" (401)

errors: "Workflow persistence error: Error: Not authenticated" at useWorkflowPersistence.ts:297:24

reproduction:
1. Go to /admin/login
2. Click "Sign in with Google"
3. Complete OAuth
4. Observe: lands on /dashboard instead of /admin/studio
5. Navigate to /admin/studio manually
6. Open workflow picker
7. See "Unauthorized" error

started: After implementing Phase 78 workflow APIs

## Eliminated

[none yet]

## Evidence

- timestamp: 2026-01-22T10:00:00Z
  checked: admin/login/page.tsx line 38-40
  found: localStorage.setItem runs BEFORE signInWithGoogle() call
  implication: Intent should be stored before OAuth redirect

- timestamp: 2026-01-22T10:01:00Z
  checked: signInWithGoogle in AuthContext.tsx line 175-185
  found: Uses signInWithOAuth which does window.location.href redirect
  implication: Full page redirect should NOT clear localStorage

- timestamp: 2026-01-22T10:02:00Z
  checked: callback-handler/page.tsx line 14-23
  found: Reads localStorage, clears it, then redirects
  implication: If localStorage is empty, falls back to /dashboard

- timestamp: 2026-01-22T10:03:00Z
  checked: auth/callback/route.ts (server)
  found: Using createServerClient with cookie handlers - SHOULD persist session
  implication: Problem may be Response not carrying cookies OR cookies function failing

## Resolution

### Issue 1: Auth Cookies Not Set on Redirect Response
root_cause: The auth callback was using `cookies()` from next/headers which sets cookies on a mutable store, BUT the `NextResponse.redirect()` creates a NEW response that doesn't include those cookies. The session cookies were being set in the void and never sent to the browser.

fix: Changed callback to collect cookies during exchangeCodeForSession, then explicitly set them on the redirect Response object using response.cookies.set()

status: FIXED (src/app/auth/callback/route.ts)

### Issue 2: Admin Redirect Going to /dashboard
root_cause: INVESTIGATING - localStorage intent mechanism may have timing/Suspense issues

fixes_applied:
1. Added Suspense boundary around useSearchParams() in callback-handler (Next.js 13+ requirement)
2. Added detailed logging to trace the localStorage flow

files_changed:
- src/app/auth/callback/route.ts (cookie fix)
- src/app/auth/callback-handler/page.tsx (Suspense + logging)
- src/app/admin/login/page.tsx (logging)

verification: PENDING - user needs to:
1. Log out completely
2. Go to /admin/login
3. Open browser DevTools Console
4. Click "Sign in with Google"
5. Complete OAuth
6. Check console for log sequence:
   - Should see "=== ADMIN LOGIN START ===" with intent=/admin/studio
   - Should see "=== CALLBACK HANDLER ===" with adminIntent=/admin/studio
7. Should land on /admin/studio
