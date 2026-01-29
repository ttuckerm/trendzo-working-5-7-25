# ViralLab Telemetry Chrome Extension (MV3)

- Load in Chrome: chrome://extensions → Enable Developer mode → Load unpacked → select this folder.
- Set API URL to: http://localhost:3000/api/telemetry/first_hour_plugin
- Paste API Key (starts with TK_TLM_) from admin.
- Fill fields and click Send. Status shows success/error.

Security: Keys are stored in chrome.storage.sync. Rotate/revoke from Admin.
