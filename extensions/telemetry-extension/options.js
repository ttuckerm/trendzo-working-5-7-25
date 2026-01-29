function $(id){ return document.getElementById(id) }
async function load(){ const s = await chrome.storage.sync.get(['apiUrl','apiKey']); $('apiUrl').value = s.apiUrl || 'http://localhost:3000/api/telemetry/first_hour_plugin'; $('apiKey').value = s.apiKey || '' }
async function save(){ await chrome.storage.sync.set({ apiUrl: $('apiUrl').value, apiKey: $('apiKey').value }); $('msg').textContent = 'Saved'; }
document.addEventListener('DOMContentLoaded', ()=>{ load(); $('save').addEventListener('click', save) })


