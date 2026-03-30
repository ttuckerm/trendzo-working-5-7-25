function $(id){ return document.getElementById(id) }
function nowIso(){ return new Date().toISOString() }

async function loadSettings(){
  const { apiUrl, apiKey } = await chrome.storage.sync.get(['apiUrl','apiKey'])
  $('apiUrl').value = apiUrl || 'http://localhost:3000/api/telemetry/first_hour_plugin'
  $('apiKey').value = apiKey || ''
}

async function saveSettings(){
  await chrome.storage.sync.set({ apiUrl: $('apiUrl').value, apiKey: $('apiKey').value })
  toast('Settings saved')
}

function toast(msg, ok=true){ const t=$('toast'); t.textContent=msg; t.style.color= ok? 'green':'crimson' }

async function send(){
  const url = $('apiUrl').value || 'http://localhost:3000/api/telemetry/first_hour_plugin'
  const key = $('apiKey').value
  const payload = {
    video_id: $('videoId').value || 'ext_mock_manual',
    ts_iso: $('tsIso').value || nowIso(),
    views: Number($('views').value||0),
    unique_viewers: Number($('uniqueViewers').value||0),
    avg_watch_pct: Number($('avgWatchPct').value||0),
    completion_rate: Number($('completionRate').value||0),
    rewatches: Number($('rewatches').value||0),
    shares: Number($('shares').value||0),
    saves: Number($('saves').value||0),
    comments: Number($('comments').value||0),
    source: $('source').value || 'extension'
  }
  try{
    const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key': key }, body: JSON.stringify(payload) })
    if(!res.ok){ const text = await res.text(); throw new Error(text || ('HTTP '+res.status)) }
    const js = await res.json()
    toast('Sent ✓')
  }catch(e){ toast('Error: '+(e?.message||e), false) }
}

document.addEventListener('DOMContentLoaded', ()=>{
  $('tsIso').value = nowIso()
  loadSettings()
  $('save').addEventListener('click', saveSettings)
  $('send').addEventListener('click', send)
  chrome.runtime.onMessage.addListener((msg)=>{
    if(msg?.telemetry){
      Object.entries(msg.telemetry).forEach(([k,v])=>{ const el=$(k); if(el) el.value = v })
      toast('Autofilled from page sniff')
    }
  })
})


