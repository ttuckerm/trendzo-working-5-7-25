import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Ensure Node.js runtime so we can read local snapshot files
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function injectBaseHref(html: string, baseUrl: string): string {
  try {
    const hasHead = /<head[^>]*>/i.test(html);
    const hasBase = /<base\s+href=/i.test(html);
    const baseTag = `<base href="${baseUrl.replace(/"/g, '&quot;')}">`;
    if (hasHead) {
      if (!hasBase) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${baseTag}`);
      return html;
    }
    // No <head>; create minimal head with base
    return html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${baseTag}</head>`);
  } catch {
    return html;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Read optional target URL from request body; default to relume
    let targetUrl = 'https://www.relume.io/';
    try {
      const incoming = await req.json();
      if (incoming && typeof incoming.url === 'string' && incoming.url.startsWith('http')) {
        targetUrl = incoming.url;
      }
    } catch {}

    // First attempt: Firecrawl (if key present)
    let html: string | undefined;
    const apiKey = process.env.FIRECRAWL_API_KEY || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ url: targetUrl, formats: ['html'] }),
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          // Handle multiple possible Firecrawl response formats
          html = (
            data?.html || 
            data?.data?.[0]?.html || 
            data?.data?.html || 
            (Array.isArray(data?.data) && data.data.length > 0 ? data.data[0]?.html : undefined) ||
            ''
          ) as string;
        } else {
          const error = await response.text();
          console.error('Firecrawl API error:', error);
          // Don't fail here - fall through to direct fetch fallback
        }
      } catch (e) {
        console.error('Firecrawl request failed:', e);
      }
    }

    // Fallback: direct fetch of the target page (best-effort)
    if (!html) {
      try {
        const resp2 = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.141 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          redirect: 'follow',
          cache: 'no-store',
        });
        if (resp2.ok) {
          const raw = await resp2.text();
          html = raw;
        }
      } catch (e) {
        console.error('Direct fetch failed:', e);
      }
    }

    // No local snapshot fallbacks. If Firecrawl and direct fetch both fail, return 502.

    if (!html) {
      return NextResponse.json({ error: 'clone_failed_all_methods' }, { status: 502 });
    }

    // If we loaded a local snapshot, prefer its canonical base; otherwise use targetUrl
    const base = html && /<base\s+href=/i.test(html) ? (html.match(/<base\s+href="([^"]+)"/i)?.[1] || targetUrl) : targetUrl;
    const withBase = injectBaseHref(html, base);
    const customized = applyMinimalCustomizations(withBase);
    const source = apiKey && withBase ? 'firecrawl_or_direct' : (!apiKey && withBase ? 'direct' : 'snapshot');
    return NextResponse.json({ html: customized, meta: { source, url: base } });
  } catch (error) {
    console.error('Clone error:', error);
    return NextResponse.json({ 
      error: 'clone_exception', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Inject a tiny script to change only the hero heading, subheading, and input placeholder
function applyMinimalCustomizations(raw: string): string {
  try {
    const headingHtml = 'See If Your Video<br>Goes Viral - Before Posting';
    const subheading = 'Upload your draft video to our AI and instantly get your free Viral Score + 3 quick fixes.';
    const placeholder = 'Enter your email to get instant access...';

    const script = `<script>document.addEventListener('DOMContentLoaded',function(){try{\n`+
      `var headingHtml=${JSON.stringify(headingHtml)};\n`+
      `var sub=${JSON.stringify(subheading)};\n`+
      `var holder=${JSON.stringify(placeholder)};\n`+
      // Target only h1 that currently has the known text
      `var h; var hs=document.querySelectorAll('h1');\n`+
      `for(var i=0;i<hs.length;i++){if(/Websites designed/i.test((hs[i].textContent||''))){h=hs[i];break;}}\n`+
      `if(h){h.innerHTML=headingHtml;}\n`+
      // Target a paragraph that contains the known subheading phrase
      `var p; var ps=document.querySelectorAll('p');\n`+
      `for(var j=0;j<ps.length;j++){if(/Use AI as your design ally/i.test((ps[j].textContent||''))){p=ps[j];break;}}\n`+
      `if(p){p.textContent=sub;}\n`+
      // Update only the specific input placeholder text
      `var inputs=document.querySelectorAll('input[placeholder],textarea[placeholder]');\n`+
      `for(var k=0;k<inputs.length;k++){var ph=inputs[k].getAttribute('placeholder')||''; if(/Describe a company/i.test(ph)){inputs[k].setAttribute('placeholder', holder); break;}}\n`+
      `}catch(e){}}, { once: true });</script>`;

    if (/<\/body>/i.test(raw)) return raw.replace(/<\/body>/i, script + '</body>');
    return raw + script;
  } catch {
    return raw;
  }
}
