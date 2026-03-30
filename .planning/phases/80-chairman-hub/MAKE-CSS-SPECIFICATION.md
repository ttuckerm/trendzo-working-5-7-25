# Make.com Design System - Exact CSS Specification
## Extracted from Make.com Screenshots

**Date:** February 4, 2026
**Source Screenshots:**
- `assets/c__Users_thoma_..._image-45b800cd-*.png` (full view, top half)
- `assets/c__Users_thoma_..._image-9958a9f0-*.png` (top half, zoomed)
- `assets/c__Users_thoma_..._image-d2810a6f-*.png` (bottom half, zoomed)

**Purpose:** Exact CSS values for pixel-perfect reproduction

---

## 1. SIDEBAR

### Structure
```css
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background-color: #2d2d2d;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  z-index: 50;
}
```

### Logo (Top)
```css
.sidebar-logo {
  width: 32px;
  height: 32px;
  margin-bottom: 20px;
  color: #ffffff;
  /* Trendzo "T" mark or full logo */
}
```

### "+" Add Button (Below Logo)
```css
.sidebar-add-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: 1.5px solid #666666;
  color: #999999;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 16px;
}

.sidebar-add-button:hover {
  border-color: #ffffff;
  color: #ffffff;
}
```

### Navigation Icons
```css
.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.sidebar-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #999999;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sidebar-icon svg,
.sidebar-icon-img {
  width: 20px;
  height: 20px;
}

.sidebar-icon:hover {
  color: #ffffff;
  background-color: #3a3a3a;
}

.sidebar-icon.active {
  color: #ffffff;
  background-color: #444444;
}
```

### User Avatar (Bottom)
```css
.sidebar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-top: auto;
  cursor: pointer;
}

.sidebar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

---

## 2. CANVAS (Main Background)

```css
.canvas {
  position: relative;
  margin-left: 60px; /* sidebar width */
  margin-right: 300px; /* right panel width, when open */
  min-height: 100vh;
  background-color: #f5f5f0;
  /* Very subtle warm off-white, NOT pure white, with slight green-gray tint */
  
  /* Dot grid pattern */
  background-image: radial-gradient(circle, #e0e0da 0.8px, transparent 0.8px);
  background-size: 20px 20px;
  
  overflow: auto;
  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}
```

### Alternate Canvas Background (from screenshot 3 which shows more green tint)
```css
/* If the above doesn't match closely enough, try: */
.canvas-alt {
  background-color: #f0f4ee;
  background-image: radial-gradient(circle, #dce0d8 0.8px, transparent 0.8px);
  background-size: 20px 20px;
}
```

---

## 3. NODES

### Base Node
```css
.node {
  position: absolute;
  min-width: 130px;
  min-height: 85px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
```

### Node Icon
```css
.node-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-icon img,
.node-icon svg {
  width: 36px;
  height: 36px;
}
```

### Node Text
```css
.node-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  line-height: 1.3;
  margin-bottom: 2px;
}

.node-subtitle {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #666666;
  text-align: center;
  line-height: 1.3;
}
```

### Node Color Variants (from Make.com screenshots)
```css
/* Pink/Salmon - used for Webhooks, Alerts */
.node-pink {
  background-color: #fce4ec;
  /* Alternative: rgba(252, 228, 236, 1) */
}

/* Light Blue/Teal - used for Slack, Communication */
.node-blue {
  background-color: #e3f2fd;
  /* Alternative: #e1f5fe */
}

/* White/Neutral - used for AI, Core services */
.node-white {
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
}

/* Light Green/Mint - used for Storage, Data */
.node-green {
  background-color: #e8f5e9;
  /* Alternative: #e0f2e0 */
}

/* Light Purple/Lavender - used for Design, Creative */
.node-purple {
  background-color: #f3e5f5;
  /* Alternative: #ede7f6 */
}

/* Dark/Black - used for Notion, standout services */
.node-dark {
  background-color: #1a1a1a;
  border-radius: 16px; /* slightly more rounded than others */
}

.node-dark .node-title {
  color: #ffffff;
}

.node-dark .node-subtitle {
  color: #999999;
}

/* Light Gray/Lavender - used for Discord, secondary */
.node-gray {
  background-color: #ede7f6;
}
```

### Node "+" Connection Points
```css
.node-connector {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1.5px solid #cccccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999999;
  cursor: pointer;
  z-index: 5;
}

.node-connector:hover {
  border-color: #666666;
  color: #666666;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* Positions */
.node-connector.top    { top: -9px; left: 50%; transform: translateX(-50%); }
.node-connector.bottom { bottom: -9px; left: 50%; transform: translateX(-50%); }
.node-connector.left   { left: -9px; top: 50%; transform: translateY(-50%); }
.node-connector.right  { right: -9px; top: 50%; transform: translateY(-50%); }
```

---

## 4. CONNECTION LINES

```css
/* SVG path styles for connections */
.connection-line {
  fill: none;
  stroke-width: 1.5px;
}

/* Green solid connection (primary data flow) */
.connection-line.solid-green {
  stroke: #81c784;
  /* Alternative: #a5d6a7 for lighter variant */
}

/* Blue dashed connection (secondary/webhook) */
.connection-line.dashed-blue {
  stroke: #90caf9;
  stroke-dasharray: 6 4;
}

/* Gray connection (inactive/reference) */
.connection-line.solid-gray {
  stroke: #bdbdbd;
}

/* Pink dashed connection (error/alert flow) */
.connection-line.dashed-pink {
  stroke: #ef9a9a;
  stroke-dasharray: 4 4;
}

/* Edit indicator on connection midpoint */
.connection-edit-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Arrow heads */
.connection-arrow {
  fill: none;
  stroke: inherit;
  stroke-width: 1.5px;
}
```

---

## 5. RIGHT PANEL

### Panel Container
```css
.right-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  background-color: #ffffff;
  border-left: 1px solid #eeeeee;
  display: flex;
  flex-direction: column;
  z-index: 40;
  overflow-y: auto;
}
```

### Search Bar (Top of Panel)
```css
.panel-search {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-search-input {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #fafafa;
  padding: 0 12px 0 36px;
  font-size: 13px;
  color: #333333;
  outline: none;
}

.panel-search-input:focus {
  border-color: #999999;
  background-color: #ffffff;
}

.panel-search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: #999999;
  width: 16px;
  height: 16px;
}
```

### Collapsible Sections
```css
.panel-section {
  border-bottom: 1px solid #f0f0f0;
}

.panel-section-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}

.panel-section-arrow {
  width: 16px;
  height: 16px;
  color: #999999;
  margin-right: 8px;
  transition: transform 0.2s ease;
}

.panel-section-arrow.open {
  transform: rotate(90deg);
}

.panel-section-title {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
```

### Section Category Labels
```css
.panel-category {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px 6px;
}
```

### Section List Items
```css
.panel-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.1s ease;
  gap: 12px;
}

.panel-item:hover {
  background-color: #f8f8f8;
}

.panel-item-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
}

.panel-item-text {
  flex: 1;
}

.panel-item-title {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.panel-item-description {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #888888;
  line-height: 1.4;
  margin-top: 2px;
}
```

### Expandable Sub-Section (Accordion)
```css
.panel-accordion {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-accordion:hover {
  background-color: #f8f8f8;
}

.panel-accordion-title {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.panel-accordion-arrow {
  width: 14px;
  height: 14px;
  color: #cccccc;
  transition: transform 0.2s ease;
}
```

### "AI Help" Button (Bottom)
```css
.ai-help-button {
  position: sticky;
  bottom: 0;
  margin: 16px;
  padding: 10px 16px;
  border-radius: 10px;
  background-color: #e8f5e9;
  /* Light green/mint matching canvas tint */
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.ai-help-button:hover {
  background-color: #c8e6c9;
}

.ai-help-text {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.ai-help-sparkle {
  color: #66bb6a;
  /* Green sparkle/star icon */
}

.ai-help-badge {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  background-color: #1a1a1a;
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: auto;
}
```

---

## 6. BOTTOM TOOLBAR

```css
.bottom-toolbar {
  position: fixed;
  bottom: 0;
  left: 60px; /* sidebar width */
  right: 300px; /* right panel width */
  height: 52px;
  background-color: #ffffff;
  border-top: 1px solid #eeeeee;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 30;
}
```

### Run Button (Left Side)
```css
.toolbar-run-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #1a1a1a;
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.15s ease;
}

.toolbar-run-button:hover {
  background-color: #333333;
}

.toolbar-run-icon {
  width: 0;
  height: 0;
  border-left: 8px solid #ffffff;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}
```

### Center Icon Buttons
```css
.toolbar-center {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 auto;
}

.toolbar-icon-button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888888;
  cursor: pointer;
  transition: all 0.1s ease;
}

.toolbar-icon-button:hover {
  background-color: #f0f0f0;
  color: #333333;
}

.toolbar-icon-button.active {
  background-color: #e8e8e8;
  color: #1a1a1a;
}

.toolbar-icon-button svg {
  width: 18px;
  height: 18px;
}
```

### Zoom Controls (Right Side)
```css
.toolbar-zoom {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-zoom-button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  cursor: pointer;
  font-size: 16px;
}

.toolbar-zoom-button:hover {
  background-color: #f5f5f5;
  border-color: #cccccc;
}
```

---

## 7. TYPOGRAPHY (Global)

```css
/* Make.com uses Inter as primary font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Font family */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Font sizes */
  --text-xs: 10px;
  --text-sm: 11px;
  --text-base: 13px;
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 18px;
  
  /* Font weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  
  /* Line heights */
  --leading-tight: 1.2;
  --leading-normal: 1.4;
  --leading-relaxed: 1.6;
}
```

---

## 8. COLOR TOKENS

```css
:root {
  /* ===== CORE BACKGROUNDS ===== */
  --bg-canvas: #f5f5f0;          /* Main canvas background */
  --bg-canvas-alt: #f0f4ee;      /* Alternative with more green */
  --bg-sidebar: #2d2d2d;         /* Sidebar background */
  --bg-panel: #ffffff;            /* Right panel, cards */
  --bg-toolbar: #ffffff;          /* Bottom toolbar */
  
  /* ===== CANVAS DOT GRID ===== */
  --grid-dot-color: #e0e0da;
  --grid-dot-size: 0.8px;
  --grid-spacing: 20px;
  
  /* ===== NODE COLORS (Pastel) ===== */
  --node-pink: #fce4ec;
  --node-blue: #e3f2fd;
  --node-green: #e8f5e9;
  --node-purple: #f3e5f5;
  --node-lavender: #ede7f6;
  --node-white: #ffffff;
  --node-dark: #1a1a1a;
  --node-yellow: #fff8e1;
  --node-orange: #fff3e0;
  --node-teal: #e0f7fa;
  
  /* ===== TEXT COLORS ===== */
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;
  --text-hint: #cccccc;
  --text-on-dark: #ffffff;
  --text-on-dark-muted: #999999;
  
  /* ===== BORDERS ===== */
  --border-light: #eeeeee;
  --border-medium: #e0e0e0;
  --border-dark: #cccccc;
  
  /* ===== STATUS COLORS ===== */
  --status-healthy: #66bb6a;
  --status-warning: #ffa726;
  --status-critical: #ef5350;
  --status-info: #42a5f5;
  
  /* ===== CONNECTION LINES ===== */
  --line-green: #81c784;
  --line-blue: #90caf9;
  --line-gray: #bdbdbd;
  --line-pink: #ef9a9a;
  
  /* ===== INTERACTIVE ===== */
  --hover-bg: #f8f8f8;
  --active-bg: #e8e8e8;
  --sidebar-hover: #3a3a3a;
  --sidebar-active: #444444;
  
  /* ===== AI HELP / ACCENT ===== */
  --accent-mint: #e8f5e9;
  --accent-mint-hover: #c8e6c9;
  --accent-green: #66bb6a;
  
  /* ===== SHADOWS ===== */
  --shadow-node: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-node-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-panel: -1px 0 3px rgba(0, 0, 0, 0.04);
  
  /* ===== SPACING ===== */
  --sidebar-width: 60px;
  --panel-width: 300px;
  --toolbar-height: 52px;
  --node-border-radius: 14px;
  --card-border-radius: 10px;
  --button-border-radius: 8px;
}
```

---

## 9. MAPPING: Make.com Elements → Chairman's Hub Elements

| Make.com Element | Chairman's Hub Equivalent |
|------------------|--------------------------|
| Make.com "M" logo | Trendzo "T" logo |
| Sidebar icons (modules, templates, etc.) | Chairman nav (home, topology, dashboard, settings) |
| "+" add button | "+" add node or search |
| Webhooks node (pink) | "Prediction Engine" node (pink/coral) |
| Slack node (blue) | "Revenue System" node (blue) |
| ChatGPT node (white) | "TRENDZO CORE" node (white, center) |
| Google Drive node (green) | "Data Pipeline" node (green) |
| Canva node (purple) | "Agency Portal" node (purple) |
| Notion node (dark) | Could be any standout node |
| Discord node (lavender) | "Creator Platform" node (lavender/orange) |
| "Flow Control" section | "Health Areas" section |
| "Tools > Triggers" section | "Active Alerts" section |
| "Tools > Actions" section | "Quick Actions" section |
| "AI Help beta" button | "AI Help beta" button (keep this!) |
| "Run once" button | "Run audit" button |
| Search bar in panel | Search bar in panel |
| Connection lines (green/blue) | System relationship lines |

---

## 10. SANDBOX TEST PAGE

Build location: `/sandbox/chairman-design-test`

This page should render:
1. The exact sidebar (black, icons)
2. The exact canvas (dot grid background)
3. 3-4 sample nodes with different colors
4. Connection lines between them
5. The right panel with sections
6. The bottom toolbar

**No real data needed.** Static/hardcoded content only.
Purpose: Verify the visual design matches Make.com before building the full hub.

---

## Reference Image Locations

These Make.com screenshots are the EXACT visual target:

```
assets/c__Users_thoma_..._image-45b800cd-8042-464b-929d-341fdd989eab.png
assets/c__Users_thoma_..._image-9958a9f0-c6e2-4c7a-b6fd-9668fb4e96b1.png
assets/c__Users_thoma_..._image-d2810a6f-69a9-4497-a27b-8d45df2d67fa.png
```

**The generated mockups (chairman-hub-make-style-*.png) are for conceptual reference only.**
**The Make.com screenshots above are the PRIMARY design target.**
