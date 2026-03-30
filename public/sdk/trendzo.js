(function(){
  const script = document.currentScript;
  const templateId = script && script.getAttribute('data-template') || null;
  const sku = script && script.getAttribute('data-sku') || null;
  const campaignId = script && script.getAttribute('data-campaign') || null;
  const sessionId = (Math.random().toString(36).slice(2)) + Date.now();
  const platform = (function(){
    const host = location.host.toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('youtube')) return 'youtube';
    return 'web';
  })();

  function post(url, body){
    try {
      return navigator.sendBeacon(url, new Blob([JSON.stringify(body)], {type:'application/json'}));
    } catch {
      return fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    }
  }

  window.TrendzoSDK = {
    pixel: function(type, opts){
      post('/api/pixel/collect', {
        type,
        template_id: templateId || (opts && opts.template_id) || null,
        sku: sku || (opts && opts.sku) || null,
        campaign_id: campaignId || (opts && opts.campaign_id) || null,
        value_cents: (opts && opts.value_cents) || null
      });
    },
    telemetry: function(videoId, events){
      post('/api/telemetry/ingest', {
        session_id: sessionId,
        platform,
        video_id: videoId,
        events: events || []
      });
    }
  };
})();

