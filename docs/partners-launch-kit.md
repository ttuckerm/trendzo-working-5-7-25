# Trendzo Partner Launch Kit

Getting Started
- Obtain an API key from the Developers area. Send it as X-API-Key.
- Tenants and plan gates enforced; ensure scopes templates:read, pixel:write, score:read as needed.

Zapier
- Import integrations/zapier/app.json. Use templates in integrations/zapier/templates/.

Make
- Import integrations/make/app.json. Use blueprints in integrations/make/blueprints/.

Google Sheets
- See integrations/sheets/README.md. Copy Trendzo.gs and run the menu.

Referral Tracking
- Use /api/partners/utm/generate?affiliate_code=...&campaign=... to produce UTM links. Pixel events record UTM/referral fields.

Troubleshooting
- 401: Bad API key
- 403: Tenant/plan gate
- 429: Rate limits
- Verify webhook signatures (Make returns X-TZ-Signature).

