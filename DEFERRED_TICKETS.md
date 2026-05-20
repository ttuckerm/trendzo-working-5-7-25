# Deferred Tickets

Items deferred from in-flight work. Each entry lists what was found, why it
wasn't fixed in the moment, and what the next person needs to decide.

---

## CSP dead code in funnel deploy (discovered 2026-05-20 during Meta Pixel install pre-flight)

`src/lib/security/security-headers.ts` declares `SecurityPresets.PRODUCTION` with a full Content-Security-Policy, but `withSecurity()` and `applySecurityHeaders` have zero call sites anywhere in the repo. Funnel pages ship with no CSP header at all.

Decide: either wire `withSecurity()` into `src/middleware.ts` (and verify every funnel surface still works under the resulting CSP — Stripe Checkout, Beehiiv, Firebase auth, Freedom Agent streaming), or delete the dead preset to remove the false sense of security.

Not urgent. Not load-bearing today.
