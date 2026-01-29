// Placeholder DOM sniffing for TikTok analytics (stubbed selectors)
// const viewsEl = document.querySelector('div[data-e2e="video-views"]')
// const likesEl = document.querySelector('strong[data-e2e="like-count"]')
// Example: parse textContent to numbers

function parseNumber(text){ if(!text) return 0; const m = String(text).replace(/[,\s]/g,''); const k = m.toLowerCase(); if(k.endsWith('k')) return Math.round(parseFloat(k)*1000); if(k.endsWith('m')) return Math.round(parseFloat(k)*1000000); const n = Number(m); return isNaN(n)?0:n }

function trySniff(){
  const telemetry = {
    // videoId: ...,
    // views: parseNumber(viewsEl?.textContent),
  }
  // Send to popup when available
  if(Object.keys(telemetry).length){
    chrome.runtime.sendMessage({ telemetry })
  }
}

setTimeout(trySniff, 2000)


