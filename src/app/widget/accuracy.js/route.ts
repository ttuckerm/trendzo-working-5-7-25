import { NextRequest, NextResponse } from 'next/server'

function script(hostOrigin: string) {
	const badgeUrl = `${hostOrigin}/widget/badge`
	return `(() => {
	  const targetId = (document.currentScript && (document.currentScript.getAttribute('data-target')||'')) || (function(){ try { const s = document.querySelector('script[src*="/widget/accuracy.js"]'); return s ? (s.getAttribute('data-target')||'') : '' } catch { return '' } })();
	  const target = targetId ? document.getElementById(targetId) : null;
	  const mount = target || document.body;
	  function renderStatic(container) {
	    const shadow = container.attachShadow ? container.attachShadow({ mode:'open' }) : container;
	    const wrap = document.createElement('div');
	    wrap.style.cssText = 'font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;display:inline-flex;gap:8px;align-items:center;background:#fff';
	    wrap.innerHTML = '<span style="font-weight:600">Accuracy</span><span style="background:#eef2ff;color:#3730a3;font-size:12px;padding:2px 6px;border-radius:6px">--%</span><span style="font-size:12px;color:#6b7280">Validated: --</span><span style="background:#ecfeff;color:#155e75;font-size:12px;padding:2px 6px;border-radius:6px">Weather: --</span>';
	    shadow.appendChild(wrap);
	  }
	  function renderBadge(html, container) {
	    try {
	      const shadow = container.attachShadow ? container.attachShadow({ mode:'open' }) : container;
	      const frame = document.createElement('iframe');
	      frame.setAttribute('title','Trendzo Accuracy Badge');
	      frame.setAttribute('style','border:0;width:280px;height:46px;overflow:hidden;background:transparent');
	      shadow.appendChild(frame);
	      if (frame.contentDocument) {
	        frame.contentDocument.open();
	        frame.contentDocument.write(html);
	        frame.contentDocument.close();
	      } else {
	        renderStatic(container);
	      }
	    } catch { renderStatic(container); }
	  }
	  function fetchOnce() { return fetch('${badgeUrl}', { credentials:'omit' }).then(r=> r.text()) }
	  fetchOnce().then(html => renderBadge(html, mount)).catch(() => {
	    // retry once after 500ms
	    setTimeout(() => {
	      fetchOnce().then(html => renderBadge(html, mount)).catch(() => renderStatic(mount))
	    }, 500)
	  })
	})();`
}

export async function GET(req: NextRequest) {
	const origin = `${process.env.NEXT_PUBLIC_SITE_URL || ''}` || `${new URL(req.url).origin}`
	const body = script(origin)
	return new NextResponse(body, {
		headers: {
			'content-type': 'application/javascript; charset=utf-8',
			'access-control-allow-origin': '*',
			'cache-control': 'public, max-age=60'
		}
	})
}


