'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  Search,
  ChevronRight,
  Plus,
  Minus,
  Play,
  Sparkles,
  BarChart3,
  Video,
  Brain,
  Target,
  Tag,
  Cpu,
  Upload,
  Eye,
  TrendingUp,
  Layers,
  Activity,
  Database,
  Settings,
  Home,
  Zap,
  Clock,
  Filter,
  GitBranch,
  ChevronDown,
  Lightbulb,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ViewType = 'pipeline' | 'creator';

interface PipelineNode {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: [string, string];
  x: number;
  y: number;
  status?: 'active' | 'idle' | 'processing';
}

interface PipelineEdge {
  from: string;
  to: string;
  color: string;
  animated?: boolean;
  dashed?: boolean;
}

// ============================================================================
// PIPELINE DATA — CleanCopy TikTok Prediction Flow
// ============================================================================

const pipelineNodes: PipelineNode[] = [
  {
    id: 'scrape',
    label: 'TikTok Scraper',
    subtitle: 'Ingest videos',
    icon: <Video className="w-7 h-7" />,
    gradient: ['#fce4ec', '#f8bbd0'],
    x: 80,
    y: 55,
    status: 'active',
  },
  {
    id: 'upload',
    label: 'Video Store',
    subtitle: 'Upload to storage',
    icon: <Upload className="w-7 h-7" />,
    gradient: ['#e8eaf6', '#c5cae9'],
    x: 320,
    y: 55,
  },
  {
    id: 'extract',
    label: 'Component AI',
    subtitle: 'Extract features',
    icon: <Brain className="w-7 h-7" />,
    gradient: ['#e0f2f1', '#b2dfdb'],
    x: 200,
    y: 195,
    status: 'processing',
  },
  {
    id: 'predict',
    label: 'DPS Engine',
    subtitle: 'Score performance',
    icon: <Target className="w-7 h-7" />,
    gradient: ['#fff3e0', '#ffe0b2'],
    x: 80,
    y: 340,
  },
  {
    id: 'label',
    label: 'Label Studio',
    subtitle: 'Actual engagement',
    icon: <Tag className="w-7 h-7" />,
    gradient: ['#f3e5f5', '#e1bee7'],
    x: 320,
    y: 340,
  },
  {
    id: 'train',
    label: 'Model Trainer',
    subtitle: 'Improve predictions',
    icon: <Cpu className="w-7 h-7" />,
    gradient: ['#1a1a1a', '#2d2d2d'],
    x: 200,
    y: 480,
    status: 'idle',
  },
];

const pipelineEdges: PipelineEdge[] = [
  { from: 'scrape', to: 'extract', color: '#e91e63', animated: true },
  { from: 'upload', to: 'extract', color: '#5c6bc0', dashed: true },
  { from: 'extract', to: 'predict', color: '#26a69a', animated: true },
  { from: 'extract', to: 'label', color: '#26a69a' },
  { from: 'predict', to: 'train', color: '#ff9800' },
  { from: 'label', to: 'train', color: '#ab47bc' },
];

// ============================================================================
// SHARED STYLES
// ============================================================================

const FONT_DISPLAY = "'Urbanist', 'DM Sans', sans-serif";
const FONT_BODY = "'DM Sans', sans-serif";
const FONT_ACCENT = "'Fraunces', Georgia, serif";

const glassCard = {
  background: 'rgba(15, 15, 28, 0.45)',
  backdropFilter: 'blur(20px) saturate(150%)',
  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
  border: 'none' as const,
  borderRadius: '20px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
} as const;

// ============================================================================
// FONTS
// ============================================================================

function FontLoader() {
  return (
    // eslint-disable-next-line @next/next/no-page-custom-font
    <link
      href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
      rel="stylesheet"
    />
  );
}

// ============================================================================
// SIDEBAR (shared between views)
// ============================================================================

function Sidebar({
  activeView,
  onViewChange,
}: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}) {
  const navItems: { icon: typeof Home; label: string; view: ViewType | null }[] = [
    { icon: Home, label: 'Creator Studio', view: 'creator' },
    { icon: Activity, label: 'Pipelines', view: 'pipeline' },
    { icon: BarChart3, label: 'Analytics', view: null },
    { icon: Database, label: 'Data', view: null },
    { icon: Layers, label: 'Models', view: null },
    { icon: Settings, label: 'Settings', view: null },
  ];

  return (
    <div
      className="relative w-[68px] h-full flex flex-col items-center py-5"
      style={{
        background: 'rgba(10, 10, 20, 0.25)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderRight: '1px solid rgba(255,255,255,0.02)',
      }}
    >
      {/* Left edge gradient accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{
          background: 'linear-gradient(180deg, #ff1a75, #8b5cf6, #3b82f6, transparent)',
          opacity: 0.6,
        }}
      />

      {/* Logo with radial glow */}
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,26,117,0.35), transparent 70%)',
            filter: 'blur(10px)',
            transform: 'scale(2)',
          }}
        />
        <div
          className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #ff1a75, #e91e63)',
            boxShadow:
              '0 4px 16px rgba(255,26,117,0.4), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Add */}
      <button
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-5 transition-all duration-200 hover:scale-105"
        style={{
          border: '1.5px dashed rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = item.view === activeView;
          return (
            <button
              key={item.label}
              title={item.label}
              onClick={() => item.view && onViewChange(item.view)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255,26,117,0.2), rgba(139,92,246,0.12))'
                  : 'rgba(255,255,255,0.02)',
                border: isActive
                  ? '1px solid rgba(255,26,117,0.3)'
                  : '1px solid transparent',
                color: isActive ? '#ff6090' : 'rgba(255,255,255,0.2)',
                opacity: isActive ? 1 : (item.view ? 0.6 : 0.4),
                cursor: item.view ? 'pointer' : 'default',
                boxShadow: isActive
                  ? '0 0 24px rgba(255,26,117,0.35), 0 4px 12px rgba(255,26,117,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : 'none',
              }}
            >
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,26,117,0.2), transparent 70%)',
                    filter: 'blur(4px)',
                  }}
                />
              )}
              <item.icon className="w-[18px] h-[18px] relative z-10" />
            </button>
          );
        })}
      </nav>

      {/* Avatar */}
      <div className="relative mt-auto">
        <div
          className="w-9 h-9 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ff6090, #e91e63)',
            boxShadow: '0 2px 8px rgba(233,30,99,0.3)',
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ fontFamily: FONT_BODY }}
          >
            TC
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PIPELINE VIEW COMPONENTS (existing, unchanged)
// ============================================================================

function NodeCard({ node, index }: { node: PipelineNode; index: number }) {
  const isDark = node.id === 'train';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute flex flex-col items-center justify-center cursor-pointer"
      style={{
        left: node.x,
        top: node.y,
        minWidth: '140px',
        minHeight: '92px',
        background: isDark
          ? 'linear-gradient(145deg, #1a1a1a, #252525)'
          : `linear-gradient(145deg, ${node.gradient[0]}, ${node.gradient[1]})`,
        borderRadius: '18px',
        padding: '18px 22px',
        boxShadow: hovered
          ? isDark
            ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'
            : '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)'
          : isDark
            ? '0 2px 12px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
        transform: hovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: `fadeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s both`,
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {node.status === 'active' && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{
            backgroundColor: '#4caf50',
            boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)',
            animation: 'pulse 2s infinite',
          }}
        />
      )}
      {node.status === 'processing' && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{
            backgroundColor: '#ff9800',
            boxShadow: '0 0 8px rgba(255, 152, 0, 0.6)',
            animation: 'pulse 1.2s infinite',
          }}
        />
      )}

      <div
        className="mb-2.5"
        style={{
          color: isDark ? '#ff6090' : '#1a1a1a',
          opacity: isDark ? 1 : 0.7,
        }}
      >
        {node.icon}
      </div>

      <div
        className="text-[13px] font-semibold text-center leading-tight"
        style={{
          color: isDark ? '#ffffff' : '#1a1a1a',
          fontFamily: FONT_BODY,
          letterSpacing: '-0.01em',
        }}
      >
        {node.label}
      </div>

      <div
        className="text-[10.5px] text-center leading-tight mt-1"
        style={{
          color: isDark ? '#777' : '#666',
          fontFamily: FONT_BODY,
        }}
      >
        {node.subtitle}
      </div>

      {['top', 'bottom'].map((pos) => (
        <div
          key={pos}
          className="absolute w-[14px] h-[14px] rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            [pos]: '-7px',
            left: '50%',
            transform: `translateX(-50%) scale(${hovered ? 1.2 : 1})`,
            backgroundColor: isDark ? '#333' : '#fff',
            border: `1.5px solid ${isDark ? '#555' : '#d0d0d0'}`,
            fontSize: '9px',
            color: '#999',
          }}
        >
          +
        </div>
      ))}
    </div>
  );
}

function EdgePath({ edge, nodes }: { edge: PipelineEdge; nodes: PipelineNode[] }) {
  const from = nodes.find((n) => n.id === edge.from)!;
  const to = nodes.find((n) => n.id === edge.to)!;

  const startX = from.x + 70;
  const startY = from.y + 92;
  const endX = to.x + 70;
  const endY = to.y;

  const midY = (startY + endY) / 2;
  const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

  const gradientId = `edge-${edge.from}-${edge.to}`;

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={edge.color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={edge.color} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={edge.color}
        strokeWidth="4"
        strokeOpacity="0.08"
        strokeDasharray={edge.dashed ? '8 6' : undefined}
      />
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeDasharray={edge.dashed ? '8 6' : undefined}
        strokeLinecap="round"
      />
      {edge.animated && (
        <>
          <circle r="3" fill={edge.color} opacity="0.8">
            <animateMotion dur="3s" repeatCount="indefinite" path={d} />
          </circle>
          <circle r="6" fill={edge.color} opacity="0.15">
            <animateMotion dur="3s" repeatCount="indefinite" path={d} />
          </circle>
        </>
      )}
    </g>
  );
}

function Canvas() {
  return (
    <div
      className="flex-1 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #f7f5f0 0%, #ece9e1 50%, #e8e4db 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #c5c0b4 0.7px, transparent 0.7px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 30%, transparent 40%, rgba(0,0,0,0.03) 100%)',
        }}
      />

      <div
        className="absolute top-5 left-6 flex items-center gap-2.5"
        style={{ animation: 'fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <div
          className="px-3.5 py-1.5 rounded-full flex items-center gap-2"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#4caf50',
              boxShadow: '0 0 6px rgba(76,175,80,0.5)',
              animation: 'pulse 2s infinite',
            }}
          />
          <span
            className="text-[12px] font-medium"
            style={{ color: '#555', fontFamily: FONT_BODY }}
          >
            Prediction Pipeline
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
            style={{
              backgroundColor: 'rgba(233,30,99,0.08)',
              color: '#e91e63',
              fontFamily: FONT_BODY,
            }}
          >
            v2.4
          </span>
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {pipelineEdges.map((edge) => (
          <EdgePath
            key={`${edge.from}-${edge.to}`}
            edge={edge}
            nodes={pipelineNodes}
          />
        ))}
      </svg>

      {pipelineNodes.map((node, i) => (
        <NodeCard key={node.id} node={node} index={i} />
      ))}
    </div>
  );
}

function PanelSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #f0ede8' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center cursor-pointer select-none group"
      >
        <ChevronRight
          className="w-3.5 h-3.5 mr-2.5 transition-transform duration-200"
          style={{
            color: '#aaa',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: '#1a1a1a', fontFamily: FONT_BODY }}
        >
          {title}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-3.5" style={{ animation: 'fadeIn 0.2s ease' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function PanelItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2 px-2.5 rounded-xl cursor-pointer transition-all duration-150 hover:bg-[#faf8f5]">
      <div
        className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: '#f5f2ed', color: '#777' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[12.5px] font-semibold leading-tight"
          style={{ color: '#1a1a1a', fontFamily: FONT_BODY }}
        >
          {title}
        </div>
        <div
          className="text-[11px] leading-snug mt-0.5 truncate"
          style={{ color: '#999', fontFamily: FONT_BODY }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <div
      className="w-[290px] h-full flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #fefcf9 0%, #faf8f5 100%)',
        borderLeft: '1px solid #ebe7e0',
      }}
    >
      <div className="p-4" style={{ borderBottom: '1px solid #f0ede8' }}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: '#bbb' }}
          />
          <input
            type="text"
            placeholder="Search components..."
            className="w-full h-9 rounded-xl pl-9 pr-3 text-[12px] outline-none transition-all duration-200 focus:ring-2"
            style={{
              backgroundColor: '#f5f2ed',
              border: '1px solid transparent',
              color: '#333',
              fontFamily: FONT_BODY,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PanelSection title="Pipeline Stages">
          <PanelItem icon={<Video className="w-4 h-4" />} title="Video Ingestion" description="Scrape & upload TikTok content" />
          <PanelItem icon={<Brain className="w-4 h-4" />} title="Feature Extraction" description="AI-powered component analysis" />
          <PanelItem icon={<Target className="w-4 h-4" />} title="DPS Prediction" description="Score viral potential 0-100" />
          <PanelItem icon={<Tag className="w-4 h-4" />} title="Labeling" description="Attach actual engagement data" />
        </PanelSection>

        <PanelSection title="Flow Control">
          <div className="text-[10px] font-semibold uppercase tracking-widest py-1.5" style={{ color: '#bbb', fontFamily: FONT_BODY }}>Triggers</div>
          <PanelItem icon={<Zap className="w-4 h-4" />} title="New Video" description="Fires when video is scraped" />
          <PanelItem icon={<Clock className="w-4 h-4" />} title="Scheduled Run" description="Cron-based batch processing" />
          <div className="text-[10px] font-semibold uppercase tracking-widest py-1.5 mt-2" style={{ color: '#bbb', fontFamily: FONT_BODY }}>Actions</div>
          <PanelItem icon={<Filter className="w-4 h-4" />} title="Niche Filter" description="Route by content niche" />
          <PanelItem icon={<GitBranch className="w-4 h-4" />} title="A/B Split" description="Compare model versions" />
          <PanelItem icon={<Eye className="w-4 h-4" />} title="Readiness Check" description="Validate training requirements" />
        </PanelSection>

        <PanelSection title="Integrations" defaultOpen={false}>
          <PanelItem icon={<Database className="w-4 h-4" />} title="Supabase" description="Database & storage backend" />
          <PanelItem icon={<Cpu className="w-4 h-4" />} title="OpenAI" description="GPT-4 component analysis" />
        </PanelSection>
      </div>

      <div className="p-4">
        <button
          className="w-full py-2.5 px-4 rounded-2xl flex items-center gap-2.5 transition-all duration-200 hover:shadow-md"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: '#ff6090' }} />
          <span className="text-[12.5px] font-semibold text-white" style={{ fontFamily: FONT_BODY }}>AI Copilot</span>
          <span
            className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #e91e63, #ff6090)', color: '#fff', letterSpacing: '0.05em' }}
          >
            NEW
          </span>
        </button>
      </div>
    </div>
  );
}

function BottomBar() {
  return (
    <div
      className="h-[52px] flex items-center px-5"
      style={{
        background: 'linear-gradient(90deg, #fefcf9 0%, #faf8f5 100%)',
        borderTop: '1px solid #ebe7e0',
      }}
    >
      <button
        className="flex items-center gap-2 px-5 py-2 rounded-full text-white text-[12px] font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a, #333)',
          fontFamily: FONT_BODY,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}
      >
        <Play className="w-3 h-3 fill-white" />
        Run pipeline
      </button>

      <div className="ml-5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4caf50' }} />
          <span className="text-[11px]" style={{ color: '#999', fontFamily: FONT_BODY }}>6 nodes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ff9800' }} />
          <span className="text-[11px]" style={{ color: '#999', fontFamily: FONT_BODY }}>1 processing</span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f0ede8]" style={{ color: '#999' }}>
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="px-2.5 text-[11px] tabular-nums" style={{ color: '#999', fontFamily: FONT_BODY }}>100%</span>
        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f0ede8]" style={{ color: '#999' }}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PIPELINE VIEW
// ============================================================================

function PipelineView() {
  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <Canvas />
        <RightPanel />
      </div>
      <BottomBar />
    </>
  );
}

// ============================================================================
// CREATOR STUDIO VIEW — Premium Dark Glassmorphism
// ============================================================================

function DPSDialCard() {
  const [hovered, setHovered] = useState(false);
  const S = 110;
  const CX = S / 2;
  const CY = S / 2;
  const BEZEL_R = 52;
  const BEZEL_W = 9;
  const ARC_R = 47;
  const WELL_R = 42;
  const TICK_R = 50;
  const DOT_R = 52;

  const arcAngleStart = 135;
  const arcSweep = 270;
  const fillPct = 0.30;

  const polar = (angleDeg: number, r: number) => ({
    x: CX + r * Math.cos((angleDeg * Math.PI) / 180),
    y: CY + r * Math.sin((angleDeg * Math.PI) / 180),
  });

  const arcPath = (r: number, startDeg: number, sweepDeg: number) => {
    const s = polar(startDeg, r);
    const e = polar(startDeg + sweepDeg, r);
    const largeArc = sweepDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i <= 10; i++) {
    const angle = arcAngleStart + (arcSweep / 10) * i;
    const outer = polar(angle, TICK_R + 2);
    const inner = polar(angle, TICK_R - 2);
    ticks.push({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y });
  }

  const dotPositions = [
    { pct: 0,    color: '#22c55e' },
    { pct: 0.33, color: '#3b82f6' },
    { pct: 0.67, color: '#d946ef' },
    { pct: 1,    color: '#f43f5e' },
  ];

  return (
    <div style={{
      ...glassCard,
      padding: '10px 14px 8px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 6,
      animation: 'cardFloat 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
    }}>
      <span style={{
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: '0.12em',
        color: 'rgba(168,85,247,0.55)',
        textTransform: 'uppercase' as const,
        fontFamily: FONT_BODY,
      }}>CURRENT DPS SCORE</span>

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width: S,
          height: S,
          cursor: 'default',
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 300ms ease',
        }}
      >
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ display: 'block' }}>
          <defs>
            <radialGradient id="dps-bezel-outer" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#3a3a52" />
              <stop offset="100%" stopColor="#16162a" />
            </radialGradient>
            <radialGradient id="dps-well" cx="45%" cy="38%" r="55%">
              <stop offset="0%" stopColor={hovered ? '#1a1a30' : '#151528'} />
              <stop offset="100%" stopColor={hovered ? '#0c0c1a' : '#08080f'} />
            </radialGradient>
            <linearGradient id="dps-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="40%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="dps-arc-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={hovered ? 5 : 3} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={CX} cy={CY} r={BEZEL_R} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={BEZEL_W + 2} />
          <circle cx={CX} cy={CY} r={BEZEL_R} fill="none" stroke="url(#dps-bezel-outer)" strokeWidth={BEZEL_W} />
          <circle cx={CX} cy={CY} r={BEZEL_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={BEZEL_W}
            strokeDasharray={`${Math.PI * BEZEL_R * 0.5} ${Math.PI * BEZEL_R * 1.5}`}
            strokeDashoffset={Math.PI * BEZEL_R * 0.25} />
          <circle cx={CX} cy={CY} r={BEZEL_R} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={BEZEL_W}
            strokeDasharray={`${Math.PI * BEZEL_R * 0.5} ${Math.PI * BEZEL_R * 1.5}`}
            strokeDashoffset={Math.PI * BEZEL_R * 1.25} />
          <circle cx={CX} cy={CY} r={BEZEL_R - BEZEL_W / 2 + 1} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={BEZEL_R + BEZEL_W / 2 - 1} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={WELL_R} fill="url(#dps-well)" />
          <circle cx={CX} cy={CY} r={WELL_R} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={i % 5 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={i % 5 === 0 ? 2 : 1} strokeLinecap="round" />
          ))}
          <path d={arcPath(ARC_R, arcAngleStart, arcSweep)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" strokeLinecap="round" />
          <path d={arcPath(ARC_R, arcAngleStart, arcSweep * fillPct)} fill="none" stroke="url(#dps-arc-grad)" strokeWidth="3" strokeLinecap="round" filter="url(#dps-arc-glow)" />
          {dotPositions.map((dot, i) => {
            const angle = arcAngleStart + arcSweep * dot.pct;
            const pos = polar(angle, DOT_R);
            return (
              <Fragment key={i}>
                <circle cx={pos.x} cy={pos.y} r="3" fill={dot.color} opacity="0.2" />
                <circle cx={pos.x} cy={pos.y} r="1.5" fill={dot.color} />
              </Fragment>
            );
          })}
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: S, height: S,
          display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: FONT_DISPLAY, lineHeight: 1, letterSpacing: '-0.02em',
            textShadow: hovered ? '0 0 32px rgba(168,85,247,0.5), 0 2px 4px rgba(0,0,0,0.6)' : '0 0 20px rgba(168,85,247,0.25), 0 2px 4px rgba(0,0,0,0.5)',
            transition: 'text-shadow 300ms ease',
          }}>30.0</span>
          <span style={{
            fontSize: 8, fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(168,85,247,0.7)',
            textTransform: 'uppercase' as const, fontFamily: FONT_BODY, marginTop: 3,
          }}>DPS SCORE</span>
        </div>
      </div>
    </div>
  );
}

function GlassCard({
  children,
  className = '',
  delay = 0,
  style = {},
  hoverAccent,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
  hoverAccent?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glassCard,
        padding: '24px',
        animation: `cardFloat 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
        ...style,
      }}
    >
      {/* Hover glow ring — accent-tinted inner border + ambient outer glow */}
      <div
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{
          boxShadow: hoverAccent
            ? `inset 0 0 0 1px rgba(${hoverAccent}, 0.18), 0 0 50px rgba(${hoverAccent}, 0.08), 0 0 100px rgba(${hoverAccent}, 0.03)`
            : 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 30px rgba(255,255,255,0.02)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 300ms cubic-bezier(0.16,1,0.3,1)',
        }}
      />
      {children}
    </div>
  );
}

function PhaseStep({
  label,
  active,
  emoji,
  index,
  total,
}: {
  label: string;
  active: boolean;
  emoji: string;
  index: number;
  total: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex items-center gap-0">
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
        style={{
          fontFamily: FONT_BODY,
          background: active
            ? 'linear-gradient(135deg, #ff1a75, #ff6b35)'
            : hovered
              ? 'rgba(255,255,255,0.05)'
              : 'transparent',
          border: 'none',
          borderTop: active ? '1px solid rgba(255,255,255,0.12)' : 'none',
          color: active ? '#fff' : hovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)',
          fontWeight: active ? 600 : 500,
          boxShadow: active
            ? '0 4px 16px rgba(255,26,117,0.5), 0 2px 4px rgba(0,0,0,0.3), 0 0 30px rgba(255,26,117,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'
            : hovered
              ? '0 2px 12px rgba(0,0,0,0.15)'
              : 'none',
          transform: active
            ? 'translateY(-1px) scale(1.05)'
            : hovered
              ? 'translateY(-1px)'
              : 'scale(1)',
        }}
      >
        {active && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.15), transparent 60%)',
            }}
          />
        )}
        <span className="relative z-10" style={{ fontSize: 14 }}>
          {emoji}
        </span>
        <span className="relative z-10">{label}</span>
      </button>
      {index < total - 1 && (
        <ChevronRight
          className="w-3 h-3 mx-0.5 flex-shrink-0"
          style={{
            color:
              index === 0
                ? 'rgba(255,26,117,0.2)'
                : 'rgba(255,255,255,0.06)',
          }}
        />
      )}
    </div>
  );
}

function AudiencePill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-300"
      style={{
        fontFamily: FONT_BODY,
        background: selected
          ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.15))'
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(15, 15, 30, 0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: 'none',
        borderTop: selected
          ? '1px solid rgba(59,130,246,0.15)'
          : '1px solid rgba(255,255,255,0.03)',
        color: selected ? '#93c5fd' : hovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.4)',
        boxShadow: selected
          ? '0 0 20px rgba(59,130,246,0.25), 0 0 40px rgba(59,130,246,0.08), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
          : hovered
            ? '0 2px 8px rgba(0,0,0,0.15)'
            : 'inset 0 1px 0 rgba(255,255,255,0.02)',
        transform: hovered && !selected ? 'translateY(-2px) scale(1.02)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

function PurposeCard({
  emoji,
  title,
  description,
  cta,
  accentBase,
  accentGlow,
  selected,
  onClick,
}: {
  emoji: string;
  title: string;
  description: string;
  cta: string;
  accentBase: string;
  accentGlow: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isLit = hovered || selected;

  return (
    <div
      onClick={onClick}
      className="flex-1 rounded-2xl p-5 transition-all duration-300 cursor-pointer relative overflow-hidden"
      style={{
        background: selected
          ? `rgba(${accentBase}, 0.1)`
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(15, 15, 30, 0.35)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: 'none',
        borderTop: isLit
          ? `1px solid rgba(${accentBase}, 0.12)`
          : '1px solid rgba(255,255,255,0.04)',
        boxShadow: selected
          ? `0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(${accentBase}, 0.25), 0 0 60px rgba(${accentBase}, 0.08), inset 0 1px 0 rgba(255,255,255,0.06)`
          : hovered
            ? `0 8px 24px rgba(0,0,0,0.25), 0 0 24px rgba(${accentBase}, 0.15)`
            : '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        transform: isLit ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ambient corner glow */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(${accentBase}, ${isLit ? '0.15' : '0.04'}), transparent 70%)`,
        }}
      />
      {/* Bottom edge glow when selected */}
      {selected && (
        <div
          className="absolute bottom-0 left-1/4 right-1/4 h-[2px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentGlow}, transparent)`,
            boxShadow: `0 0 12px rgba(${accentBase}, 0.4)`,
          }}
        />
      )}

      {/* Emoji on glowing circle */}
      <div
        className="relative w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{
          background: `rgba(${accentBase}, 0.15)`,
          border: 'none',
          boxShadow: isLit
            ? `0 0 28px rgba(${accentBase}, 0.45), 0 0 56px rgba(${accentBase}, 0.18), inset 0 0 12px rgba(${accentBase}, 0.1)`
            : `0 0 18px rgba(${accentBase}, 0.25), 0 0 36px rgba(${accentBase}, 0.08)`,
          transition: 'box-shadow 300ms ease',
        }}
      >
        <span style={{ fontSize: 24 }}>{emoji}</span>
      </div>

      <div
        className="relative text-[14px] font-bold mb-1.5"
        style={{
          color: 'rgba(255,255,255,0.92)',
          fontFamily: FONT_DISPLAY,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </div>
      <div
        className="relative text-[11.5px] leading-relaxed mb-3"
        style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT_BODY }}
      >
        {description}
      </div>
      <div
        className="relative text-[10.5px] font-semibold"
        style={{
          color: accentGlow,
          fontFamily: FONT_BODY,
          textShadow: isLit
            ? `0 0 12px rgba(${accentBase}, 0.4)`
            : 'none',
          transition: 'text-shadow 300ms ease',
        }}
      >
        CTA: &ldquo;{cta}&rdquo;
      </div>
    </div>
  );
}

function GlassSelect({ placeholder }: { placeholder: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <select
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full appearance-none px-4 py-3 rounded-xl text-[13px] outline-none transition-all duration-200"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: 'none',
          borderTop: focused
            ? '1px solid rgba(139, 92, 246, 0.15)'
            : '1px solid rgba(255,255,255,0.03)',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: FONT_BODY,
          boxShadow: focused
            ? 'inset 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3), 0 0 12px rgba(139, 92, 246, 0.15)'
            : 'inset 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3)',
        }}
        defaultValue=""
      >
        <option value="" disabled>
          {placeholder}
        </option>
      </select>
      <ChevronDown
        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      />
    </div>
  );
}

function GlassInput({
  placeholder,
  defaultValue,
  large,
}: {
  placeholder: string;
  defaultValue?: string;
  large?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="text"
      placeholder={placeholder}
      defaultValue={defaultValue}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: 'none',
        borderTop: focused
          ? '1px solid rgba(139, 92, 246, 0.15)'
          : '1px solid rgba(255,255,255,0.03)',
        color: 'rgba(255,255,255,0.9)',
        fontFamily: large ? FONT_DISPLAY : FONT_BODY,
        fontSize: large ? 28 : 13,
        fontWeight: large ? 700 : 400,
        letterSpacing: large ? '-0.01em' : undefined,
        textShadow: large ? '0 0 20px rgba(168,85,247,0.2)' : undefined,
        boxShadow: focused
          ? 'inset 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3), 0 0 12px rgba(139, 92, 246, 0.15)'
          : 'inset 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3)',
      }}
    />
  );
}

function PlatformTab({
  label,
  active,
  badge,
  brandColor,
}: {
  label: string;
  active?: boolean;
  badge?: string;
  brandColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const color = brandColor || '#ff1a75';

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative px-5 py-3 rounded-2xl text-[12px] font-semibold flex items-center gap-2.5 transition-all duration-300"
      style={{
        background: active
          ? `linear-gradient(135deg, ${color}30, ${color}15)`
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(15, 15, 30, 0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: 'none',
        borderTop: active ? `1px solid ${color}33` : '1px solid rgba(255,255,255,0.03)',
        color: active ? color : 'rgba(255,255,255,0.35)',
        fontFamily: FONT_BODY,
        boxShadow: active
          ? `0 4px 16px ${color}33, 0 0 24px ${color}15, inset 0 1px 0 rgba(255,255,255,0.08)`
          : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.02)',
        transform: hovered && !active ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Active glow dot */}
      {active && (
        <div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 8px ${color}88`,
            animation: 'glowPulse 2s infinite',
          }}
        />
      )}
      {label === 'TikTok' && <span style={{ fontSize: 16 }}>🎵</span>}
      {label === 'YouTube' && <span style={{ fontSize: 16 }}>🎬</span>}
      {label === 'Instagram' && <span style={{ fontSize: 16 }}>📸</span>}
      {label}
      {badge && (
        <span
          className="text-[8px] px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function EmojiGlow({
  emoji,
  glowColor,
  animated,
  size = 22,
}: {
  emoji: string;
  glowColor: string;
  animated?: boolean;
  size?: number;
}) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 2,
          height: size * 2,
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
          filter: 'blur(4px)',
          animation: animated ? 'glowPulse 2.5s infinite' : undefined,
        }}
      />
      <span className="relative" style={{ fontSize: size }}>
        {emoji}
      </span>
    </div>
  );
}

function CTAButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative w-full py-4 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2.5 transition-all duration-300 overflow-hidden active:scale-[0.99]"
      style={{
        fontFamily: FONT_DISPLAY,
        background: 'linear-gradient(135deg, #ff6b35 0%, #ff1a75 30%, #d946ef 60%, #8b5cf6 100%)',
        backgroundSize: '200% 200%',
        backgroundPosition: hovered ? '100% 50%' : '0% 50%',
        color: '#fff',
        letterSpacing: '0.01em',
        fontSize: 17,
        border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        boxShadow: hovered
          ? '0 6px 20px rgba(255,107,53,0.4), 0 12px 40px rgba(255,26,117,0.35), 0 20px 56px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
          : '0 4px 16px rgba(255,107,53,0.3), 0 8px 32px rgba(255,26,117,0.25), 0 16px 48px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Noise texture overlay on button */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] rounded-2xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
        }}
      />
      {/* Top edge bright line */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />
      <span className="relative z-10">Save Research & Continue to Planning</span>
      <ArrowRight
        className="w-5 h-5 relative z-10 transition-transform duration-300"
        style={{
          transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

function FloatingChatButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-300"
      style={{
        background: 'rgba(59,130,246,0.2)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(59,130,246,0.3)',
        boxShadow: hovered
          ? '0 8px 32px rgba(59,130,246,0.45), 0 0 30px rgba(59,130,246,0.25), 0 0 60px rgba(59,130,246,0.1)'
          : '0 4px 16px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.15)',
        transform: hovered ? 'translateY(-2px) scale(1.05)' : 'scale(1)',
        animation: 'chatPulse 3s infinite',
      }}
    >
      <MessageCircle
        className="w-5 h-5"
        style={{ color: '#93c5fd', opacity: 0.9 }}
      />
    </button>
  );
}

function CreatorStudioView() {
  const [selectedAge, setSelectedAge] = useState<string>('25-34');
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const phases = [
    { label: 'Research', emoji: '🔍', active: true },
    { label: 'Plan', emoji: '📋', active: false },
    { label: 'Create', emoji: '🧩', active: false },
    { label: 'Optimize', emoji: '⚡', active: false },
    { label: 'Publish', emoji: '📤', active: false },
    { label: 'Engage & Learn', emoji: '📊', active: false },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #0c0c18 40%, #0a0a12 100%)',
      }}
    >
      {/* === ATMOSPHERIC LIGHT BLOBS — living, breathing depth === */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: 700,
          height: 700,
          top: -150,
          right: 100,
          background: 'radial-gradient(circle, rgba(255,20,100,0.09) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
          animation: 'blobDrift 18s ease-in-out infinite',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          width: 800,
          height: 800,
          bottom: -200,
          left: -100,
          background: 'radial-gradient(circle, rgba(100,50,255,0.07) 0%, transparent 70%)',
          filter: 'blur(100px)',
          zIndex: 0,
          animation: 'blobDrift 24s ease-in-out infinite reverse',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: 300,
          left: 200,
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
          filter: 'blur(90px)',
          zIndex: 0,
          animation: 'blobDrift 20s ease-in-out infinite',
          animationDelay: '-5s',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          width: 500,
          height: 500,
          top: 100,
          right: 400,
          background: 'radial-gradient(circle, rgba(217,70,239,0.04) 0%, transparent 70%)',
          filter: 'blur(70px)',
          zIndex: 0,
          animation: 'blobDrift 22s ease-in-out infinite reverse',
          animationDelay: '-8s',
        }}
      />

      {/* Noise texture overlay — on top of everything */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          opacity: 0.03,
          zIndex: 9999,
          mixBlendMode: 'overlay' as const,
        }}
      />

      <div className="relative z-10 mx-auto px-8 py-8" style={{ maxWidth: 1200 }}>
        {/* ─── Header Row ─────────────────────────────────────────── */}
        <div
          className="flex items-start justify-between mb-8"
          style={{
            animation:
              'cardFloat 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Title area with radial light behind */}
          <div className="relative">
            <div
              className="absolute -top-20 -left-20 w-64 h-64 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,26,117,0.1), transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <div className="relative flex items-center gap-3.5 mb-2">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,26,117,0.18), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(255,26,117,0.25)',
                  boxShadow:
                    '0 4px 12px rgba(255,26,117,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    animation: 'glowPulse 3s infinite',
                    filter:
                      'drop-shadow(0 0 8px rgba(255,26,117,0.5))',
                  }}
                >
                  🚀
                </span>
              </div>
              <div>
                <h1
                  className="text-[28px] font-bold leading-tight"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    color: 'rgba(255,255,255,0.95)',
                    letterSpacing: '-0.02em',
                    textShadow:
                      '0 0 40px rgba(255,26,117,0.12)',
                  }}
                >
                  Viral Content Creator
                </h1>
                <p
                  className="text-[12.5px]"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: FONT_BODY,
                    fontWeight: 300,
                  }}
                >
                  6-Phase workflow to create viral content with
                  AI-powered predictions
                </p>
              </div>
            </div>
          </div>

          {/* Switch Workflow + Saving indicator + DPS Score */}
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: FONT_BODY,
              }}
            >
              <span style={{ fontSize: 14 }}>📁</span>
              Switch Workflow
            </button>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT_BODY }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.5s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Saving...
            </div>
            <DPSDialCard />
          </div>
        </div>

        {/* ─── Phase Navigation ────────────────────────────────────── */}
        <div
          className="relative mb-6"
          style={{
            animation:
              'cardFloat 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both',
          }}
        >
          <div
            className="relative rounded-2xl p-1.5"
            style={{
              background: 'rgba(10, 10, 20, 0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow:
                'inset 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.02)',
              border: 'none',
              borderRadius: '20px',
            }}
          >
            {/* Connector rail */}
            <div
              className="absolute top-1/2 left-8 right-8 h-[1px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,26,117,0.25), rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.04))',
                transform: 'translateY(-50%)',
              }}
            />
            <div className="relative flex items-center gap-0 overflow-x-auto">
              {phases.map((phase, i) => (
                <PhaseStep
                  key={phase.label}
                  label={phase.label}
                  emoji={phase.emoji}
                  active={phase.active}
                  index={i}
                  total={phases.length}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── Research Phase Header ───────────────────────────────── */}
        <GlassCard delay={0.2} className="mb-6" hoverAccent="255,26,117">
          <div className="flex items-start gap-3">
            {/* Left accent bar — glows */}
            <div
              className="w-[3px] rounded-full flex-shrink-0"
              style={{
                background:
                  'linear-gradient(180deg, #ff1a75, #8b5cf6)',
                boxShadow: '0 0 12px rgba(255,26,117,0.4), 0 0 24px rgba(255,26,117,0.15)',
                height: 42,
                marginTop: 2,
              }}
            />
            <div>
              <h2
                className="text-[18px] font-bold mb-1.5"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: 'rgba(255,255,255,0.92)',
                  textShadow:
                    '0 0 20px rgba(255,255,255,0.05)',
                }}
              >
                Research Phase
              </h2>
              <p
                className="text-[13px]"
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: FONT_BODY,
                }}
              >
                Build your content foundation by understanding
                your audience and topic research
              </p>
            </div>
          </div>
        </GlassCard>

        {/* ─── ROW 1: Define Your Niche + Content Purpose ──────── */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr' }}>
          <GlassCard delay={0.25} hoverAccent="255,26,117">
            <div className="flex items-center gap-2.5 mb-5">
              <EmojiGlow
                emoji="🎯"
                glowColor="rgba(255,26,117,0.2)"
                size={22}
              />
              <h3
                className="text-[15px] font-bold"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                Define Your Niche
              </h3>
            </div>

            <GlassSelect placeholder="Select a category..." />

            <div className="mt-5">
              <div
                className="text-[12px] font-semibold mb-3"
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: FONT_BODY,
                }}
              >
                Target Audience Demographics
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  '18-24 years',
                  '25-34 years',
                  '35-44 years',
                  '45+ years',
                ].map((age) => (
                  <AudiencePill
                    key={age}
                    label={age}
                    selected={selectedAge === age}
                    onClick={() => setSelectedAge(age)}
                  />
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.3} hoverAccent="139,92,246">
            <div className="flex items-center gap-2.5 mb-2">
              <EmojiGlow
                emoji="🎯"
                glowColor="rgba(139,92,246,0.2)"
                size={22}
              />
              <h3
                className="text-[15px] font-bold"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                Content Purpose
              </h3>
            </div>
            <p
              className="text-[12px] mb-5"
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontFamily: FONT_BODY,
              }}
            >
              What do you want your audience to do? This affects
              your hook and CTA strategy.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <PurposeCard
                emoji="👋"
                title="KNOW"
                description="Get them to know you"
                cta="Follow for more"
                accentBase="249,115,22"
                accentGlow="#fdba74"
                selected={selectedPurpose === 'know'}
                onClick={() =>
                  setSelectedPurpose(
                    selectedPurpose === 'know' ? null : 'know'
                  )
                }
              />
              <PurposeCard
                emoji="💕"
                title="LIKE"
                description="Build rapport & trust"
                cta="Like & share"
                accentBase="255,26,117"
                accentGlow="#ff6090"
                selected={selectedPurpose === 'like'}
                onClick={() =>
                  setSelectedPurpose(
                    selectedPurpose === 'like' ? null : 'like'
                  )
                }
              />
              <PurposeCard
                emoji="🤝"
                title="TRUST"
                description="Convert to customers"
                cta="Link in bio"
                accentBase="139,92,246"
                accentGlow="#a78bfa"
                selected={selectedPurpose === 'trust'}
                onClick={() =>
                  setSelectedPurpose(
                    selectedPurpose === 'trust' ? null : 'trust'
                  )
                }
              />
            </div>
          </GlassCard>
        </div>

        {/* ─── ROW 2: Set Goals & KPIs + Exemplar Swoop ──────── */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr' }}>
          <GlassCard delay={0.35} hoverAccent="59,130,246">
            <div className="flex items-center gap-2.5 mb-5">
              <EmojiGlow
                emoji="📊"
                glowColor="rgba(59,130,246,0.2)"
                size={22}
              />
              <h3
                className="text-[15px] font-bold"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                Set Goals & KPIs
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div
                  className="text-[11px] font-medium mb-2"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: FONT_BODY,
                  }}
                >
                  Primary Content Goal
                </div>
                <GlassSelect placeholder="Select a goal..." />
              </div>
              <div>
                <div
                  className="text-[11px] font-medium mb-2"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: FONT_BODY,
                  }}
                >
                  Target Views
                </div>
                <GlassInput
                  placeholder="Enter target..."
                  defaultValue="10,000"
                  large
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.4} hoverAccent="217,70,239">
          <div className="flex items-center gap-2.5 mb-2">
            <EmojiGlow
              emoji="🔮"
              glowColor="rgba(139,92,246,0.25)"
              animated
              size={22}
            />
            <h3
              className="text-[15px] font-bold"
              style={{
                fontFamily: FONT_DISPLAY,
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              Exemplar Swoop
            </h3>
          </div>
          <p
            className="text-[12px] mb-5"
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontFamily: FONT_BODY,
            }}
          >
            Find 25 accounts in your niche, track their viral
            videos, and reverse engineer what works
          </p>

          {/* Platform tabs */}
          <div className="flex gap-2.5 mb-5">
            <PlatformTab
              label="TikTok"
              active
              brandColor="#ff1a75"
            />
            <PlatformTab
              label="YouTube"
              badge="Soon"
              brandColor="#ff4444"
            />
            <PlatformTab
              label="Instagram"
              badge="Soon"
              brandColor="#8b5cf6"
            />
          </div>

          {/* Search input */}
          <div className="relative mb-5">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200"
              style={{
                color: searchFocused
                  ? 'rgba(255,26,117,0.5)'
                  : 'rgba(255,255,255,0.2)',
                filter: searchFocused
                  ? 'drop-shadow(0 0 4px rgba(255,26,117,0.3))'
                  : 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search hashtags, keywords, or creators..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-[13px] outline-none transition-all duration-200"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: 'none',
                borderTop: searchFocused
                  ? '1px solid rgba(139, 92, 246, 0.15)'
                  : '1px solid rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.8)',
                fontFamily: FONT_BODY,
                boxShadow: searchFocused
                  ? 'inset 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3), 0 0 12px rgba(139, 92, 246, 0.15)'
                  : 'inset 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* Pro Tip — special warm glass card */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,171,64,0.06), rgba(255,145,0,0.03))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: 'none',
              borderTop: '1px solid rgba(255,171,64,0.1)',
              boxShadow:
                '0 4px 16px rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.15), 0 0 30px rgba(255,171,64,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            {/* Top gradient border highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,171,64,0.3), transparent)',
              }}
            />
            {/* Ambient warm glow */}
            <div
              className="absolute -top-12 -left-12 w-32 h-32 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,171,64,0.12), transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3">
                <Lightbulb
                  className="w-4.5 h-4.5"
                  style={{
                    color: '#ffab40',
                    filter:
                      'drop-shadow(0 0 6px rgba(255,171,64,0.5))',
                    animation: 'glowPulse 2.5s infinite',
                  }}
                />
                <span
                  className="text-[11px] font-semibold"
                  style={{
                    color: 'rgba(255,171,64,0.85)',
                    fontFamily: FONT_BODY,
                    letterSpacing: '0.02em',
                  }}
                >
                  Pro Tip from Paul:
                </span>
              </div>
              <p
                className="text-[12.5px] leading-relaxed"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: FONT_ACCENT,
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                &ldquo;Find people with disproportional
                astronomical views compared to their peers. If
                someone has 200K views when others have 2K,
                they&apos;re doing something right. Study their
                hooks, their consistency, and their
                monetization.&rdquo;
              </p>
            </div>
          </div>
        </GlassCard>
        </div>

        {/* ─── CTA Button ─────────────────────────────────────────── */}
        <div
          className="mb-12"
          style={{
            animation:
              'cardFloat 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both',
          }}
        >
          <CTAButton />
        </div>
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================

export default function ChairmanDesignTestPage() {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('creator');

  useEffect(() => setMounted(true), []);

  return (
    <>
      <FontLoader />

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes cardFloat {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes glowPulse {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(255,26,117,0.4));
            opacity: 1;
          }
          50% {
            filter: drop-shadow(0 0 14px rgba(255,26,117,0.7));
            opacity: 0.85;
          }
        }
        @keyframes blobDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(12px, -8px) scale(1.03); }
          66% { transform: translate(-6px, 10px) scale(0.98); }
        }
        @keyframes chatPulse {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(59,130,246,0.2), 0 0 0 0 rgba(59,130,246,0.15);
          }
          50% {
            box-shadow: 0 4px 24px rgba(59,130,246,0.35), 0 0 0 6px rgba(59,130,246,0.05);
          }
        }
      `}</style>

      <div
        className="h-screen w-screen flex flex-col overflow-hidden"
        style={{
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="flex-1 flex overflow-hidden">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          {activeView === 'pipeline' && <PipelineView />}
          {activeView === 'creator' && <CreatorStudioView />}
        </div>
        {activeView === 'pipeline' && <BottomBar />}
      </div>
    </>
  );
}
