import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DARK_MODE_CSS = `
<style id="dark-mode-override">
  /* Dark mode overrides */
  html, body, .page-wrapper, .rl-body {
    background-color: #0a0a0a !important;
    color: #e5e5e5 !important;
  }

  /* Override white/light backgrounds */
  [style*="background-color: rgb(255"],
  [style*="background-color:#fff"],
  [style*="background-color: white"],
  [style*="background: rgb(255"],
  [style*="background:#fff"],
  [style*="background: white"],
  .section, .container, .w-container {
    background-color: #0a0a0a !important;
  }

  /* Dark cards and surfaces */
  [style*="background-color: rgb(241"],
  [style*="background-color: rgb(247"],
  [style*="background-color: rgb(250"],
  [style*="background: rgb(241"],
  [style*="background: rgb(247"],
  [style*="background: rgb(250"] {
    background-color: #1a1a1a !important;
  }

  /* Text colors */
  h1, h2, h3, h4, h5, h6, p, span, a, li, label, div {
    color: #e5e5e5 !important;
  }

  /* Links - keep them visible */
  a:hover {
    color: #a5a5ff !important;
  }

  /* Borders */
  [style*="border-color"], hr {
    border-color: #333 !important;
  }

  /* Input fields */
  input, textarea, select {
    background-color: #1a1a1a !important;
    color: #e5e5e5 !important;
    border-color: #333 !important;
  }

  /* Buttons - preserve accent colors but ensure visibility */
  button, .button, [class*="button"], .w-button {
    color: #fff !important;
  }

  /* Navigation */
  nav, .navbar, [class*="navbar"], .nav-menu, header {
    background-color: #0a0a0a !important;
  }

  /* Footer */
  footer, [class*="footer"] {
    background-color: #0a0a0a !important;
  }

  /* Cards and modals */
  [class*="card"], [class*="modal"], [class*="popup"] {
    background-color: #1a1a1a !important;
  }

  /* Dropdown menus */
  [class*="dropdown"], .w-dropdown-list {
    background-color: #1a1a1a !important;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  ::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
</style>
`;

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'clones', 'relume-builder', 'FULL_STRUCTURE.html');
    let html = await fs.readFile(filePath, 'utf-8');

    // Inject dark mode CSS into the head
    html = html.replace('</head>', `${DARK_MODE_CSS}</head>`);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Failed to load mockup:', error);
    return NextResponse.json({ error: 'Failed to load mockup' }, { status: 500 });
  }
}
