'use client';

import React from 'react';
import { defineRegistry, useActions } from '@json-render/react';
import { trendzoCatalog } from './trendzo-catalog';

// ── Color helpers ──────────────────────────────────────────────────────

const accentMap: Record<string, string> = {
  crimson: '#e63946',
  violet: '#7c3aed',
  cyan: '#00d4ff',
  gold: '#f59e0b',
  green: '#2dd4a8',
};

function getAccent(color?: string): string {
  return accentMap[color ?? 'cyan'] ?? '#00d4ff';
}

function getVPSColor(score: number): string {
  if (score >= 80) return '#2dd4a8';
  if (score >= 70) return '#f59e0b';
  return '#e63946';
}

const severityColors: Record<string, string> = {
  success: '#2dd4a8',
  warning: '#e63946',
  info: '#00d4ff',
};

const statusColors: Record<string, string> = {
  active: '#2dd4a8',
  inactive: '#e63946',
  onboarding: '#f59e0b',
};

const momentumColors: Record<string, string> = {
  rising: '#2dd4a8',
  peaking: '#f59e0b',
  declining: '#e63946',
};

const variantStyles: Record<string, string> = {
  default: 'bg-[#1a1a2e] text-[#e8e6e3]',
  success: 'bg-[#2dd4a8]/15 text-[#2dd4a8]',
  warning: 'bg-[#f59e0b]/15 text-[#f59e0b]',
  danger: 'bg-[#e63946]/15 text-[#e63946]',
};

// ── Registry ───────────────────────────────────────────────────────────

export const { registry, handlers, executeAction } = defineRegistry(trendzoCatalog, {
  components: {
    // ── LAYOUT ────────────────────────────────────────────────────────

    Row: ({ props, children }) => {
      const alignClass: Record<string, string> = {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      };
      return (
        <div
          className={`flex flex-row ${props.wrap ? 'flex-wrap' : ''} ${alignClass[props.align ?? 'start'] ?? ''}`}
          style={{ gap: props.gap != null ? `${props.gap * 4}px` : undefined }}
        >
          {children}
        </div>
      );
    },

    Column: ({ props, children }) => {
      const alignClass: Record<string, string> = {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      };
      return (
        <div
          className={`flex flex-col ${alignClass[props.align ?? 'stretch'] ?? ''}`}
          style={{ gap: props.gap != null ? `${props.gap * 4}px` : undefined }}
        >
          {children}
        </div>
      );
    },

    Grid: ({ props, children }) => (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
          gap: props.gap != null ? `${props.gap * 4}px` : '16px',
        }}
      >
        {children}
      </div>
    ),

    Section: ({ props, children }) => (
      <div className="space-y-3">
        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#4a4858]">
            {props.title}
          </h2>
          {props.subtitle && (
            <p className="text-sm font-sans text-[#7a7889] mt-0.5">{props.subtitle}</p>
          )}
        </div>
        {children}
      </div>
    ),

    // ── DATA DISPLAY ─────────────────────────────────────────────────

    KPICard: ({ props }) => {
      const accent = getAccent(props.accentColor);
      const arrow = props.changeDirection === 'up' ? '\u2191' : props.changeDirection === 'down' ? '\u2193' : '';
      const changeColor =
        props.changeDirection === 'up'
          ? 'text-[#2dd4a8]'
          : props.changeDirection === 'down'
            ? 'text-[#e63946]'
            : 'text-[#7a7889]';

      return (
        <div className="relative rounded-xl border border-[#1e1e2e] bg-[#0f0f16] p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2a2a3e]">
          {/* Gradient top line */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accent }} />
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#7a7889] mb-2">
            {props.label}
          </p>
          <p className="text-2xl font-display font-bold text-[#e8e6e3]">{props.value}</p>
          {props.change && (
            <p className={`text-xs font-mono mt-1.5 ${changeColor}`}>
              {arrow} {props.change}
            </p>
          )}
        </div>
      );
    },

    CreatorCard: ({ props }) => {
      const vpsColor = getVPSColor(props.vpsScore);
      const avatarBg = getAccent(props.avatarColor);
      const initial = props.name.charAt(0).toUpperCase();

      return (
        <div
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('trendzo-action', {
                detail: { action: 'analyze_creator', creatorName: props.name },
              }));
            }
          }}
          className="rounded-xl border border-[#1e1e2e] bg-[#0f0f16] p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/50"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-display font-bold text-white"
              style={{ backgroundColor: avatarBg }}
            >
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-sans font-semibold text-[#e8e6e3] truncate">
                  {props.name}
                </h3>
                {/* Status dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 ml-2"
                  style={{ backgroundColor: statusColors[props.status] ?? '#7a7889' }}
                />
              </div>

              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-[#1a1a2e] text-[#7a7889]">
                {props.niche}
              </span>

              <div className="flex items-center gap-4 mt-3">
                {/* VPS mini ring */}
                <div className="flex items-center gap-1.5">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#1e1e2e" strokeWidth="2" />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke={vpsColor}
                      strokeWidth="2"
                      strokeDasharray={`${(props.vpsScore / 100) * 50.27} 50.27`}
                      strokeLinecap="round"
                      transform="rotate(-90 10 10)"
                    />
                  </svg>
                  <span className="text-xs font-mono" style={{ color: vpsColor }}>
                    {props.vpsScore}
                  </span>
                </div>

                <span className="text-xs font-mono text-[#7a7889]">
                  {props.scriptCount} script{props.scriptCount !== 1 ? 's' : ''}
                </span>
              </div>

              {props.lastActive && (
                <p className="text-[10px] font-mono text-[#4a4858] mt-2">
                  Last active: {props.lastActive}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    },

    VPSRing: ({ props }) => {
      const color = getVPSColor(props.score);
      const sizeMap = { sm: 48, md: 72, lg: 96 };
      const size = sizeMap[props.size ?? 'md'];
      const strokeWidth = size < 60 ? 3 : 4;
      const radius = (size - strokeWidth * 2) / 2;
      const circumference = 2 * Math.PI * radius;
      const dashArray = `${(props.score / 100) * circumference} ${circumference}`;

      return (
        <div className="flex flex-col items-center gap-1">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#1e1e2e"
              strokeWidth={strokeWidth}
            />
            {/* Score arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            {/* Score text */}
            <text
              x={size / 2}
              y={size / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              fontSize={size * 0.28}
              fontFamily="Playfair Display, serif"
              fontWeight="bold"
            >
              {props.score}
            </text>
          </svg>
          {props.label && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7889]">
              {props.label}
            </span>
          )}
        </div>
      );
    },

    MorningBriefCard: ({ props }) => {
      const borderColor = severityColors[props.severity] ?? '#00d4ff';

      return (
        <div
          className="rounded-xl border border-[#1e1e2e] bg-[#0f0f16] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2a2a3e]"
          style={{ borderLeftWidth: '3px', borderLeftColor: borderColor }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-sans font-semibold text-[#e8e6e3]">{props.title}</h3>
            {props.timestamp && (
              <span className="text-[10px] font-mono text-[#4a4858]">{props.timestamp}</span>
            )}
          </div>
          <p className="text-sm font-sans text-[#7a7889] leading-relaxed">{props.body}</p>
        </div>
      );
    },

    ScriptCard: ({ props }) => {
      const statusStyles: Record<string, string> = {
        draft: 'bg-[#7a7889]/15 text-[#7a7889]',
        review: 'bg-[#f59e0b]/15 text-[#f59e0b]',
        approved: 'bg-[#2dd4a8]/15 text-[#2dd4a8]',
        published: 'bg-[#7c3aed]/15 text-[#7c3aed]',
        completed: 'bg-[#2dd4a8]/15 text-[#2dd4a8]',
      };

      return (
        <div className="rounded-xl border border-[#1e1e2e] bg-[#0f0f16] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2a2a3e]">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-sm font-sans font-semibold text-[#e8e6e3] truncate">{props.title}</h3>
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${statusStyles[props.status] ?? ''}`}>
              {props.status}
            </span>
          </div>

          <p className="text-xs font-mono text-[#7a7889] mb-2">{props.creatorName}</p>

          {props.vpsScore != null && (
            <span
              className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold mb-2"
              style={{
                color: getVPSColor(props.vpsScore),
                backgroundColor: `${getVPSColor(props.vpsScore)}15`,
              }}
            >
              VPS {props.vpsScore}
            </span>
          )}

          {props.hookPreview && (
            <p className="text-xs font-sans text-[#4a4858] italic line-clamp-2 mt-1">
              &ldquo;{props.hookPreview}&rdquo;
            </p>
          )}

          {props.createdAt && (
            <p className="text-[10px] font-mono text-[#4a4858] mt-2">{props.createdAt}</p>
          )}
        </div>
      );
    },

    TrendItem: ({ props }) => {
      const dotColor = momentumColors[props.momentum] ?? '#7a7889';

      return (
        <div className="flex items-center gap-3 rounded-xl border border-[#1e1e2e] bg-[#0f0f16] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2a2a3e]">
          {/* Momentum dot */}
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-sans font-semibold text-[#e8e6e3] truncate">
                {props.topic}
              </span>
              <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded bg-[#1a1a2e] text-[#7a7889]">
                {props.category}
              </span>
            </div>
            {props.description && (
              <p className="text-xs font-sans text-[#4a4858] mt-0.5 truncate">{props.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: dotColor }}>
              {props.momentum}
            </span>
            {props.relevanceScore != null && (
              <span className="text-xs font-mono text-[#7a7889]">{props.relevanceScore}%</span>
            )}
          </div>
        </div>
      );
    },

    ComparisonTable: ({ props }) => (
      <div className="rounded-xl border border-[#1e1e2e] bg-[#0f0f16] overflow-hidden">
        {props.title && (
          <div className="px-4 py-3 border-b border-[#1e1e2e]">
            <h3 className="text-sm font-sans font-semibold text-[#e8e6e3]">{props.title}</h3>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="bg-[#0a0a10]">
              {props.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-[0.15em] text-[#4a4858] font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, ri) => (
              <tr
                key={ri}
                className={`border-t border-[#1e1e2e] ${ri % 2 === 1 ? 'bg-[#0a0a10]/50' : ''}`}
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-sm font-mono text-[#e8e6e3]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),

    // ── FEEDBACK & STATUS ────────────────────────────────────────────

    StatBadge: ({ props }) => (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${variantStyles[props.variant ?? 'default']}`}
      >
        <span className="text-[#7a7889]">{props.label}</span>
        <span className="font-semibold">{props.value}</span>
      </span>
    ),

    AlertBanner: ({ props }) => {
      const borderColor = severityColors[props.variant === 'danger' ? 'warning' : props.variant] ?? '#00d4ff';
      const iconMap: Record<string, string> = {
        info: '\u2139\uFE0F',
        success: '\u2705',
        warning: '\u26A0\uFE0F',
        danger: '\uD83D\uDED1',
      };

      return (
        <div
          className="w-full rounded-xl border border-[#1e1e2e] bg-[#0f0f16] px-4 py-3 flex items-start gap-3"
          style={{ borderLeftWidth: '3px', borderLeftColor: borderColor }}
        >
          <span className="text-base flex-shrink-0 mt-0.5">{iconMap[props.variant] ?? ''}</span>
          <div>
            <h4 className="text-sm font-sans font-semibold text-[#e8e6e3]">{props.title}</h4>
            <p className="text-sm font-sans text-[#7a7889] mt-0.5">{props.message}</p>
          </div>
        </div>
      );
    },

    EmptyState: ({ props }) => {
      const iconMap: Record<string, string> = {
        search: '\uD83D\uDD0D',
        chart: '\uD83D\uDCCA',
        user: '\uD83D\uDC64',
        clock: '\uD83D\uDD52',
      };

      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#1a1a2e] border border-[#1e1e2e] flex items-center justify-center mb-4 text-xl">
            {iconMap[props.icon ?? 'search'] ?? '\uD83D\uDD0D'}
          </div>
          <h3 className="text-sm font-sans font-semibold text-[#7a7889] mb-1">{props.title}</h3>
          <p className="text-xs font-sans text-[#4a4858] max-w-xs">{props.message}</p>
        </div>
      );
    },

    // ── TYPOGRAPHY ───────────────────────────────────────────────────

    Heading: ({ props }) => {
      const Tag = (props.level ?? 'h2') as keyof JSX.IntrinsicElements;
      const sizeClass: Record<string, string> = {
        h1: 'text-3xl',
        h2: 'text-2xl',
        h3: 'text-xl',
      };

      return (
        <Tag className={`font-display font-bold text-[#e8e6e3] tracking-tight ${sizeClass[props.level ?? 'h2']}`}>
          {props.text}
        </Tag>
      );
    },

    Text: ({ props }) => {
      const styles: Record<string, string> = {
        body: 'font-sans text-[#d1d0cc] text-sm leading-relaxed',
        caption: 'font-sans text-[#7a7889] text-sm',
        mono: 'font-mono text-[#00d4ff] text-sm',
        label: 'font-mono uppercase tracking-[0.15em] text-[10px] text-[#4a4858]',
      };

      return (
        <p className={styles[props.variant ?? 'body']}>
          {props.content}
        </p>
      );
    },

    // ── INTERACTIVE ──────────────────────────────────────────────────

    ActionButton: ({ props, emit, on }) => {
      const { handlers } = useActions();
      const base = 'px-4 py-2 rounded-lg text-sm font-sans font-medium transition-all duration-200 cursor-pointer';
      const variants: Record<string, string> = {
        primary: `${base} text-white hover:opacity-90`,
        secondary: `${base} border border-[#1e1e2e] text-[#e8e6e3] hover:border-[#7c3aed]/50 hover:bg-[#1a1a2e]`,
        ghost: `${base} text-[#7a7889] hover:text-[#e8e6e3] hover:bg-[#1a1a2e]`,
        danger: `${base} text-[#e63946] border border-[#e63946]/30 hover:bg-[#e63946]/10`,
      };
      const isPrimary = (props.variant ?? 'primary') === 'primary';

      const handleClick = () => {
        const pressHandle = on('press');
        if (pressHandle.bound) {
          pressHandle.emit();
        } else if (props.action && handlers[props.action]) {
          handlers[props.action]({ ...props, _source: 'action-button' });
        }
      };

      return (
        <button
          className={variants[props.variant ?? 'primary']}
          style={isPrimary ? { background: 'linear-gradient(135deg, #7c3aed, #e63946)' } : undefined}
          onClick={handleClick}
        >
          {props.label}
        </button>
      );
    },

    // ── CREATOR DEEP-DIVE ──────────────────────────────────────────────

    CreatorProfile: ({ props }) => {
      const vpsColor = getVPSColor(props.vps_score);
      const sColor = statusColors[props.status ?? 'active'] ?? '#6b7280';
      const initials = props.creator_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      function formatCount(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
        return String(n);
      }

      const stats: { value: string; label: string }[] = [
        { value: formatCount(props.follower_count), label: 'Followers' },
        ...(props.total_videos != null ? [{ value: String(props.total_videos), label: 'Total Videos' }] : []),
        ...(props.avg_dps != null ? [{ value: props.avg_dps.toFixed(1), label: 'Avg DPS' }] : []),
        ...(props.top_dps != null ? [{ value: props.top_dps.toFixed(1), label: 'Top DPS' }] : []),
      ];

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Avatar */}
            {props.avatar_url ? (
              <img
                src={props.avatar_url}
                alt={props.creator_name}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  background: 'linear-gradient(#0f0f16, #0f0f16) padding-box, linear-gradient(135deg, #7c3aed, #00d4ff) border-box',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            {/* Name / handle / niche / status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  {props.creator_name}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: '#00d4ff',
                  }}
                >
                  {props.handle}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    padding: '2px 10px',
                    borderRadius: 999,
                  }}
                >
                  {props.niche}
                </span>
              </div>

              {props.status && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    color: sColor,
                    backgroundColor: `${sColor}26`,
                    padding: '2px 10px',
                    borderRadius: 999,
                  }}
                >
                  {props.status}
                </span>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 32, marginTop: 20 }}>
                {stats.map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#6b7280',
                        marginTop: 2,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VPS score */}
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 48,
                fontWeight: 700,
                color: vpsColor,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {props.vps_score}
            </div>
          </div>

          {/* Bio + join date */}
          {(props.bio || props.join_date) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 16,
              }}
            >
              {props.bio && (
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: '#6b7280',
                    margin: 0,
                  }}
                >
                  {props.bio}
                </p>
              )}
              {props.join_date && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#6b7280',
                    flexShrink: 0,
                    marginLeft: 16,
                  }}
                >
                  Joined {props.join_date}
                </span>
              )}
            </div>
          )}
        </div>
      );
    },

    VPSTimeline: ({ props }) => {
      const scoreColor = getVPSColor(props.current_score);
      const trendConfig: Record<string, { arrow: string; color: string; label: string }> = {
        rising: { arrow: '↑', color: '#2dd4a8', label: 'Rising' },
        falling: { arrow: '↓', color: '#e63946', label: 'Falling' },
        stable: { arrow: '→', color: '#f59e0b', label: 'Stable' },
      };
      const t = trendConfig[props.trend] ?? trendConfig.stable;

      if (props.data_points.length < 2) {
        return (
          <div
            style={{
              background: '#0f0f16',
              border: '1px solid #1e1e2e',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                VPS Timeline
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#6b7280',
              }}
            >
              Not enough data for timeline
            </div>
          </div>
        );
      }

      const chartW = 600;
      const chartH = 120;
      const padX = 30;
      const padY = 10;
      const pts = props.data_points;
      const xStep = pts.length > 1 ? (chartW - padX * 2) / (pts.length - 1) : 0;

      const points = pts.map((dp, i) => ({
        x: padX + i * xStep,
        y: padY + (1 - dp.score / 100) * (chartH - padY * 2),
        ...dp,
      }));

      const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
      const areaPath = `M${points[0].x},${chartH} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${chartH} Z`;

      const midIdx = Math.floor(pts.length / 2);
      const xLabels = [
        { idx: 0, date: pts[0].date },
        ...(pts.length > 2 ? [{ idx: midIdx, date: pts[midIdx].date }] : []),
        { idx: pts.length - 1, date: pts[pts.length - 1].date },
      ];

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                VPS Timeline
              </span>
              <span style={{ color: t.color, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                {t.arrow} {t.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {props.period && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  {props.period}
                </span>
              )}
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: scoreColor,
                }}
              >
                {props.current_score}
              </span>
            </div>
          </div>

          {/* SVG Chart */}
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ width: '100%', height: 120 }}
            preserveAspectRatio="none"
          >
            {/* Fill area */}
            <path d={areaPath} fill="rgba(0, 212, 255, 0.1)" />
            {/* Line */}
            <polyline
              points={polyline}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Dots + labels */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={4} fill="#00d4ff" />
                {p.label && (
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="#e5e7eb"
                    fontSize="8"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            ))}
            {/* X-axis date labels */}
            {xLabels.map((xl) => (
              <text
                key={xl.idx}
                x={points[xl.idx].x}
                y={chartH - 2}
                textAnchor={xl.idx === 0 ? 'start' : xl.idx === pts.length - 1 ? 'end' : 'middle'}
                fill="#6b7280"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {xl.date}
              </text>
            ))}
          </svg>
        </div>
      );
    },

    NicheRanking: ({ props }) => {
      const pct = props.percentile;
      const rankColor = pct >= 75 ? '#2dd4a8' : pct >= 50 ? '#f59e0b' : pct >= 25 ? '#00d4ff' : '#e63946';

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              Niche Ranking
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                padding: '2px 10px',
                borderRadius: 999,
              }}
            >
              {props.niche}
            </span>
          </div>

          {/* Rank display */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 36,
                fontWeight: 700,
                color: rankColor,
              }}
            >
              #{props.rank}
              {props.rank === 1 && ' 👑'}
            </span>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#6b7280',
                marginTop: 4,
              }}
            >
              of {props.total_in_niche} in {props.niche}
            </div>
          </div>

          {/* Percentile bar */}
          <div
            style={{
              width: '100%',
              height: 8,
              backgroundColor: '#1e1e2e',
              borderRadius: 4,
              position: 'relative',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: rankColor,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: -3,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: rankColor,
                border: '2px solid #0f0f16',
                transform: 'translateX(-50%)',
              }}
            />
          </div>

          {/* Comparison stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              You: {props.creator_vps}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              Niche Avg: {props.niche_avg_vps}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: '#2dd4a8',
              }}
            >
              Top: {props.top_performer_vps}
            </span>
          </div>
        </div>
      );
    },

    ContentTable: ({ props }) => {
      function fmtViews(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
        return String(n);
      }

      const headerStyle: React.CSSProperties = {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#6b7280',
        padding: '8px 12px',
        textAlign: 'left',
        fontWeight: 400,
        borderBottom: '1px solid #1e1e2e',
      };

      const cellStyle: React.CSSProperties = {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: '#e5e7eb',
        padding: '8px 12px',
      };

      if (props.videos.length === 0) {
        return (
          <div
            style={{
              background: '#0f0f16',
              border: '1px solid #1e1e2e',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              Content Performance
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#6b7280',
              }}
            >
              No content data available
            </div>
          </div>
        );
      }

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 24,
              paddingBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              Content Performance
            </span>
            {props.total_videos != null && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: '#6b7280',
                }}
              >
                {props.total_videos} videos
              </span>
            )}
          </div>

          {/* Scrollable table */}
          <div
            style={{
              maxHeight: 300,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#3f3f5e #1e1e2e',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Title</th>
                  <th style={headerStyle}>DPS</th>
                  <th style={headerStyle}>Views</th>
                  <th style={headerStyle}>Shares</th>
                  <th style={headerStyle}>Saves</th>
                  <th style={headerStyle}>Comments</th>
                  <th style={headerStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {props.videos.map((v, i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 1 ? '#0f0f16' : 'transparent',
                    }}
                  >
                    <td
                      style={{
                        ...cellStyle,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={v.title}
                    >
                      {v.title.length > 40 ? v.title.slice(0, 40) + '…' : v.title}
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 700,
                        color: v.dps_score != null ? getVPSColor(v.dps_score) : '#6b7280',
                      }}
                    >
                      {v.dps_score != null ? v.dps_score : '—'}
                    </td>
                    <td style={{ ...cellStyle, color: '#ffffff', fontWeight: 700 }}>
                      {fmtViews(v.views)}
                    </td>
                    <td style={cellStyle}>{v.shares != null ? fmtViews(v.shares) : '—'}</td>
                    <td style={cellStyle}>{v.saves != null ? fmtViews(v.saves) : '—'}</td>
                    <td style={cellStyle}>{v.comments != null ? fmtViews(v.comments) : '—'}</td>
                    <td
                      style={{
                        ...cellStyle,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: '#6b7280',
                      }}
                    >
                      {v.posted_date ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    },

    EngagementBreakdown: ({ props }) => {
      const gradeColors: Record<string, string> = {
        A: '#2dd4a8',
        B: '#00d4ff',
        C: '#f59e0b',
        D: '#e63946',
        F: '#e63946',
      };

      const maxVal = Math.max(
        ...props.metrics.flatMap((m) => [m.creator_value, m.niche_avg]),
        1,
      );

      function unitSuffix(unit?: string): string {
        if (unit === 'percent') return '%';
        if (unit === 'ratio') return 'x';
        return '';
      }

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              Engagement Breakdown
            </span>
            {props.overall_engagement_grade && (
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: gradeColors[props.overall_engagement_grade] ?? '#6b7280',
                }}
              >
                {props.overall_engagement_grade}
              </span>
            )}
          </div>

          {/* Metric rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {props.metrics.map((m, i) => {
              const creatorPct = (m.creator_value / maxVal) * 100;
              const nichePct = (m.niche_avg / maxVal) * 100;
              const diff = m.creator_value > m.niche_avg;
              const indicator = diff ? '▲' : m.creator_value < m.niche_avg ? '▼' : '';
              const indicatorColor = diff ? '#2dd4a8' : '#e63946';
              const sfx = unitSuffix(m.unit);

              return (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: '#ffffff',
                      marginBottom: 6,
                    }}
                  >
                    {m.metric_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      {/* Creator bar */}
                      <div
                        style={{
                          height: 8,
                          backgroundColor: '#1e1e2e',
                          borderRadius: 4,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            width: `${creatorPct}%`,
                            height: '100%',
                            backgroundColor: '#00d4ff',
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      {/* Niche bar */}
                      <div
                        style={{
                          height: 5,
                          backgroundColor: '#1e1e2e',
                          borderRadius: 3,
                        }}
                      >
                        <div
                          style={{
                            width: `${nichePct}%`,
                            height: '100%',
                            backgroundColor: '#3f3f5e',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        minWidth: 120,
                        textAlign: 'right',
                      }}
                    >
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>
                        {m.creator_value}{sfx}
                      </span>
                      <span style={{ color: '#6b7280' }}> / {m.niche_avg}{sfx}</span>
                      {indicator && (
                        <span style={{ color: indicatorColor, marginLeft: 4, fontSize: 11 }}>
                          {indicator}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 16,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: '#6b7280',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#00d4ff',
                  display: 'inline-block',
                }}
              />
              Creator
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#3f3f5e',
                  display: 'inline-block',
                }}
              />
              Niche Avg
            </span>
          </div>
        </div>
      );
    },

    RecommendationCard: ({ props }) => {
      const priorityColors: Record<string, string> = {
        critical: '#e63946',
        high: '#f59e0b',
        medium: '#7c3aed',
        low: '#2dd4a8',
      };
      const color = priorityColors[props.priority] ?? '#7c3aed';

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
            paddingLeft: 28,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `inset 0 0 40px ${color}0d`,
          }}
        >
          {/* Left accent bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: color,
              borderRadius: '16px 0 0 16px',
            }}
          />

          {/* Priority badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {props.title}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                textTransform: 'uppercase',
                color: color,
                backgroundColor: `${color}1a`,
                padding: '2px 8px',
                borderRadius: 999,
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              {props.priority}
            </span>
          </div>

          {/* Rationale */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#e5e7eb',
              lineHeight: 1.6,
              margin: '12px 0 16px',
            }}
          >
            {props.rationale}
          </p>

          {/* Action items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {props.action_items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: '#e5e7eb',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#00d4ff',
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
                {item}
              </div>
            ))}
          </div>

          {/* Bottom row */}
          {(props.expected_impact || props.timeframe) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid #1e1e2e',
              }}
            >
              {props.expected_impact && (
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: '#2dd4a8',
                  }}
                >
                  {props.expected_impact}
                </span>
              )}
              {props.timeframe && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  {props.timeframe}
                </span>
              )}
            </div>
          )}
        </div>
      );
    },

    // ── ONBOARDING MANAGEMENT ──────────────────────────────────────────

    OnboardingPipeline: ({ props }) => {
      const stageColorMap: Record<string, string> = {
        invited: '#7c3aed',
        profile_setup: '#00d4ff',
        calibrating: '#f59e0b',
        ready: '#2dd4a8',
        active: '#34eab9',
        dropped: '#e63946',
      };

      function getStageColor(key: string, fallback?: string): string {
        return stageColorMap[key] ?? fallback ?? '#6b7280';
      }

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              Onboarding Pipeline
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {props.avg_completion_days != null && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  Avg {props.avg_completion_days}d to complete
                </span>
              )}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: '#6b7280',
                }}
              >
                {props.total_creators} creators
              </span>
            </div>
          </div>

          {/* Stages row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {props.stages.map((stage, si) => {
              const color = getStageColor(stage.stage_key, stage.color);
              return (
                <React.Fragment key={stage.stage_key}>
                  {si > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingTop: 24,
                        color: '#1e1e2e',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      ▸
                    </div>
                  )}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {/* Stage label */}
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: color,
                        fontWeight: 600,
                      }}
                    >
                      {stage.stage_name}
                    </span>
                    {/* Count badge */}
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: color,
                        backgroundColor: `${color}26`,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stage.creators.length}
                    </span>
                    {/* Creator chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                      {stage.creators.length === 0 ? (
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 12,
                            color: '#6b7280',
                            textAlign: 'center',
                          }}
                        >
                          —
                        </span>
                      ) : (
                        stage.creators.map((c, ci) => (
                          <div
                            key={ci}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 8px',
                              background: '#0f0f16',
                              border: `1px solid ${color}4d`,
                              borderRadius: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#ffffff',
                                flexShrink: 0,
                              }}
                            >
                              {c.avatar_initials ?? c.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: 12,
                                  color: '#ffffff',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {c.name}
                              </div>
                              {c.days_in_stage != null && (
                                <div
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 10,
                                    color: '#6b7280',
                                  }}
                                >
                                  {c.days_in_stage}d
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      );
    },

    OnboardingStats: ({ props }) => {
      const completionColor =
        props.completion_rate >= 70
          ? '#2dd4a8'
          : props.completion_rate >= 40
            ? '#f59e0b'
            : '#e63946';

      const stats: { value: string; label: string; color: string }[] = [
        { value: String(props.total_invited), label: 'Total Invited', color: '#ffffff' },
        { value: String(props.currently_onboarding), label: 'Currently Onboarding', color: '#00d4ff' },
        { value: String(props.completed), label: 'Completed', color: '#2dd4a8' },
        { value: String(props.dropped_off), label: 'Dropped Off', color: '#e63946' },
        { value: `${props.completion_rate}%`, label: 'Completion Rate', color: completionColor },
        ...(props.avg_days_to_complete != null
          ? [{ value: String(props.avg_days_to_complete), label: 'Avg Days to Complete', color: '#ffffff' }]
          : []),
      ];

      const hasWeekly = props.this_week_new != null || props.this_week_completed != null;

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 16,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 20,
            }}
          >
            Onboarding Overview
          </div>

          {/* Stat blocks */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && (
                  <div
                    style={{
                      width: 1,
                      alignSelf: 'stretch',
                      backgroundColor: '#1e1e2e',
                      margin: '4px 20px',
                      minHeight: 36,
                    }}
                  />
                )}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 24,
                      fontWeight: 700,
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#6b7280',
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Weekly summary */}
          {hasWeekly && (
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: '#6b7280',
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid #1e1e2e',
              }}
            >
              This week:{' '}
              {props.this_week_new != null && <>{props.this_week_new} invited</>}
              {props.this_week_new != null && props.this_week_completed != null && ', '}
              {props.this_week_completed != null && <>{props.this_week_completed} completed</>}
            </div>
          )}
        </div>
      );
    },

    CalibrationProgress: ({ props }) => {
      const radius = 24;
      const circumference = 2 * Math.PI * radius;
      const dash = (props.completion_percent / 100) * circumference;

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {props.creator_name}
              </span>
              {props.handle && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: '#00d4ff',
                  }}
                >
                  {props.handle}
                </span>
              )}
            </div>
            {/* Completion ring */}
            <svg width={60} height={60} viewBox="0 0 60 60">
              <circle cx={30} cy={30} r={radius} fill="none" stroke="#1e1e2e" strokeWidth={4} />
              <circle
                cx={30}
                cy={30}
                r={radius}
                fill="none"
                stroke="#2dd4a8"
                strokeWidth={4}
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
              <text
                x={30}
                y={30}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize={16}
                fontFamily="Playfair Display, serif"
                fontWeight={700}
              >
                {props.completion_percent}
              </text>
            </svg>
          </div>

          {/* Step list */}
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: 20 }}>
            {/* Vertical connecting line */}
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: 5,
                bottom: 5,
                width: 2,
                backgroundColor: '#1e1e2e',
              }}
            />
            {/* Green overlay for completed section */}
            {(() => {
              const lastCompleted = props.steps.reduce(
                (acc, s, i) => (s.status === 'completed' ? i : acc),
                -1,
              );
              if (lastCompleted < 0) return null;
              const pct = ((lastCompleted + 1) / props.steps.length) * 100;
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: 5,
                    top: 5,
                    width: 2,
                    height: `${pct}%`,
                    backgroundColor: '#2dd4a8',
                  }}
                />
              );
            })()}

            {props.steps.map((step, i) => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 0',
                    position: 'relative',
                  }}
                >
                  {/* Status icon */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -20,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      ...(isCompleted
                        ? { backgroundColor: '#2dd4a8', color: '#ffffff' }
                        : isInProgress
                          ? { backgroundColor: '#f59e0b', color: '#ffffff' }
                          : { backgroundColor: 'transparent', border: '2px solid #3f3f5e' }),
                      transform: 'translateX(-1px)',
                    }}
                  >
                    {isCompleted ? '✓' : isInProgress ? '●' : ''}
                  </div>
                  {/* Step name */}
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: isCompleted || isInProgress ? '#ffffff' : '#6b7280',
                      flex: 1,
                    }}
                  >
                    {step.step_name}
                  </span>
                  {/* Completed date */}
                  {step.completed_at && (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: '#6b7280',
                      }}
                    >
                      {step.completed_at}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid #1e1e2e',
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#6b7280',
                display: 'flex',
                gap: 16,
              }}
            >
              {props.started_at && <span>Started {props.started_at}</span>}
              {props.last_activity && <span>Last active {props.last_activity}</span>}
            </div>
            {props.estimated_remaining && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  padding: '2px 10px',
                  borderRadius: 999,
                }}
              >
                {props.estimated_remaining}
              </span>
            )}
          </div>
        </div>
      );
    },

    OnboardingCreatorRow: ({ props }) => {
      const stageColorMap: Record<string, string> = {
        invited: '#7c3aed',
        profile_setup: '#00d4ff',
        calibrating: '#f59e0b',
        ready: '#2dd4a8',
        active: '#34eab9',
        dropped: '#e63946',
      };
      const color = stageColorMap[props.stage] ?? '#6b7280';
      const [hovered, setHovered] = React.useState(false);

      return (
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            height: 56,
            borderBottom: '1px solid #1e1e2e',
            backgroundColor: hovered ? '#0f0f16' : 'transparent',
            transition: 'background-color 0.15s',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            {props.avatar_initials ?? props.creator_name.charAt(0).toUpperCase()}
          </div>

          {/* Name + handle */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {props.creator_name}
              </span>
              {props.handle && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  {props.handle}
                </span>
              )}
            </div>
          </div>

          {/* Niche pill */}
          {props.niche && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                padding: '2px 8px',
                borderRadius: 999,
                flexShrink: 0,
              }}
            >
              {props.niche}
            </span>
          )}

          {/* Calibration mini bar */}
          {props.stage === 'calibrating' && props.calibration_percent != null && (
            <div
              style={{
                width: 60,
                height: 4,
                backgroundColor: '#1e1e2e',
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: `${props.calibration_percent}%`,
                  height: '100%',
                  backgroundColor: '#2dd4a8',
                  borderRadius: 2,
                }}
              />
            </div>
          )}

          {/* Blocker */}
          {props.blocker && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: '#e63946',
                flexShrink: 0,
                maxWidth: 120,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={props.blocker}
            >
              ⚠ {props.blocker}
            </span>
          )}

          {/* Stage pill + days */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: color,
                backgroundColor: `${color}26`,
                padding: '2px 8px',
                borderRadius: 999,
                textTransform: 'capitalize',
              }}
            >
              {props.stage.replace('_', ' ')}
            </span>
            {props.days_in_pipeline != null && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#6b7280',
                }}
              >
                {props.days_in_pipeline}d
              </span>
            )}
          </div>
        </div>
      );
    },

    InviteCard: ({ props }) => {
      const statusColorMap: Record<string, string> = {
        pending: '#f59e0b',
        accepted: '#2dd4a8',
        expired: '#6b7280',
        revoked: '#e63946',
      };
      const color = statusColorMap[props.invite_status] ?? '#6b7280';
      const isExpired = props.invite_status === 'expired';

      const details: { label: string; value: string }[] = [
        { label: 'Sent', value: props.sent_date },
        { label: 'Expires', value: props.expires_date ?? '—' },
        ...(props.accepted_date ? [{ label: 'Accepted', value: props.accepted_date }] : []),
      ];

      return (
        <div
          style={{
            background: isExpired
              ? 'linear-gradient(135deg, rgba(230, 57, 70, 0.03), #0f0f16)'
              : '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
            paddingLeft: 28,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left accent bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: color,
              borderRadius: '16px 0 0 16px',
            }}
          />

          {/* Top row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {props.creator_name ?? props.email ?? 'Unknown'}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: color,
                backgroundColor: `${color}26`,
                padding: '2px 10px',
                borderRadius: 999,
                textTransform: 'capitalize',
              }}
            >
              {props.invite_status}
            </span>
          </div>

          {/* Details grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px 24px',
            }}
          >
            {details.map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  {d.label}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#e5e7eb',
                  }}
                >
                  {d.value}
                </span>
              </div>
            ))}
            {props.niche && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  Niche
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {props.niche}
                </span>
              </div>
            )}
            {props.sent_by && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  Sent by
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: '#e5e7eb',
                  }}
                >
                  {props.sent_by}
                </span>
              </div>
            )}
          </div>

          {/* Invite code */}
          {props.invite_code && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#6b7280',
                marginTop: 12,
                paddingTop: 8,
                borderTop: '1px solid #1e1e2e',
              }}
            >
              Code: {props.invite_code.slice(0, 4)}••••
            </div>
          )}
        </div>
      );
    },

    OnboardingTimeline: ({ props }) => {
      const eventColorMap: Record<string, string> = {
        invited: '#7c3aed',
        accepted: '#7c3aed',
        profile_started: '#00d4ff',
        profile_completed: '#00d4ff',
        calibration_started: '#f59e0b',
        calibration_step_done: '#f59e0b',
        calibration_completed: '#f59e0b',
        activated: '#2dd4a8',
        dropped: '#e63946',
        reactivated: '#2dd4a8',
        note: '#6b7280',
      };

      const currentStageColor =
        eventColorMap[props.current_stage] ?? '#6b7280';

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {props.creator_name}&apos;s Onboarding Journey
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: currentStageColor,
                  backgroundColor: `${currentStageColor}26`,
                  padding: '2px 10px',
                  borderRadius: 999,
                  textTransform: 'capitalize',
                }}
              >
                {props.current_stage.replace(/_/g, ' ')}
              </span>
              {props.total_days != null && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  {props.total_days} days
                </span>
              )}
            </div>
          </div>

          {/* Timeline */}
          {props.events.length < 2 ? (
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#6b7280',
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              Currently at{' '}
              <span style={{ color: currentStageColor, textTransform: 'capitalize' }}>
                {props.current_stage.replace(/_/g, ' ')}
              </span>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {/* Vertical line */}
              <div
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 5,
                  bottom: 5,
                  width: 2,
                  backgroundColor: '#1e1e2e',
                }}
              />

              {props.events.map((evt, i) => {
                const dotColor = eventColorMap[evt.event_type] ?? '#6b7280';
                const isReactivated = evt.event_type === 'reactivated';
                return (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      paddingBottom: i < props.events.length - 1 ? 16 : 0,
                    }}
                  >
                    {/* Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: -24,
                        top: 2,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        transform: 'translateX(1px)',
                        ...(isReactivated
                          ? { boxShadow: `0 0 8px ${dotColor}80` }
                          : {}),
                      }}
                    />
                    {/* Content */}
                    <div>
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          color: '#ffffff',
                        }}
                      >
                        {evt.description}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: '#6b7280',
                          }}
                        >
                          {evt.timestamp}
                        </span>
                        {evt.metadata && (
                          <span
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 11,
                              color: '#6b7280',
                              fontStyle: 'italic',
                            }}
                          >
                            {evt.metadata}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    },

    // ── CULTURAL EVENT MANAGEMENT ──────────────────────────────────────

    EventCard: ({ props }) => {
      const categoryColorMap: Record<string, string> = {
        holiday: '#e63946',
        trending_topic: '#00d4ff',
        cultural_moment: '#7c3aed',
        industry_event: '#f59e0b',
        seasonal: '#2dd4a8',
        platform_trend: '#00d4ff',
        news_cycle: '#e63946',
      };
      const catColor = categoryColorMap[props.category] ?? '#6b7280';

      const statusColorMap: Record<string, string> = {
        upcoming: '#00d4ff',
        active: '#2dd4a8',
        passed: '#6b7280',
        draft: '#6b7280',
      };
      const sColor = statusColorMap[props.status ?? 'upcoming'] ?? '#6b7280';

      function relevanceColor(s: number): string {
        if (s >= 70) return '#2dd4a8';
        if (s >= 40) return '#f59e0b';
        return '#e63946';
      }

      function daysColor(d: number): string {
        if (d < 0) return '#e63946';
        if (d <= 7) return '#f59e0b';
        return '#2dd4a8';
      }

      function formatDate(iso: string): string {
        try {
          return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return iso; }
      }

      return (
        <div
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            padding: 24,
            paddingLeft: 28,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left accent bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: catColor,
              borderRadius: '16px 0 0 16px',
            }}
          />

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
                flex: 1,
              }}
            >
              {props.event_name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {props.relevance_score != null && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: relevanceColor(props.relevance_score),
                    backgroundColor: `${relevanceColor(props.relevance_score)}1a`,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {props.relevance_score} Relevance
                </span>
              )}
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  textTransform: 'uppercase',
                  color: catColor,
                  backgroundColor: `${catColor}26`,
                  padding: '2px 10px',
                  borderRadius: 999,
                }}
              >
                {props.category.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Date row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              {formatDate(props.event_date)}
            </span>
            {props.days_until != null && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: daysColor(props.days_until),
                  backgroundColor: `${daysColor(props.days_until)}1a`,
                  padding: '2px 8px',
                  borderRadius: 999,
                }}
              >
                {props.days_until < 0 ? `${Math.abs(props.days_until)}d ago` : props.days_until === 0 ? 'Today' : `in ${props.days_until} days`}
              </span>
            )}
            {props.status && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: sColor,
                  backgroundColor: `${sColor}1a`,
                  padding: '2px 8px',
                  borderRadius: 999,
                  textTransform: 'capitalize',
                }}
              >
                {props.status}
              </span>
            )}
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#e5e7eb',
              lineHeight: 1.6,
              margin: '12px 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {props.description}
          </p>

          {/* Matched niches */}
          {props.matched_niches && props.matched_niches.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {props.matched_niches.map((niche, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.10)',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {niche}
                </span>
              ))}
            </div>
          )}

          {/* Matched creators */}
          {props.matched_creators && props.matched_creators.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6b7280',
                  marginBottom: 8,
                }}
              >
                Matched Creators
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {props.matched_creators.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      background: '#08080d',
                      border: '1px solid #1e1e2e',
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#ffffff',
                        flexShrink: 0,
                      }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#ffffff' }}>{c.name}</div>
                      {c.fit_reason && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6b7280' }}>{c.fit_reason}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content suggestions */}
          {props.content_suggestions && props.content_suggestions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6b7280',
                  marginBottom: 8,
                }}
              >
                Content Angles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {props.content_suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: '#00d4ff',
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}.
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          {props.source && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#6b7280',
                fontStyle: 'italic',
                marginTop: 12,
                textAlign: 'right',
              }}
            >
              Source: {props.source}
            </div>
          )}
        </div>
      );
    },

    EventCalendar: ({ props }) => {
      const categoryColorMap: Record<string, string> = {
        holiday: '#e63946',
        trending_topic: '#00d4ff',
        cultural_moment: '#7c3aed',
        industry_event: '#f59e0b',
        seasonal: '#2dd4a8',
        platform_trend: '#00d4ff',
        news_cycle: '#e63946',
      };

      const start = new Date(props.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (props.view_mode === 'month') {
        const year = start.getFullYear();
        const month = start.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const cells: Array<{ day: number | null; date: Date | null }> = [];
        for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(year, month, d) });

        return (
          <div style={{ background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#ffffff' }}>
                Event Calendar
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>{monthName}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>Month view</span>
              </div>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {dayHeaders.map(d => (
                <div key={d} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase',
                  color: '#6b7280', textAlign: 'center', padding: '6px 0',
                }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {cells.map((cell, i) => {
                if (!cell.day || !cell.date) {
                  return <div key={i} style={{ minHeight: 64, background: 'transparent' }} />;
                }
                const cellDate = cell.date;
                const isToday = props.highlight_today && cellDate.toDateString() === today.toDateString();
                const isPast = cellDate < today;
                const dayEvents = props.events.filter(e => {
                  const ed = new Date(e.event_date);
                  return ed.getFullYear() === cellDate.getFullYear() && ed.getMonth() === cellDate.getMonth() && ed.getDate() === cellDate.getDate();
                });
                const visibleEvents = dayEvents.slice(0, 2);
                const overflow = dayEvents.length - 2;

                return (
                  <div
                    key={i}
                    style={{
                      minHeight: 64,
                      border: '1px solid #1e1e2e',
                      borderRadius: 4,
                      padding: 4,
                      opacity: isPast ? 0.4 : 1,
                      ...(isToday ? { boxShadow: 'inset 0 0 0 1px #00d4ff40' } : {}),
                    }}
                  >
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      color: isToday ? '#00d4ff' : '#e5e7eb',
                    }}>{cell.day}</div>
                    {visibleEvents.map((ev, j) => (
                      <div
                        key={j}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, marginTop: 2,
                        }}
                      >
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: categoryColorMap[ev.category] ?? '#6b7280',
                        }} />
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#e5e7eb',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{ev.event_name}</span>
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                        +{overflow} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total events */}
            {props.total_events != null && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280',
                textAlign: 'right', marginTop: 8,
              }}>{props.total_events} total events</div>
            )}
          </div>
        );
      }

      // Week view
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      });

      return (
        <div style={{ background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#ffffff' }}>
              Event Calendar
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>Week view</span>
          </div>

          {/* Week grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {weekDays.map((day, i) => {
              const isToday = props.highlight_today && day.toDateString() === today.toDateString();
              const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const dayEvents = props.events.filter(e => {
                const ed = new Date(e.event_date);
                return ed.toDateString() === day.toDateString();
              });

              return (
                <div
                  key={i}
                  style={{
                    minHeight: 120,
                    borderRadius: 8,
                    padding: 8,
                    backgroundColor: isToday ? 'rgba(0, 212, 255, 0.05)' : 'transparent',
                    border: '1px solid #1e1e2e',
                  }}
                >
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    color: isToday ? '#00d4ff' : '#6b7280', marginBottom: 8,
                  }}>
                    <div>{dayName}</div>
                    <div style={{ color: isToday ? '#00d4ff' : '#e5e7eb' }}>{dayNum}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayEvents.map((ev, j) => (
                      <div
                        key={j}
                        style={{
                          padding: '4px 6px',
                          borderLeft: `3px solid ${categoryColorMap[ev.category] ?? '#6b7280'}`,
                          background: '#08080d',
                          borderRadius: 4,
                        }}
                      >
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#e5e7eb',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          display: 'block',
                        }}>{ev.event_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* No events empty state */}
          {props.events.length === 0 && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280',
              textAlign: 'center', padding: '32px 0',
            }}>No events scheduled</div>
          )}

          {props.total_events != null && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280',
              textAlign: 'right', marginTop: 8,
            }}>{props.total_events} total events</div>
          )}
        </div>
      );
    },

    EventForm: ({ props }) => {
      const categoryColorMap: Record<string, string> = {
        holiday: '#e63946',
        trending_topic: '#00d4ff',
        cultural_moment: '#7c3aed',
        industry_event: '#f59e0b',
        seasonal: '#2dd4a8',
        platform_trend: '#00d4ff',
        news_cycle: '#e63946',
      };

      const pre = props.prefilled ?? {};

      const fieldStyle: React.CSSProperties = {
        background: '#08080d',
        border: '1px solid #1e1e2e',
        borderRadius: 8,
        padding: 12,
      };

      const labelStyle: React.CSSProperties = {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#6b7280',
        marginBottom: 4,
      };

      const emptyStyle: React.CSSProperties = {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
      };

      return (
        <div style={{ background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
            color: '#ffffff', marginBottom: 20,
          }}>
            {props.mode === 'edit' ? 'Edit Event' : 'New Cultural Event'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Event Name */}
            <div style={fieldStyle}>
              <div style={labelStyle}>Event Name</div>
              {pre.event_name
                ? <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#ffffff' }}>{pre.event_name}</div>
                : <div style={emptyStyle}>Not specified</div>
              }
            </div>

            {/* Date + Category row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldStyle}>
                <div style={labelStyle}>Date</div>
                {pre.event_date
                  ? <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#e5e7eb' }}>{pre.event_date}</div>
                  : <div style={emptyStyle}>Not specified</div>
                }
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Category</div>
                {pre.category
                  ? <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                      color: categoryColorMap[pre.category] ?? '#6b7280',
                      backgroundColor: `${categoryColorMap[pre.category] ?? '#6b7280'}26`,
                      padding: '2px 10px', borderRadius: 999, textTransform: 'capitalize',
                    }}>{pre.category.replace(/_/g, ' ')}</span>
                  : <div style={emptyStyle}>Not specified</div>
                }
              </div>
            </div>

            {/* Description */}
            <div style={fieldStyle}>
              <div style={labelStyle}>Description</div>
              {pre.description
                ? <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#e5e7eb', lineHeight: 1.6 }}>{pre.description}</div>
                : <div style={emptyStyle}>Not specified</div>
              }
            </div>

            {/* Niches */}
            <div style={fieldStyle}>
              <div style={labelStyle}>Matched Niches</div>
              {pre.matched_niches && pre.matched_niches.length > 0
                ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {pre.matched_niches.map((n, i) => (
                      <span key={i} style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.15)', padding: '2px 8px', borderRadius: 999,
                      }}>{n}</span>
                    ))}
                  </div>
                : <div style={emptyStyle}>Not specified</div>
              }
            </div>

            {/* Source */}
            {pre.source && (
              <div style={fieldStyle}>
                <div style={labelStyle}>Source</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>{pre.source}</div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'create_event', params: pre } }));
                }
              }}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                color: '#ffffff', backgroundColor: '#2dd4a8', border: 'none',
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Confirm &amp; Create
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: 'I want to edit the event details before creating it.' } }));
                }
              }}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                color: '#00d4ff', backgroundColor: 'transparent', border: '1px solid #00d4ff',
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Edit Details
            </button>
          </div>
        </div>
      );
    },

    TrendAlert: ({ props }) => {
      const urgencyConfig: Record<string, { bg: string; border: string; icon: string }> = {
        immediate: { bg: 'rgba(230, 57, 70, 0.08)', border: '#e63946', icon: '🔴' },
        today: { bg: 'rgba(245, 158, 11, 0.08)', border: '#f59e0b', icon: '⚡' },
        this_week: { bg: 'rgba(0, 212, 255, 0.05)', border: '#00d4ff', icon: '📅' },
        upcoming: { bg: '#0f0f16', border: '#2dd4a8', icon: '📌' },
      };
      const cfg = urgencyConfig[props.urgency] ?? urgencyConfig.upcoming;

      return (
        <div
          style={{
            background: cfg.bg,
            borderRadius: 12,
            padding: '12px 16px',
            borderLeft: `4px solid ${cfg.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Icon */}
          <span style={{ fontSize: 20, flexShrink: 0 }}>{cfg.icon}</span>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#ffffff',
            }}>{props.alert_title}</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#e5e7eb',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2,
            }}>{props.description}</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#00d4ff',
              fontStyle: 'italic', marginTop: 2,
            }}>{props.recommended_action}</div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            {props.affected_creators && props.affected_creators.length > 0 && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280',
              }}>{props.affected_creators.length} creator{props.affected_creators.length !== 1 ? 's' : ''}</span>
            )}
            {props.expires_at && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
              }}>Expires {props.expires_at}</span>
            )}
          </div>
        </div>
      );
    },

    // ── EVENT-TO-CREATOR BRIDGE ─────────────────────────────────────

    EventBrief: ({ props }) => {
      const priorityColors: Record<string, string> = {
        urgent: '#e63946', high: '#f59e0b', normal: '#7c3aed', low: '#2dd4a8',
      };
      const pColor = priorityColors[props.priority ?? 'normal'] ?? '#7c3aed';

      const creatorStatusColors: Record<string, string> = {
        pending: '#6b7280', accepted: '#00d4ff', in_progress: '#f59e0b',
        submitted: '#2dd4a8', published: '#2dd4a8',
      };

      const isDeadlineSoon = (() => {
        if (!props.deadline) return false;
        const diff = (new Date(props.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff <= 3;
      })();

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16,
          padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          {/* Top accent gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(to right, ${pColor}, transparent)`,
            borderRadius: '16px 16px 0 0',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#ffffff',
            }}>{props.brief_title}</span>
            {props.priority && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: pColor, backgroundColor: `${pColor}1a`,
                padding: '3px 10px', borderRadius: 99,
              }}>{props.priority}</span>
            )}
          </div>

          {/* Sub-header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#00d4ff' }}>
              For: {props.event_name}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>
              {props.event_date}
            </span>
            {props.deadline && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                color: isDeadlineSoon ? '#f59e0b' : '#2dd4a8',
              }}>Due: {props.deadline}</span>
            )}
          </div>

          {/* Content angle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
            }}>Content Angle</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#ffffff', fontStyle: 'italic',
              borderLeft: '3px solid #00d4ff', paddingLeft: 12,
            }}>{props.content_angle}</div>
          </div>

          {/* Talking points */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
            }}>Talking Points</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {props.talking_points.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00d4ff',
                    minWidth: 18, textAlign: 'right',
                  }}>{i + 1}.</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {props.content_format && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e5e7eb',
                  backgroundColor: '#1e1e2e', padding: '3px 10px', borderRadius: 99,
                }}>{props.content_format}</span>
              )}
              {props.tone && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>
                  {props.tone}
                </span>
              )}
            </div>
            {props.hashtags && props.hashtags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                {props.hashtags.map((tag, i) => (
                  <span key={i} style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    color: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    padding: '2px 8px', borderRadius: 99,
                  }}>#{tag.replace(/^#/, '')}</span>
                ))}
              </div>
            )}
          </div>

          {/* Assigned creators */}
          {props.assigned_creators && props.assigned_creators.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
              }}>Assigned Creators</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {props.assigned_creators.map((c, i) => {
                  const sColor = creatorStatusColors[c.status ?? 'pending'] ?? '#6b7280';
                  const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', backgroundColor: `${sColor}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: sColor,
                      }}>{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff' }}>{c.name}</span>
                          {c.status && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: sColor,
                              backgroundColor: `${sColor}1a`, padding: '2px 8px', borderRadius: 99,
                            }}>{c.status.replace('_', ' ')}</span>
                          )}
                        </div>
                        {c.personalized_angle && (
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280',
                            fontStyle: 'italic', marginTop: 2,
                          }}>{c.personalized_angle}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reference links */}
          {props.reference_links && props.reference_links.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {props.reference_links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  color: '#00d4ff', textDecoration: 'underline',
                }}>{link.length > 50 ? link.slice(0, 50) + '…' : link}</a>
              ))}
            </div>
          )}
        </div>
      );
    },

    CreatorMatch: ({ props }) => {
      const fitColor = props.fit_score >= 70 ? '#2dd4a8' : props.fit_score >= 40 ? '#f59e0b' : '#e63946';

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16,
          padding: 24, paddingLeft: 28, position: 'relative', overflow: 'hidden',
        }}>
          {/* Left gradient border */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            background: `linear-gradient(to bottom, ${fitColor}, transparent)`,
            borderRadius: '16px 0 0 16px',
          }} />

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#ffffff',
            }}>{props.creator_name}</span>
            {props.handle && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00d4ff' }}>
                {props.handle}
              </span>
            )}
            {props.vps_score != null && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                color: getVPSColor(props.vps_score), backgroundColor: `${getVPSColor(props.vps_score)}1a`,
                padding: '2px 8px', borderRadius: 99,
              }}>VPS {props.vps_score}</span>
            )}
          </div>

          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280', marginBottom: 16,
          }}>Match for: {props.event_name}</div>

          {/* Fit score */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: fitColor,
              }}>{props.fit_score}</span>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#6b7280',
              }}>/100</span>
            </div>
            <div style={{ height: 6, backgroundColor: '#1e1e2e', borderRadius: 3 }}>
              <div style={{
                width: `${props.fit_score}%`, height: '100%', backgroundColor: fitColor,
                borderRadius: 3, transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Fit reasons */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
            }}>Why This Creator</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {props.fit_reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#2dd4a8', fontSize: 13 }}>✓</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested angles */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
            }}>Suggested Content Angles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {props.suggested_angles.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00d4ff',
                    minWidth: 18, textAlign: 'right',
                  }}>{i + 1}.</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk factors */}
          {props.risk_factors && props.risk_factors.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#f59e0b', marginBottom: 8,
              }}>Considerations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {props.risk_factors.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#f59e0b', fontSize: 13 }}>⚠</span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#f59e0b', opacity: 0.85,
                    }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past performance */}
          {props.past_performance && (
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12,
              borderTop: '1px solid #1e1e2e',
            }}>
              {props.past_performance.similar_content_count != null && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280' }}>
                  Similar content: {props.past_performance.similar_content_count}
                </span>
              )}
              {props.past_performance.avg_dps_similar != null && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280' }}>
                  Avg DPS: {props.past_performance.avg_dps_similar}
                </span>
              )}
              {props.past_performance.best_performing_similar && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280' }}>
                  Best: {props.past_performance.best_performing_similar}
                </span>
              )}
            </div>
          )}
        </div>
      );
    },

    PushStatus: ({ props }) => {
      const statusColors: Record<string, string> = {
        not_sent: '#6b7280', sent: '#7c3aed', viewed: '#00d4ff', accepted: '#00d4ff',
        in_progress: '#f59e0b', submitted: '#2dd4a8', published: '#2dd4a8', declined: '#e63946',
      };

      const allPublished = props.creators.length > 0 && props.creators.every(c => c.status === 'published');

      // Summary bar segments
      const segmentOrder = ['published', 'accepted', 'sent', 'not_sent'] as const;
      const segmentColors: Record<string, string> = {
        published: '#2dd4a8', accepted: '#00d4ff', sent: '#7c3aed', not_sent: '#6b7280',
      };

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#ffffff',
            }}>Push Status</span>
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#00d4ff', marginBottom: 8,
          }}>{props.event_name}</div>

          {/* Dates */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {props.push_date && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>
                Pushed: {props.push_date}
              </span>
            )}
            {props.deadline && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>
                Deadline: {props.deadline}
              </span>
            )}
          </div>

          {/* Summary bar */}
          {props.summary && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#1e1e2e',
              }}>
                {segmentOrder.map(seg => {
                  const count = seg === 'not_sent' ? (props.summary!.pending ?? 0)
                    : seg === 'published' ? (props.summary!.published ?? 0)
                    : seg === 'accepted' ? (props.summary!.accepted ?? 0)
                    : (props.summary!.sent ?? 0);
                  const pct = props.summary!.total > 0 ? (count / props.summary!.total) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div key={seg} style={{
                      width: `${pct}%`, height: '100%', backgroundColor: segmentColors[seg],
                    }} />
                  );
                })}
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280', marginTop: 6,
                display: 'flex', gap: 8, flexWrap: 'wrap',
              }}>
                <span><span style={{ color: '#2dd4a8' }}>{props.summary.published}</span> published</span>
                <span>·</span>
                <span><span style={{ color: '#00d4ff' }}>{props.summary.accepted}</span> accepted</span>
                <span>·</span>
                <span><span style={{ color: '#7c3aed' }}>{props.summary.sent}</span> sent</span>
                <span>·</span>
                <span><span style={{ color: '#6b7280' }}>{props.summary.pending}</span> pending</span>
              </div>
            </div>
          )}

          {/* Creator rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {props.creators.map((c, i) => {
              const sColor = statusColors[c.status] ?? '#6b7280';
              const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: i < props.creators.length - 1 ? '1px solid #1e1e2e' : undefined,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: `${sColor}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: sColor,
                    flexShrink: 0,
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff' }}>{c.name}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: sColor,
                        backgroundColor: `${sColor}1a`, padding: '2px 8px', borderRadius: 99,
                      }}>{c.status.replace(/_/g, ' ')}</span>
                      {c.content_url && (
                        <a href={c.content_url} target="_blank" rel="noopener noreferrer" style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00d4ff',
                          textDecoration: 'none',
                        }}>View ↗</a>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                      {c.sent_at && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280' }}>
                          Sent: {c.sent_at}
                        </span>
                      )}
                      {c.responded_at && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280' }}>
                          Responded: {c.responded_at}
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280', marginTop: 2,
                      }}>{c.notes}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All published banner */}
          {allPublished && (
            <div style={{
              marginTop: 16, padding: '10px 16px', borderRadius: 8,
              backgroundColor: 'rgba(45, 212, 168, 0.1)', textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2dd4a8', fontWeight: 700,
            }}>🎉 All content published!</div>
          )}
        </div>
      );
    },

    BriefPreview: ({ props }) => {
      const priorityColors: Record<string, string> = {
        urgent: '#e63946', high: '#f59e0b', normal: '#7c3aed', low: '#2dd4a8',
      };
      const statusColors: Record<string, string> = {
        draft: '#6b7280', sent: '#7c3aed', in_progress: '#f59e0b', completed: '#2dd4a8',
      };
      const pColor = priorityColors[props.priority ?? 'normal'] ?? '#7c3aed';
      const sColor = statusColors[props.status ?? 'draft'] ?? '#6b7280';
      const isUrgentDeadline = props.priority === 'urgent';
      const truncatedAngle = props.content_angle.length > 60
        ? props.content_angle.slice(0, 60) + '…'
        : props.content_angle;

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16,
          padding: 16, position: 'relative', overflow: 'hidden', cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#131320')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0f0f16')}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Left */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#ffffff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{props.brief_title}</div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280', marginTop: 2,
              }}>for {props.event_name}</div>
            </div>

            {/* Center */}
            <div style={{
              flex: 1.5, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#e5e7eb',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={props.content_angle}>{truncatedAngle}</div>

            {/* Right */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0,
            }}>
              {props.priority && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase',
                  color: pColor, backgroundColor: `${pColor}1a`, padding: '2px 8px', borderRadius: 99,
                }}>{props.priority}</span>
              )}
              {props.deadline && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: isUrgentDeadline ? '#f59e0b' : '#6b7280',
                }}>{props.deadline}</span>
              )}
              {props.creator_count != null && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280' }}>
                  {props.creator_count} creator{props.creator_count !== 1 ? 's' : ''}
                </span>
              )}
              {props.status && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: sColor,
                  backgroundColor: `${sColor}1a`, padding: '2px 8px', borderRadius: 99,
                }}>{props.status.replace('_', ' ')}</span>
              )}
            </div>
          </div>

          {/* Completion bar */}
          {props.completion_percent != null && (
            <div style={{
              height: 4, backgroundColor: '#1e1e2e', borderRadius: 2, marginTop: 12,
            }}>
              <div style={{
                width: `${props.completion_percent}%`, height: '100%',
                backgroundColor: '#2dd4a8', borderRadius: 2,
              }} />
            </div>
          )}
        </div>
      );
    },

    PushConfirmation: ({ props }) => {
      const priorityColors: Record<string, string> = {
        urgent: '#e63946', high: '#f59e0b', normal: '#7c3aed', low: '#2dd4a8',
      };
      const pColor = priorityColors[props.priority ?? 'normal'] ?? '#7c3aed';

      function formatReach(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return String(n);
      }

      const handleConfirm = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('trendzo-action', {
            detail: {
              action: 'push_brief_to_creators',
              params: {
                event_name: props.event_name,
                brief_title: props.brief_title,
                creator_names: props.target_creators.map(c => c.name),
              },
            },
          }));
        }
      };

      const handleEdit = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('trendzo-chat', {
            detail: { message: 'I\'d like to edit this brief before pushing. What would you like to change?' },
          }));
        }
      };

      return (
        <div style={{
          background: '#0f0f16', border: '2px dashed #7c3aed', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#7c3aed',
            }}>Ready to Push</span>
            {props.priority && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: pColor, backgroundColor: `${pColor}1a`,
                padding: '3px 10px', borderRadius: 99,
              }}>{props.priority}</span>
            )}
          </div>

          {/* Event + brief info */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#00d4ff', marginBottom: 4,
          }}>{props.event_name}</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 4,
          }}>{props.brief_title}</div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb', fontStyle: 'italic', marginBottom: 12,
          }}>{props.content_angle}</div>

          {/* Deadline */}
          {props.deadline && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#f59e0b', marginBottom: 12,
            }}>Deadline: {props.deadline}</div>
          )}

          {/* Target creators */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
            }}>Will be sent to:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {props.target_creators.map((c, i) => {
                const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', backgroundColor: '#7c3aed33',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700, color: '#7c3aed',
                      }}>{initials}</div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#ffffff' }}>{c.name}</span>
                      {c.niche && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
                          backgroundColor: '#1e1e2e', padding: '2px 6px', borderRadius: 99,
                        }}>{c.niche}</span>
                      )}
                    </div>
                    {c.personalized_angle && (
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280',
                        marginLeft: 30,
                      }}>{c.personalized_angle}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estimated reach */}
          {props.estimated_reach != null && (
            <div style={{ marginBottom: 16 }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#6b7280',
              }}>Est. Reach: </span>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#2dd4a8',
              }}>{formatReach(props.estimated_reach)}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleConfirm}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                backgroundColor: '#2dd4a8', color: '#08080d', border: 'none',
                borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
              }}
            >Confirm &amp; Push</button>
            <button
              onClick={handleEdit}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                backgroundColor: 'transparent', color: '#00d4ff',
                border: '1px solid #00d4ff', borderRadius: 8,
                padding: '8px 12px', cursor: 'pointer',
              }}
            >Edit Brief</button>
          </div>
        </div>
      );
    },

    EventSummary: ({ props }) => {
      const gapColor = props.without_content > 0 ? '#e63946' : '#2dd4a8';

      const stats: { value: string; label: string; color: string }[] = [
        { value: String(props.total_events), label: 'Total Events', color: '#ffffff' },
        { value: String(props.upcoming_this_week), label: 'This Week', color: '#00d4ff' },
        { value: String(props.upcoming_this_month), label: 'This Month', color: '#7c3aed' },
        { value: String(props.with_content_planned), label: 'Content Planned', color: '#2dd4a8' },
        { value: String(props.without_content), label: 'Coverage Gaps', color: gapColor },
      ];

      return (
        <div style={{ background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
            color: '#ffffff', marginBottom: 20,
          }}>Cultural Events Overview</div>

          {/* Stat blocks */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && (
                  <div style={{
                    width: 1, alignSelf: 'stretch', backgroundColor: '#1e1e2e',
                    margin: '4px 20px', minHeight: 36,
                  }} />
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif", fontSize: 24,
                    fontWeight: 700, color: s.color,
                  }}>{s.value}</div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: '#6b7280', marginTop: 4,
                  }}>{s.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Next event */}
          {props.next_event && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280',
              marginTop: 16, paddingTop: 12, borderTop: '1px solid #1e1e2e',
            }}>
              Next:{' '}
              <span style={{ color: '#ffffff' }}>{props.next_event.name}</span>
              {' '}in{' '}
              <span style={{ color: '#f59e0b' }}>{props.next_event.days_until} days</span>
            </div>
          )}

          {/* Top category */}
          {props.top_category && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280',
              marginTop: props.next_event ? 4 : 16,
              ...(!props.next_event ? { paddingTop: 12, borderTop: '1px solid #1e1e2e' } : {}),
            }}>
              Most common: {props.top_category}
            </div>
          )}
        </div>
      );
    },

    // === BATCH OPERATIONS ═══════════════════════════════════════════════

    BriefGrid: ({ props }) => {
      const priorityColors: Record<string, string> = {
        urgent: '#e63946', high: '#f59e0b', normal: '#7c3aed', low: '#2dd4a8',
      };
      const briefStatusColors: Record<string, string> = {
        draft: '#6b7280', sent: '#7c3aed', in_progress: '#f59e0b', completed: '#2dd4a8',
      };
      const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {props.title && (
                <span style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#ffffff',
                }}>{props.title}</span>
              )}
              {props.filter_active && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#7c3aed',
                  backgroundColor: 'rgba(124, 58, 237, 0.1)', padding: '3px 10px', borderRadius: 99,
                }}>{props.filter_active}</span>
              )}
            </div>
            {props.total_briefs != null && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280',
              }}>{props.total_briefs} total</span>
            )}
          </div>

          {/* Grid or empty state */}
          {props.briefs.length === 0 ? (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280',
              textAlign: 'center', padding: '48px 0',
            }}>No briefs to display</div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16, maxHeight: 500, overflowY: 'auto',
            }}>
              {props.briefs.map((b, i) => {
                const pColor = priorityColors[b.priority ?? 'normal'] ?? '#7c3aed';
                const sColor = briefStatusColors[b.status ?? 'draft'] ?? '#6b7280';
                const isDeadlineSoon = (() => {
                  if (!b.deadline) return false;
                  const diff = (new Date(b.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                  return diff <= 7;
                })();

                return (
                  <div
                    key={i}
                    style={{
                      background: '#08080d', border: `1px solid ${hoveredIdx === i ? '#3f3f5e' : '#1e1e2e'}`,
                      borderRadius: 12, padding: 16, cursor: 'pointer',
                      transition: 'border-color 0.15s ease', position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Top row: title + priority dot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#ffffff',
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{b.brief_title}</span>
                      {b.priority && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', backgroundColor: pColor, flexShrink: 0,
                        }} />
                      )}
                    </div>

                    {/* Event name */}
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#00d4ff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6,
                    }}>for {b.event_name}</div>

                    {/* Content angle */}
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#e5e7eb',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', lineHeight: '1.4em', maxHeight: '2.8em', marginBottom: 10,
                    }}>{b.content_angle}</div>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {b.deadline && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                          color: isDeadlineSoon ? '#f59e0b' : '#6b7280',
                        }}>{b.deadline}</span>
                      )}
                      {b.creator_count != null && (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6b7280',
                        }}>{b.creator_count} creator{b.creator_count !== 1 ? 's' : ''}</span>
                      )}
                      {b.status && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, textTransform: 'uppercase',
                          color: sColor, backgroundColor: `${sColor}1a`, padding: '2px 6px', borderRadius: 99,
                        }}>{b.status.replace('_', ' ')}</span>
                      )}
                    </div>

                    {/* Completion bar */}
                    {b.completion_percent != null && (
                      <div style={{
                        height: 3, backgroundColor: '#1e1e2e', borderRadius: 2, marginTop: 10,
                      }}>
                        <div style={{
                          width: `${b.completion_percent}%`, height: '100%',
                          backgroundColor: '#2dd4a8', borderRadius: 2,
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    },

    BriefEditor: ({ props }) => {
      const priorityColors: Record<string, string> = {
        urgent: '#e63946', high: '#f59e0b', normal: '#7c3aed', low: '#2dd4a8',
      };
      const creatorStatusColors: Record<string, string> = {
        pending: '#6b7280', accepted: '#00d4ff', in_progress: '#f59e0b',
        submitted: '#2dd4a8', published: '#2dd4a8',
      };
      const pColor = priorityColors[props.priority ?? 'normal'] ?? '#7c3aed';
      const confColor = (props.ai_confidence ?? 0) >= 80 ? '#2dd4a8' : (props.ai_confidence ?? 0) >= 60 ? '#f59e0b' : '#e63946';

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 32,
        }}>
          {/* Header */}
          <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#ffffff',
            }}>{props.brief_title}</span>
            {props.version != null && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
                backgroundColor: '#1e1e2e', padding: '2px 8px', borderRadius: 99,
              }}>v{props.version}</span>
            )}
          </div>

          {/* Sub-header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#00d4ff' }}>
              For: {props.event_name}
            </span>
            {props.event_date && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>
                {props.event_date}
              </span>
            )}
            {props.deadline && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#f59e0b' }}>
                Due: {props.deadline}
              </span>
            )}
            {props.priority && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: pColor, backgroundColor: `${pColor}1a`,
                padding: '3px 10px', borderRadius: 99,
              }}>{props.priority}</span>
            )}
            {props.ai_confidence != null && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: confColor,
                backgroundColor: `${confColor}1a`, padding: '3px 10px', borderRadius: 99,
              }}>{props.ai_confidence}% confidence</span>
            )}
          </div>

          {/* Content angle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#ffffff', fontStyle: 'italic',
              borderLeft: '3px solid #00d4ff', paddingLeft: 12,
            }}>{props.content_angle}</div>
          </div>

          {/* Talking points */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
            }}>Talking Points</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {props.talking_points.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00d4ff',
                    minWidth: 18, textAlign: 'right',
                  }}>{i + 1}.</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#e5e7eb' }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {props.content_format && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e5e7eb',
                backgroundColor: '#1e1e2e', padding: '3px 10px', borderRadius: 99,
              }}>{props.content_format}</span>
            )}
            {props.tone && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>
                {props.tone}
              </span>
            )}
            {props.hashtags && props.hashtags.length > 0 && props.hashtags.map((tag, i) => (
              <span key={i} style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.1)',
                padding: '2px 8px', borderRadius: 99,
              }}>#{tag.replace(/^#/, '')}</span>
            ))}
          </div>

          {/* Assigned creators */}
          {props.assigned_creators && props.assigned_creators.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
              }}>Assigned Creators</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {props.assigned_creators.map((c, i) => {
                  const sColor = creatorStatusColors[c.status ?? 'pending'] ?? '#6b7280';
                  const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', backgroundColor: `${sColor}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: sColor,
                        }}>{initials}</div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff' }}>{c.name}</span>
                        {c.niche && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
                            backgroundColor: '#1e1e2e', padding: '2px 8px', borderRadius: 99,
                          }}>{c.niche}</span>
                        )}
                        {c.status && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: sColor,
                            backgroundColor: `${sColor}1a`, padding: '2px 8px', borderRadius: 99,
                          }}>{c.status.replace('_', ' ')}</span>
                        )}
                      </div>
                      {c.personalized_angle && (
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280',
                          fontStyle: 'italic', marginTop: 2, marginLeft: 38,
                        }}>{c.personalized_angle}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Editor notes */}
          {props.editor_notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#f59e0b', marginBottom: 6,
              }}>Agency Notes</div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb',
                backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: 12, borderRadius: 8,
              }}>{props.editor_notes}</div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trendzo-action', {
                    detail: { action: 'approve_brief', params: { brief_title: props.brief_title, event_name: props.event_name } },
                  }));
                }
              }}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                color: '#ffffff', backgroundColor: '#2dd4a8', border: 'none',
                padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              }}
            >Approve</button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trendzo-chat', {
                    detail: { message: `I'd like to change something about the ${props.brief_title} brief` },
                  }));
                }
              }}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                color: '#f59e0b', backgroundColor: 'transparent', border: '1px solid #f59e0b',
                padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              }}
            >Request Changes</button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trendzo-chat', {
                    detail: { message: 'Skip this brief and show the next one' },
                  }));
                }
              }}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                color: '#6b7280', backgroundColor: 'transparent', border: '1px solid #6b7280',
                padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              }}
            >Skip</button>
          </div>
        </div>
      );
    },

    BatchProgress: ({ props }) => {
      const total = props.total || 1;
      const remaining = total - props.generated - props.in_review - props.approved - props.sent;
      const isComplete = props.progress_percent === 100;
      const progressColor = props.progress_percent >= 80 ? '#2dd4a8' : props.progress_percent >= 40 ? '#f59e0b' : '#7c3aed';

      const segments = [
        { value: props.approved, color: '#2dd4a8' },
        { value: props.in_review, color: '#f59e0b' },
        { value: props.generated, color: '#00d4ff' },
        { value: Math.max(0, remaining), color: '#1e1e2e' },
      ];

      const stats = [
        { count: props.generated, label: 'Generated', color: '#00d4ff' },
        { count: props.in_review, label: 'In Review', color: '#f59e0b' },
        { count: props.approved, label: 'Approved', color: '#2dd4a8' },
        { count: props.sent, label: 'Sent', color: '#7c3aed' },
      ];

      return (
        <div style={{
          background: '#0f0f16',
          border: isComplete ? '1px solid #2dd4a8' : '1px solid #1e1e2e',
          borderRadius: 16, padding: 24,
          boxShadow: isComplete ? '0 0 20px rgba(45, 212, 168, 0.1)' : 'none',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#ffffff',
              }}>{props.batch_name}</span>
              {isComplete && (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#2dd4a8',
                  backgroundColor: 'rgba(45, 212, 168, 0.1)', padding: '3px 10px', borderRadius: 99,
                }}>✓ Batch Complete</span>
              )}
            </div>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: progressColor,
            }}>{props.progress_percent}%</span>
          </div>

          {/* Segmented bar */}
          <div style={{
            display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16,
          }}>
            {segments.map((seg, i) => {
              const pct = (seg.value / total) * 100;
              if (pct <= 0) return null;
              return (
                <div key={i} style={{
                  width: `${pct}%`, backgroundColor: seg.color, height: '100%',
                  borderRight: i < segments.length - 1 && pct > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                }} />
              );
            })}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: s.color,
                }}>{s.count}</div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#6b7280', marginTop: 2,
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Timing */}
          {(props.started_at || props.estimated_completion) && (
            <div style={{
              display: 'flex', gap: 16, fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: '#6b7280', marginBottom: props.errors && props.errors.length > 0 ? 16 : 0,
            }}>
              {props.started_at && <span>Started: {props.started_at}</span>}
              {props.estimated_completion && <span>ETA: {props.estimated_completion}</span>}
            </div>
          )}

          {/* Errors */}
          {props.errors && props.errors.length > 0 && (
            <div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#e63946', marginBottom: 6,
              }}>Issues</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {props.errors.map((err, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', backgroundColor: '#e63946', flexShrink: 0,
                    }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#ffffff' }}>
                      {err.brief_title}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>
                      — {err.error}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    },

    CreatorBriefAssignment: ({ props }) => {
      const cellStatusColors: Record<string, string> = {
        assigned: '#7c3aed', in_progress: '#f59e0b', submitted: '#00d4ff',
        published: '#2dd4a8', not_assigned: 'transparent',
      };
      const cellStatusBorders: Record<string, string> = {
        not_assigned: '#3f3f5e',
      };
      const [hoveredCell, setHoveredCell] = React.useState<string | null>(null);

      const getAssignment = (creatorName: string, eventName: string) => {
        return props.assignments.find(a => a.creator_name === creatorName && a.event_name === eventName);
      };

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#ffffff',
            }}>Assignment Matrix</span>
            {props.workload_warning && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#f59e0b',
              }}>⚠ {props.workload_warning}</span>
            )}
          </div>

          {/* Scrollable table */}
          <div style={{ overflow: 'auto', maxHeight: 400 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{
                    position: 'sticky', left: 0, zIndex: 2, background: '#08080d',
                    padding: '8px 12px', borderBottom: '1px solid #1e1e2e', borderRight: '1px solid #1e1e2e',
                    textAlign: 'left', minWidth: 180,
                  }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.05em', color: '#6b7280',
                    }}>Creator</span>
                  </th>
                  {props.events.map((ev, i) => (
                    <th key={i} style={{
                      padding: '8px 12px', borderBottom: '1px solid #1e1e2e',
                      background: '#08080d', textAlign: 'center', minWidth: 80,
                    }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100,
                      }} title={ev.event_name}>{ev.event_name}</div>
                      {ev.deadline && (
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#4a4858', marginTop: 2,
                        }}>{ev.deadline}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {props.creators.map((creator, ci) => (
                  <tr key={ci}>
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 1, background: '#0f0f16',
                      padding: '8px 12px', borderBottom: '1px solid #1e1e2e', borderRight: '1px solid #1e1e2e',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff' }}>
                          {creator.name}
                        </span>
                        {creator.niche && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#6b7280',
                            backgroundColor: '#1e1e2e', padding: '1px 6px', borderRadius: 99,
                          }}>{creator.niche}</span>
                        )}
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280', marginTop: 2,
                      }}>{creator.total_completed}/{creator.total_assigned}</div>
                    </td>
                    {props.events.map((ev, ei) => {
                      const assignment = getAssignment(creator.name, ev.event_name);
                      const status = assignment?.status ?? 'not_assigned';
                      const dotColor = cellStatusColors[status] ?? 'transparent';
                      const dotBorder = cellStatusBorders[status];
                      const cellKey = `${ci}-${ei}`;

                      return (
                        <td key={ei} style={{
                          padding: '8px 12px', borderBottom: '1px solid #1e1e2e',
                          textAlign: 'center',
                        }}>
                          <div
                            style={{
                              width: 12, height: 12, borderRadius: '50%', margin: '0 auto',
                              backgroundColor: dotColor,
                              border: dotBorder ? `1px solid ${dotBorder}` : 'none',
                              cursor: 'pointer', position: 'relative',
                            }}
                            onMouseEnter={() => setHoveredCell(cellKey)}
                            onMouseLeave={() => setHoveredCell(null)}
                            title={status.replace('_', ' ')}
                          />
                          {hoveredCell === cellKey && status !== 'not_assigned' && (
                            <div style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                              color: dotColor, marginTop: 2,
                            }}>{status.replace('_', ' ')}</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid #1e1e2e',
          }}>
            {[
              { label: 'Assigned', color: '#7c3aed' },
              { label: 'In Progress', color: '#f59e0b' },
              { label: 'Submitted', color: '#00d4ff' },
              { label: 'Published', color: '#2dd4a8' },
              { label: 'Not Assigned', color: 'transparent', border: '#3f3f5e' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color,
                  border: item.border ? `1px solid ${item.border}` : 'none',
                }} />
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6b7280',
                }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    },

    BatchSummary: ({ props }) => {
      const confColor = (props.avg_ai_confidence ?? 0) >= 80 ? '#2dd4a8' : (props.avg_ai_confidence ?? 0) >= 60 ? '#f59e0b' : '#e63946';

      const priorityColors: Record<string, string> = {
        urgent: '#e63946', high: '#f59e0b', normal: '#7c3aed', low: '#2dd4a8',
      };

      const prioBreakdown = props.priority_breakdown;
      const prioTotal = prioBreakdown
        ? (prioBreakdown.urgent + prioBreakdown.high + prioBreakdown.normal + prioBreakdown.low) || 1
        : 0;

      const stats = [
        { value: props.total_briefs_generated, label: 'Briefs Generated', color: '#00d4ff' },
        { value: props.total_creators_covered, label: 'Creators Covered', color: '#2dd4a8' },
        { value: props.total_events_covered, label: 'Events Covered', color: '#7c3aed' },
      ];

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
          borderTop: '3px solid #2dd4a8',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#ffffff',
            }}>{props.batch_name}</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#2dd4a8',
              backgroundColor: 'rgba(45, 212, 168, 0.1)', padding: '3px 10px', borderRadius: 99,
            }}>✓ Complete</span>
          </div>

          {/* Stat blocks */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: s.color,
                }}>{s.value}</div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#6b7280', marginTop: 4,
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Priority breakdown */}
          {prioBreakdown && prioTotal > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
              }}>Priority Breakdown</div>
              <div style={{
                display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8,
              }}>
                {(['urgent', 'high', 'normal', 'low'] as const).map((level, i) => {
                  const pct = (prioBreakdown[level] / prioTotal) * 100;
                  if (pct <= 0) return null;
                  return (
                    <div key={level} style={{
                      width: `${pct}%`, height: '100%', backgroundColor: priorityColors[level],
                      borderRight: i < 3 && pct > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                    }} />
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {(['urgent', 'high', 'normal', 'low'] as const).map((level) => (
                  prioBreakdown[level] > 0 ? (
                    <span key={level} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: priorityColors[level],
                    }}>{level}: {prioBreakdown[level]}</span>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* AI confidence */}
          {props.avg_ai_confidence != null && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: confColor, marginBottom: 20,
            }}>Avg Confidence: {props.avg_ai_confidence}%</div>
          )}

          {/* Coverage gaps */}
          {props.coverage_gaps && props.coverage_gaps.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#f59e0b', marginBottom: 8,
              }}>Coverage Gaps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {props.coverage_gaps.map((gap, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff' }}>
                      {gap.event_name}
                    </span>
                    {gap.missing_niches.map((niche, ni) => (
                      <span key={ni} style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#e63946',
                        backgroundColor: 'rgba(230, 57, 70, 0.1)', padding: '2px 8px', borderRadius: 99,
                      }}>{niche}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next steps */}
          {props.next_steps && props.next_steps.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
              }}>Recommended Next Steps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {props.next_steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00d4ff',
                      minWidth: 18, textAlign: 'right',
                    }}>{i + 1}.</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Push All button */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('trendzo-action', {
                  detail: { action: 'generate_batch_briefs', params: { scope: 'all_upcoming' } },
                }));
                window.dispatchEvent(new CustomEvent('trendzo-chat', {
                  detail: { message: 'Push all approved briefs to creators' },
                }));
              }
            }}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              color: '#ffffff', backgroundColor: '#2dd4a8', border: 'none',
              padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
            }}
          >Push All Approved</button>
        </div>
      );
    },

    // ── CONTENT CALENDAR ─────────────────────────────────────────────────

    CalendarView: ({ props }) => {
      const typeColors: Record<string, string> = {
        post: '#00d4ff', event: '#7c3aed', brief_deadline: '#f59e0b',
        milestone: '#2dd4a8', reminder: '#6b7280',
      };
      const postStatusColors: Record<string, string> = {
        scheduled: '#00d4ff', draft: '#6b7280', published: '#2dd4a8', overdue: '#e63946', cancelled: '#6b7280',
      };

      const today = new Date().toISOString().slice(0, 10);
      const focal = props.current_date?.slice(0, 10) ?? today;

      const formatDate = (d: string) => {
        try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
        catch { return d; }
      };

      const viewModes: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month'];

      // Helper: get Monday of a week
      const getMonday = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d;
      };

      // Helper: generate calendar days for month view
      const getMonthDays = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
        const days: string[] = [];
        for (let i = -startOffset; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)) - 1; i++) {
          const dd = new Date(year, month, i + 1);
          days.push(dd.toISOString().slice(0, 10));
        }
        return days;
      };

      // Helper: get week days
      const getWeekDays = (dateStr: string) => {
        const mon = getMonday(dateStr);
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(mon);
          d.setDate(mon.getDate() + i);
          return d.toISOString().slice(0, 10);
        });
      };

      const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

      const renderPill = (item: typeof props.items[number], compact: boolean) => {
        const tColor = typeColors[item.type] ?? '#6b7280';
        const sColor = item.status ? (postStatusColors[item.status] ?? '#6b7280') : undefined;
        return (
          <div key={item.id ?? item.title + item.date} style={{
            display: 'flex', alignItems: 'center', gap: compact ? 4 : 8,
            borderLeft: `${compact ? 3 : 4}px solid ${tColor}`,
            background: '#08080d', borderRadius: 4,
            padding: compact ? '2px 6px' : '6px 10px',
            ...(item.status === 'cancelled' ? { textDecoration: 'line-through', opacity: 0.5 } : {}),
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: compact ? 10 : 12,
              color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: compact ? 80 : 200,
            }}>{item.title}</span>
            {sColor && <span style={{
              width: compact ? 4 : 6, height: compact ? 4 : 6, borderRadius: '50%',
              backgroundColor: sColor, flexShrink: 0,
            }} />}
            {!compact && item.creator_name && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280' }}>
                {item.creator_name}
              </span>
            )}
            {!compact && item.time && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#ffffff' }}>
                {item.time}
              </span>
            )}
          </div>
        );
      };

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#ffffff' }}>
                Content Calendar
              </span>
              {props.has_conflicts && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e63946', display: 'inline-block',
                }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {viewModes.map((m) => (
                <span key={m} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '4px 12px', borderRadius: 99,
                  color: m === props.view_mode ? '#00d4ff' : '#6b7280',
                  backgroundColor: m === props.view_mode ? 'rgba(0,212,255,0.15)' : 'transparent',
                  cursor: 'default', textTransform: 'capitalize',
                }}>{m}</span>
              ))}
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#6b7280', marginLeft: 'auto' }}>
              {formatDate(focal)}
            </span>
          </div>

          {/* Month view */}
          {props.view_mode === 'month' && (() => {
            const days = getMonthDays(focal);
            const focalMonth = new Date(focal + 'T00:00:00').getMonth();
            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                  {dayNames.map((dn) => (
                    <div key={dn} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
                      textTransform: 'uppercase', textAlign: 'center', padding: '4px 0 8px',
                    }}>{dn}</div>
                  ))}
                  {days.map((dayStr) => {
                    const isToday = dayStr === today;
                    const dayDate = new Date(dayStr + 'T00:00:00');
                    const isCurrentMonth = dayDate.getMonth() === focalMonth;
                    const isPast = dayStr < today;
                    const dayItems = props.items.filter((it) => it.date?.slice(0, 10) === dayStr);
                    const visible = dayItems.slice(0, 3);
                    const overflow = dayItems.length - 3;
                    return (
                      <div key={dayStr} style={{
                        minHeight: 80, border: '1px solid #1e1e2e', padding: 4,
                        borderLeft: isToday ? '3px solid #00d4ff' : '1px solid #1e1e2e',
                        opacity: isPast && !isToday ? 0.4 : isCurrentMonth ? 1 : 0.3,
                      }}>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                          color: isToday ? '#ffffff' : '#6b7280', marginBottom: 4,
                        }}>{dayDate.getDate()}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {visible.map((it) => renderPill(it, true))}
                          {overflow > 0 && (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#6b7280' }}>
                              +{overflow} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Week view */}
          {props.view_mode === 'week' && (() => {
            const weekDays = getWeekDays(focal);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                {weekDays.map((dayStr, i) => {
                  const isToday = dayStr === today;
                  const dayItems = props.items.filter((it) => it.date?.slice(0, 10) === dayStr);
                  const d = new Date(dayStr + 'T00:00:00');
                  return (
                    <div key={dayStr} style={{
                      border: '1px solid #1e1e2e', padding: 8, minHeight: 120,
                      borderTop: isToday ? '3px solid #00d4ff' : '1px solid #1e1e2e',
                    }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginBottom: 8,
                        color: isToday ? '#00d4ff' : '#6b7280',
                      }}>
                        {dayNames[i]} {d.getDate()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {dayItems.map((it) => renderPill(it, false))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Day view */}
          {props.view_mode === 'day' && (() => {
            const dayItems = props.items
              .filter((it) => it.date?.slice(0, 10) === focal)
              .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
            const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6AM-9PM
            return (
              <div style={{ position: 'relative', paddingLeft: 60 }}>
                {/* Timeline */}
                <div style={{
                  position: 'absolute', left: 28, top: 0, bottom: 0, width: 1,
                  backgroundColor: '#1e1e2e',
                }} />
                {hours.map((h) => (
                  <div key={h} style={{
                    position: 'relative', minHeight: 32,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
                  }}>
                    <span style={{ position: 'absolute', left: -52, top: 0 }}>
                      {h.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
                {/* Items overlaid */}
                <div style={{ position: 'absolute', left: 60, top: 0, right: 0 }}>
                  {dayItems.map((it) => {
                    const tColor = typeColors[it.type] ?? '#6b7280';
                    const sColor = it.status ? (postStatusColors[it.status] ?? '#6b7280') : undefined;
                    return (
                      <div key={it.id ?? it.title} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        borderLeft: `4px solid ${tColor}`, background: '#08080d',
                        borderRadius: 6, padding: '10px 14px', marginBottom: 6,
                      }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#ffffff' }}>
                            {it.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {it.creator_name && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00d4ff' }}>
                                {it.creator_name}
                              </span>
                            )}
                            {it.time && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#ffffff' }}>
                                {it.time}
                              </span>
                            )}
                            {it.niche && (
                              <span style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                                color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)',
                                padding: '2px 8px', borderRadius: 99,
                              }}>{it.niche}</span>
                            )}
                          </div>
                        </div>
                        {sColor && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                            color: sColor, backgroundColor: `${sColor}1a`,
                            padding: '2px 8px', borderRadius: 99,
                          }}>{it.status}</span>
                        )}
                      </div>
                    );
                  })}
                  {dayItems.length === 0 && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280', padding: 16 }}>
                      No items scheduled for this day
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Total items */}
          {props.total_items != null && (
            <div style={{
              textAlign: 'right', marginTop: 12,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280',
            }}>{props.total_items} total items</div>
          )}
        </div>
      );
    },

    ScheduleGrid: ({ props }) => {
      const typeColors: Record<string, string> = {
        post: '#00d4ff', brief_deadline: '#f59e0b', event: '#7c3aed',
      };
      const postStatusColors: Record<string, string> = {
        scheduled: '#00d4ff', draft: '#6b7280', published: '#2dd4a8', overdue: '#e63946',
      };
      const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const today = new Date().toISOString().slice(0, 10);

      // Compute actual dates for each column
      const getDates = () => {
        try {
          const mon = new Date(props.week_start + 'T00:00:00');
          return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(mon);
            d.setDate(mon.getDate() + i);
            return d.toISOString().slice(0, 10);
          });
        } catch { return []; }
      };
      const dates = getDates();

      const formatWeek = (d: string) => {
        try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
        catch { return d; }
      };

      // Conflict set for highlighting cells
      const conflictDays = new Set(props.conflicts?.map((c) => c.day) ?? []);

      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
              Weekly Schedule
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>
              Week of {formatWeek(props.week_start)}
            </span>
          </div>

          {/* Grid */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#08080d' }}>
                  <th style={{
                    position: 'sticky', left: 0, zIndex: 2, width: 140, backgroundColor: '#08080d',
                    border: '1px solid #1e1e2e', padding: '8px 12px', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>Creator</th>
                  {dayNames.map((dn, i) => {
                    const dateStr = dates[i] ?? '';
                    const isToday = dateStr === today;
                    const dayNum = dateStr ? new Date(dateStr + 'T00:00:00').getDate() : '';
                    return (
                      <th key={dn} style={{
                        border: '1px solid #1e1e2e', padding: '8px 6px', textAlign: 'center',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: isToday ? '#00d4ff' : '#6b7280',
                        backgroundColor: isToday ? 'rgba(0,212,255,0.03)' : '#08080d',
                      }}>{dn} {dayNum}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {props.creators.map((creator) => (
                  <tr key={creator.name}>
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#0f0f16',
                      border: '1px solid #1e1e2e', padding: '8px 12px', width: 140, verticalAlign: 'top',
                    }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff' }}>
                        {creator.name}
                      </div>
                      {creator.niche && (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#7c3aed',
                          backgroundColor: 'rgba(124,58,237,0.1)', padding: '1px 6px', borderRadius: 99,
                        }}>{creator.niche}</span>
                      )}
                    </td>
                    {dayKeys.map((dk, i) => {
                      const sched = creator.schedule.find((s) => s.day === dk);
                      const items = sched?.items ?? [];
                      const dateStr = dates[i] ?? '';
                      const isToday = dateStr === today;
                      const hasConflict = conflictDays.has(dk) || conflictDays.has(dateStr);
                      return (
                        <td key={dk} style={{
                          border: '1px solid #1e1e2e', padding: 6, verticalAlign: 'top', minWidth: 90,
                          backgroundColor: hasConflict ? 'rgba(230,57,70,0.08)' : isToday ? 'rgba(0,212,255,0.03)' : 'transparent',
                        }}>
                          {items.length === 0 ? (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#2a2a3e' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {items.map((it, j) => {
                                const tColor = typeColors[it.type] ?? '#6b7280';
                                const sColor = it.status ? (postStatusColors[it.status] ?? '#6b7280') : undefined;
                                return (
                                  <div key={j} style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    borderLeft: sColor ? `2px solid ${sColor}` : undefined,
                                    paddingLeft: sColor ? 4 : 0,
                                  }}>
                                    <span style={{
                                      width: 6, height: 6, borderRadius: '50%', backgroundColor: tColor, flexShrink: 0,
                                    }} />
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{
                                        fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#e5e7eb',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80,
                                      }}>{it.title}</div>
                                      {it.time && (
                                        <div style={{
                                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#6b7280',
                                        }}>{it.time}</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Conflicts */}
          {props.conflicts && props.conflicts.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {props.conflicts.map((c, i) => (
                <div key={i} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#e63946',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#e63946' }} />
                  <span style={{ color: '#6b7280' }}>{c.day}:</span> {c.description}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[['Post', '#00d4ff'], ['Event', '#7c3aed'], ['Brief Deadline', '#f59e0b']].map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6b7280' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    },

    PostSlot: ({ props }) => {
      const postStatusColors: Record<string, string> = {
        scheduled: '#00d4ff', draft: '#6b7280', in_production: '#f59e0b',
        ready: '#2dd4a8', published: '#2dd4a8', overdue: '#e63946', cancelled: '#6b7280',
      };

      // Determine left border color based on references
      const borderColor = props.event_reference ? '#7c3aed' : props.brief_reference ? '#f59e0b' : '#00d4ff';
      const sColor = props.status ? (postStatusColors[props.status] ?? '#6b7280') : undefined;

      const bgTint = props.status === 'overdue' ? 'rgba(230,57,70,0.05)'
        : props.status === 'published' ? 'rgba(45,212,168,0.05)' : undefined;

      const formatDate = (d: string) => {
        try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
        catch { return d; }
      };

      const formatReach = (n: number) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return n.toString();
      };

      return (
        <div style={{
          background: bgTint ? `linear-gradient(135deg, ${bgTint}, #0f0f16)` : '#0f0f16',
          border: '1px solid #1e1e2e', borderRadius: 16, padding: 16,
          borderLeft: `4px solid ${borderColor}`,
          ...(props.status === 'cancelled' ? { opacity: 0.6 } : {}),
        }}>
          {/* Row 1: title + status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#ffffff',
              ...(props.status === 'cancelled' ? { textDecoration: 'line-through' } : {}),
            }}>{props.title}</span>
            {sColor && props.status && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: sColor, backgroundColor: `${sColor}1a`,
                padding: '2px 8px', borderRadius: 99,
                fontWeight: props.status === 'published' ? 700 : 400,
              }}>{props.status.replace('_', ' ')}</span>
            )}
          </div>

          {/* Row 2: creator + niche + format */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#00d4ff' }}>
              {props.creator_name}
            </span>
            {props.niche && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#7c3aed',
                backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 99,
              }}>{props.niche}</span>
            )}
            {props.content_format && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6b7280',
                backgroundColor: 'rgba(107,114,128,0.15)', padding: '2px 8px', borderRadius: 99,
              }}>{props.content_format}</span>
            )}
          </div>

          {/* Row 3: date + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>
              {formatDate(props.scheduled_date)}
            </span>
            {props.scheduled_time && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#ffffff' }}>
                {props.scheduled_time}
              </span>
            )}
          </div>

          {/* References */}
          {(props.brief_reference || props.event_reference) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {props.brief_reference && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#f59e0b' }}>
                  Brief: {props.brief_reference}
                </span>
              )}
              {props.event_reference && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7c3aed' }}>
                  Event: {props.event_reference}
                </span>
              )}
            </div>
          )}

          {/* Notes */}
          {props.notes && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280',
              fontStyle: 'italic', marginBottom: 8,
            }}>{props.notes}</div>
          )}

          {/* Estimated reach */}
          {props.estimated_reach != null && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2dd4a8' }}>
              Est. Reach: {formatReach(props.estimated_reach)}
            </div>
          )}
        </div>
      );
    },

    WeekOverview: ({ props }) => {
      return (
        <div style={{
          background: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#ffffff',
            marginBottom: 16,
          }}>{props.week_label}</div>

          {/* Main stat */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: '#00d4ff' }}>
              {props.total_scheduled}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>
              posts scheduled
            </span>
          </div>

          {/* Status breakdown */}
          {props.by_status && (
            <div style={{
              display: 'flex', gap: 0, marginBottom: 20,
              border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden',
            }}>
              {([
                ['scheduled', '#00d4ff', props.by_status.scheduled],
                ['draft', '#6b7280', props.by_status.draft],
                ['published', '#2dd4a8', props.by_status.published],
                ['overdue', '#e63946', props.by_status.overdue],
              ] as [string, string, number][]).map(([label, color, count], i) => (
                <div key={label} style={{
                  flex: 1, padding: '12px 16px', textAlign: 'center',
                  borderRight: i < 3 ? '1px solid #1e1e2e' : undefined,
                }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color }}>
                    {count}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6b7280',
                    textTransform: 'uppercase',
                  }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* By creator */}
          {props.by_creator && props.by_creator.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[...props.by_creator].sort((a, b) => b.post_count - a.post_count).map((c) => (
                <div key={c.name} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#08080d', border: '1px solid #1e1e2e',
                  padding: '4px 10px', borderRadius: 99,
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#e5e7eb' }}>
                    {c.name}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                    color: '#ffffff', backgroundColor: '#00d4ff', borderRadius: '50%',
                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{c.post_count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Busiest day + gaps */}
          <div style={{ display: 'flex', gap: 20, marginBottom: props.upcoming_events?.length ? 16 : 0 }}>
            {props.busiest_day && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#f59e0b' }}>
                Busiest: {props.busiest_day}
              </span>
            )}
            {props.gap_days && props.gap_days.length > 0 && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#e63946' }}>
                Gaps: {props.gap_days.join(', ')}
              </span>
            )}
          </div>

          {/* Upcoming events */}
          {props.upcoming_events && props.upcoming_events.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>
                Events this week:
              </span>
              {props.upcoming_events.map((ev) => (
                <span key={ev.event_name} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#7c3aed',
                  backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 99,
                }}>
                  {ev.event_name} · {ev.event_date}
                </span>
              ))}
            </div>
          )}

          {/* Empty state */}
          {props.total_scheduled === 0 && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280',
              textAlign: 'center', padding: '20px 0',
            }}>No content scheduled this week — time to plan!</div>
          )}
        </div>
      );
    },

    ScheduleConflict: ({ props }) => {
      const severityConfig: Record<string, { color: string; bg: string; icon: string }> = {
        critical: { color: '#e63946', bg: 'rgba(230,57,70,0.08)', icon: '🔴' },
        warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', icon: '⚠️' },
        info: { color: '#00d4ff', bg: 'rgba(0,212,255,0.03)', icon: 'ℹ️' },
      };
      const config = severityConfig[props.severity] ?? severityConfig.info;

      return (
        <div style={{
          background: config.bg, borderLeft: `4px solid ${config.color}`,
          borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{config.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Type label */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase',
              color: config.color, letterSpacing: '0.05em', marginBottom: 4,
            }}>{props.conflict_type.replace(/_/g, ' ')}</div>

            {/* Description */}
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff', marginBottom: 6,
            }}>{props.description}</div>

            {/* Affected creators */}
            {props.affected_creators && props.affected_creators.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                {props.affected_creators.map((name) => (
                  <span key={name} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#e5e7eb',
                    backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 99,
                  }}>{name}</span>
                ))}
              </div>
            )}

            {/* Affected date */}
            {props.affected_date && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280', marginBottom: 6,
              }}>{props.affected_date}</div>
            )}

            {/* Suggestion */}
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#00d4ff', fontStyle: 'italic',
            }}>{props.suggestion}</div>
          </div>
        </div>
      );
    },

    // ── PERFORMANCE REPORTING ─────────────────────────────────────────────

    PerformanceChart: ({ props }) => {
      const seriesColors = ['#00d4ff', '#7c3aed', '#f59e0b', '#2dd4a8', '#e63946'];
      const xVals = props.x_axis.values;
      const series = props.series;

      if (!xVals.length || !series.length) {
        return (
          <div style={{
            backgroundColor: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
          }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#ffffff', marginBottom: 8 }}>
              {props.title}
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280', textAlign: 'center', padding: '60px 0',
            }}>No data available</div>
          </div>
        );
      }

      const svgW = 600;
      const svgH = 200;
      const padL = 40;
      const padR = 16;
      const padT = 16;
      const padB = 36;
      const chartW = svgW - padL - padR;
      const chartH = svgH - padT - padB;

      const allVals = series.flatMap((s) => s.values);
      const dataMax = props.y_axis_max ?? Math.max(...allVals, 1);
      const dataMin = Math.min(0, ...allVals);
      const range = dataMax - dataMin || 1;

      const toX = (i: number) => padL + (xVals.length > 1 ? (i / (xVals.length - 1)) * chartW : chartW / 2);
      const toY = (v: number) => padT + chartH - ((v - dataMin) / range) * chartH;

      // Gridlines
      const gridCount = 4;
      const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
        const v = dataMin + (range / gridCount) * i;
        return { y: toY(v), label: Math.round(v).toString() };
      });

      const rotateLabels = xVals.length > 7;

      const renderLine = () => (
        <>
          {series.map((s, si) => {
            const color = s.color ?? seriesColors[si % seriesColors.length];
            const points = xVals.map((_, xi) => `${toX(xi)},${toY(s.values[xi] ?? 0)}`).join(' ');
            const fillPoints = `${toX(0)},${toY(dataMin)} ${points} ${toX(xVals.length - 1)},${toY(dataMin)}`;
            const maxIdx = props.highlight_max ? s.values.indexOf(Math.max(...s.values)) : -1;
            return (
              <g key={si}>
                <polygon points={fillPoints} fill={color} opacity={0.08} />
                <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
                {xVals.map((_, xi) => (
                  <circle key={xi} cx={toX(xi)} cy={toY(s.values[xi] ?? 0)} r={xi === maxIdx ? 5 : 3}
                    fill={color} stroke={xi === maxIdx ? color : 'none'} strokeWidth={xi === maxIdx ? 3 : 0}
                    opacity={xi === maxIdx ? 1 : 0.9} />
                ))}
                {maxIdx >= 0 && (
                  <circle cx={toX(maxIdx)} cy={toY(s.values[maxIdx])} r={8} fill={color} opacity={0.3} />
                )}
              </g>
            );
          })}
        </>
      );

      const renderArea = () => (
        <>
          {series.map((s, si) => {
            const color = s.color ?? seriesColors[si % seriesColors.length];
            const points = xVals.map((_, xi) => `${toX(xi)},${toY(s.values[xi] ?? 0)}`).join(' ');
            const fillPoints = `${toX(0)},${toY(dataMin)} ${points} ${toX(xVals.length - 1)},${toY(dataMin)}`;
            return (
              <g key={si}>
                <polygon points={fillPoints} fill={color} opacity={0.15} />
                <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
              </g>
            );
          })}
        </>
      );

      const renderBar = () => {
        const groupW = chartW / xVals.length;
        const barW = Math.max(4, (groupW - 8) / series.length - 4);
        return (
          <>
            {xVals.map((_, xi) =>
              series.map((s, si) => {
                const color = s.color ?? seriesColors[si % seriesColors.length];
                const val = s.values[xi] ?? 0;
                const x = padL + xi * groupW + si * (barW + 4) + 4;
                const y = toY(val);
                const h = toY(dataMin) - y;
                return <rect key={`${xi}-${si}`} x={x} y={y} width={barW} height={Math.max(0, h)} fill={color} rx={3} />;
              }),
            )}
          </>
        );
      };

      const renderStackedBar = () => {
        const groupW = chartW / xVals.length;
        const barW = Math.max(8, groupW - 8);
        return (
          <>
            {xVals.map((_, xi) => {
              let cumY = toY(dataMin);
              return series.map((s, si) => {
                const color = s.color ?? seriesColors[si % seriesColors.length];
                const val = s.values[xi] ?? 0;
                const h = (val / range) * chartH;
                cumY -= h;
                return <rect key={`${xi}-${si}`} x={padL + xi * groupW + 4} y={cumY} width={barW} height={Math.max(0, h)} fill={color} rx={si === series.length - 1 ? 3 : 0} />;
              });
            })}
          </>
        );
      };

      const showLegend = props.show_legend || series.length > 1;

      return (
        <div style={{
          backgroundColor: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#ffffff' }}>{props.title}</div>
            {props.period && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280' }}>{props.period}</div>
            )}
          </div>

          {/* SVG Chart */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 200, overflow: 'visible' }}>
            {/* Gridlines */}
            {gridLines.map((g, i) => (
              <g key={i}>
                <line x1={padL} y1={g.y} x2={svgW - padR} y2={g.y} stroke="#1e1e2e" strokeDasharray="4,4" />
                <text x={padL - 6} y={g.y + 3} textAnchor="end" fill="#6b7280"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>{g.label}</text>
              </g>
            ))}
            {/* Y-axis label */}
            {props.y_axis_label && (
              <text x={10} y={svgH / 2} textAnchor="middle" fill="#6b7280"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}
                transform={`rotate(-90, 10, ${svgH / 2})`}>{props.y_axis_label}</text>
            )}
            {/* Data */}
            {props.chart_type === 'bar' ? renderBar()
              : props.chart_type === 'stacked_bar' ? renderStackedBar()
              : props.chart_type === 'area' ? renderArea()
              : renderLine()}
            {/* X-axis labels */}
            {xVals.map((label, i) => (
              <text key={i} x={props.chart_type === 'bar' || props.chart_type === 'stacked_bar'
                ? padL + (chartW / xVals.length) * i + (chartW / xVals.length) / 2
                : toX(i)}
                y={svgH - 4} textAnchor={rotateLabels ? 'end' : 'middle'} fill="#6b7280"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
                transform={rotateLabels ? `rotate(-30, ${toX(i)}, ${svgH - 4})` : undefined}>{label}</text>
            ))}
          </svg>

          {/* Legend */}
          {showLegend && (
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {series.map((s, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: s.color ?? seriesColors[si % seriesColors.length], display: 'inline-block',
                  }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#e5e7eb' }}>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    },

    ReportCard: ({ props }) => {
      const trendColor = props.trend === 'up' ? '#2dd4a8' : props.trend === 'down' ? '#e63946' : '#f59e0b';
      const trendArrow = props.trend === 'up' ? '▲' : props.trend === 'down' ? '▼' : '→';

      const formatValue = (val: number) => {
        switch (props.unit) {
          case 'percent': return `${val}%`;
          case 'score': return `${val}/100`;
          case 'views': return val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M` : val >= 1_000 ? `${(val / 1_000).toFixed(1)}K` : `${val}`;
          case 'currency': return `$${val.toLocaleString()}`;
          default: return val.toLocaleString();
        }
      };

      const unitSuffix = props.unit === 'percent' ? '%' : props.unit === 'score' ? '/100' : '';

      return (
        <div style={{
          backgroundColor: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 16,
          minWidth: 200, position: 'relative',
        }}>
          {/* Period badge */}
          {props.period && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
              backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 99,
            }}>{props.period}</div>
          )}

          {/* Metric name */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
          }}>{props.metric_name}</div>

          {/* Main value + trend */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#ffffff' }}>
              {props.unit === 'currency' ? '$' : ''}{props.unit === 'views'
                ? formatValue(props.current_value)
                : props.current_value.toLocaleString()}{props.unit !== 'currency' && props.unit !== 'views' ? unitSuffix : ''}
            </span>
            {props.unit && props.unit !== 'number' && props.unit !== 'percent' && props.unit !== 'score' && props.unit !== 'views' && props.unit !== 'currency' && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280' }}>{props.unit}</span>
            )}
            {props.trend && props.change_percent != null && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: trendColor,
              }}>{trendArrow} {props.trend === 'down' ? '' : '+'}{props.change_percent}%</span>
            )}
          </div>

          {/* Previous value */}
          {props.previous_value != null && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280', marginBottom: 8,
            }}>from {formatValue(props.previous_value)}</div>
          )}

          {/* Benchmark line */}
          {props.benchmark != null && (
            <div style={{
              borderTop: '1px dashed #6b7280', margin: '8px 0', paddingTop: 4, position: 'relative',
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6b7280',
              }}>{props.benchmark_label ?? 'Benchmark'}: {formatValue(props.benchmark)}</span>
            </div>
          )}

          {/* Context */}
          {props.context && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280', marginTop: 8,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{props.context}</div>
          )}
        </div>
      );
    },

    AgencyScorecard: ({ props }) => {
      const gradeColor = (g: string) => {
        if (g.startsWith('A')) return '#2dd4a8';
        if (g.startsWith('B')) return '#00d4ff';
        if (g.startsWith('C')) return '#f59e0b';
        return '#e63946';
      };
      const trendInfo = (t?: string) => {
        if (t === 'up') return { arrow: '▲', color: '#2dd4a8' };
        if (t === 'down') return { arrow: '▼', color: '#e63946' };
        return { arrow: '→', color: '#f59e0b' };
      };

      return (
        <div style={{
          backgroundColor: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Top gradient accent */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #2dd4a8, #00d4ff, #7c3aed)' }} />

          <div style={{ padding: 24, position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#ffffff' }}>Agency Performance</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#6b7280', marginTop: 4 }}>{props.period}</div>
              </div>
              {props.overall_grade && (
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 48, color: gradeColor(props.overall_grade),
                  textShadow: `0 0 24px ${gradeColor(props.overall_grade)}40`, lineHeight: 1,
                }}>{props.overall_grade}</div>
              )}
            </div>

            {/* Metrics grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 0, marginBottom: 20,
            }}>
              {props.metrics.map((m, i) => {
                const t = trendInfo(m.trend);
                return (
                  <div key={i} style={{
                    padding: '12px 16px', borderRight: '1px solid #1e1e2e', borderBottom: '1px solid #1e1e2e',
                  }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#ffffff' }}>
                      {m.value.toLocaleString()}{m.unit ? ` ${m.unit}` : ''}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.05em', color: '#6b7280', marginTop: 2,
                    }}>{m.name}</div>
                    {m.trend && m.change_percent != null && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: t.color }}>
                        {t.arrow} {m.change_percent > 0 ? '+' : ''}{m.change_percent}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Top Performer */}
            {props.top_performer && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#f59e0b', marginBottom: 6,
                }}>⭐ Top Performer</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2dd4a8' }}>
                  {props.top_performer.name}: {props.top_performer.value} {props.top_performer.metric}
                </div>
              </div>
            )}

            {/* Needs attention */}
            {props.needs_attention && props.needs_attention.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#e63946', marginBottom: 6,
                }}>⚠ Needs Attention</div>
                {props.needs_attention.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ffffff' }}>{item.creator_name}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>{item.issue}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Highlights */}
            {props.highlights && props.highlights.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#2dd4a8', marginBottom: 6,
                }}>Wins</div>
                {props.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#2dd4a8', fontSize: 13 }}>✓</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{h}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Concerns */}
            {props.concerns && props.concerns.length > 0 && (
              <div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#f59e0b', marginBottom: 6,
                }}>Watch</div>
                {props.concerns.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#f59e0b', fontSize: 13 }}>!</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    },

    CreatorComparison: ({ props }) => {
      const creators = props.creators;
      type MetricKey = 'vps_score' | 'avg_dps' | 'total_views' | 'total_videos' | 'share_rate' | 'save_rate' | 'follower_count';
      const metricDefs: { key: MetricKey; label: string; format: (v: number) => string }[] = [
        { key: 'vps_score', label: 'VPS Score', format: (v) => v.toString() },
        { key: 'avg_dps', label: 'Avg DPS', format: (v) => v.toFixed(1) },
        { key: 'total_views', label: 'Total Views', format: (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : v.toString() },
        { key: 'total_videos', label: 'Total Videos', format: (v) => v.toString() },
        { key: 'share_rate', label: 'Share Rate', format: (v) => `${v.toFixed(1)}%` },
        { key: 'save_rate', label: 'Save Rate', format: (v) => `${v.toFixed(1)}%` },
        { key: 'follower_count', label: 'Followers', format: (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : v.toString() },
      ];
      const gradeKey = 'engagement_grade';
      const trendInfo = (t?: string) => {
        if (t === 'up') return { arrow: '▲', color: '#2dd4a8' };
        if (t === 'down') return { arrow: '▼', color: '#e63946' };
        return { arrow: '→', color: '#f59e0b' };
      };

      // Only show metrics where at least one creator has data
      const visibleMetrics = metricDefs.filter((m) => creators.some((c) => c[m.key] != null));
      const showGrade = creators.some((c) => c[gradeKey] != null);

      return (
        <div style={{
          backgroundColor: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#ffffff' }}>
              Creator Comparison
              {props.comparison_metric && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280', marginLeft: 8 }}>
                  by {props.comparison_metric}
                </span>
              )}
            </div>
            {props.winner && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#2dd4a8', marginTop: 4 }}>
                👑 {props.winner}
              </div>
            )}
          </div>

          {/* Comparison table */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${creators.length}, 1fr)`, minWidth: creators.length * 120 + 120 }}>
              {/* Header row — empty cell + creator names */}
              <div />
              {creators.map((c, ci) => {
                const t = trendInfo(c.trend);
                return (
                  <div key={ci} style={{
                    textAlign: 'center', padding: '8px 12px',
                    borderLeft: ci > 0 ? '1px solid #1e1e2e' : undefined,
                  }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#ffffff' }}>{c.name}</div>
                    {c.niche && (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)', padding: '2px 8px', borderRadius: 99,
                      }}>{c.niche}</span>
                    )}
                    {c.trend && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: t.color, marginLeft: 6 }}>
                        {t.arrow}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Metric rows */}
              {visibleMetrics.map((m, mi) => {
                const vals = creators.map((c) => c[m.key]);
                const numVals = vals.filter((v): v is number => v != null);
                const maxVal = numVals.length ? Math.max(...numVals) : null;
                const minVal = numVals.length > 1 ? Math.min(...numVals) : null;
                return (
                  <React.Fragment key={m.key}>
                    <div style={{
                      padding: '10px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280',
                      display: 'flex', alignItems: 'center',
                      backgroundColor: mi % 2 === 1 ? '#08080d' : 'transparent',
                    }}>{m.label}</div>
                    {creators.map((c, ci) => {
                      const v = c[m.key];
                      const isMax = v != null && v === maxVal;
                      const isMin = v != null && v === minVal && minVal !== maxVal;
                      return (
                        <div key={ci} style={{
                          textAlign: 'center', padding: '10px 12px',
                          borderLeft: ci > 0 ? '1px solid #1e1e2e' : undefined,
                          backgroundColor: mi % 2 === 1 ? '#08080d' : 'transparent',
                        }}>
                          <span style={{
                            fontFamily: "'Playfair Display', serif", fontSize: 16,
                            color: isMax ? '#2dd4a8' : '#ffffff',
                            fontWeight: isMax ? 700 : 400,
                            opacity: isMin ? 0.5 : 1,
                          }}>{v != null ? m.format(v) : '—'}</span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Engagement Grade row */}
              {showGrade && (
                <>
                  <div style={{
                    padding: '10px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280',
                    display: 'flex', alignItems: 'center',
                    backgroundColor: visibleMetrics.length % 2 === 1 ? '#08080d' : 'transparent',
                  }}>Engagement</div>
                  {creators.map((c, ci) => {
                    const g = c.engagement_grade;
                    const gc = g === 'A' ? '#2dd4a8' : g === 'B' ? '#00d4ff' : g === 'C' ? '#f59e0b' : g === 'D' ? '#e63946' : g === 'F' ? '#e63946' : '#6b7280';
                    return (
                      <div key={ci} style={{
                        textAlign: 'center', padding: '10px 12px',
                        borderLeft: ci > 0 ? '1px solid #1e1e2e' : undefined,
                        backgroundColor: visibleMetrics.length % 2 === 1 ? '#08080d' : 'transparent',
                      }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: gc, fontWeight: 700 }}>
                          {g ?? '—'}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Insights */}
          {props.insights && props.insights.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
              }}>Insights</div>
              {props.insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#00d4ff', fontSize: 13 }}>•</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{ins}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    },

    ContentROI: ({ props }) => {
      const verdictColors: Record<string, string> = {
        strong_roi: '#2dd4a8', moderate_roi: '#00d4ff', weak_roi: '#f59e0b', negative_roi: '#e63946',
      };
      const verdictLabels: Record<string, string> = {
        strong_roi: 'Strong ROI ✓', moderate_roi: 'Moderate ROI', weak_roi: 'Weak ROI', negative_roi: 'Negative ROI ✗',
      };
      const accentColor = props.verdict ? verdictColors[props.verdict] ?? '#6b7280' : '#6b7280';

      const formatViews = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : v.toString();

      return (
        <div style={{
          backgroundColor: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, overflow: 'hidden',
          display: 'flex',
        }}>
          {/* Left accent bar */}
          <div style={{ width: 4, backgroundColor: accentColor, flexShrink: 0 }} />

          <div style={{ padding: 24, flex: 1, position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#ffffff' }}>{props.campaign_name}</div>
                {props.period && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280', marginTop: 4 }}>{props.period}</div>
                )}
              </div>
              {props.verdict && (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                  color: accentColor, backgroundColor: `${accentColor}26`, padding: '4px 12px', borderRadius: 99,
                }}>{verdictLabels[props.verdict]}</span>
              )}
            </div>

            {/* Big stats row */}
            <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#ffffff' }}>{props.total_posts}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Total Posts</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#00d4ff' }}>{formatViews(props.total_views)}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Total Views</div>
              </div>
              {props.avg_dps != null && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: props.avg_dps >= 80 ? '#2dd4a8' : props.avg_dps >= 60 ? '#f59e0b' : '#e63946' }}>
                    {props.avg_dps.toFixed(1)}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Avg DPS</div>
                </div>
              )}
            </div>

            {props.total_engagement != null && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Total engagement: {props.total_engagement.toLocaleString()}
              </div>
            )}

            {/* Top / Worst performing posts */}
            {(props.top_performing_post || props.worst_performing_post) && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {props.top_performing_post && (
                  <div style={{
                    flex: '1 1 200px', padding: 12, backgroundColor: '#08080d', borderRadius: 8,
                    borderLeft: '3px solid #2dd4a8',
                  }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', color: '#2dd4a8', marginBottom: 4 }}>Best</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#ffffff', marginBottom: 2 }}>{props.top_performing_post.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>
                      {props.top_performing_post.creator_name} · {formatViews(props.top_performing_post.views)} views
                      {props.top_performing_post.dps_score != null && ` · DPS ${props.top_performing_post.dps_score}`}
                    </div>
                  </div>
                )}
                {props.worst_performing_post && (
                  <div style={{
                    flex: '1 1 200px', padding: 12, backgroundColor: '#08080d', borderRadius: 8,
                    borderLeft: '3px solid #e63946',
                  }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', color: '#e63946', marginBottom: 4 }}>Lowest</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#ffffff', marginBottom: 2 }}>{props.worst_performing_post.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6b7280' }}>
                      {props.worst_performing_post.creator_name} · {formatViews(props.worst_performing_post.views)} views
                      {props.worst_performing_post.dps_score != null && ` · DPS ${props.worst_performing_post.dps_score}`}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Creator breakdown */}
            {props.creator_breakdown && props.creator_breakdown.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 60px', gap: 4, marginBottom: 4 }}>
                  {['Creator', 'Posts', 'Views', 'DPS'].map((h) => (
                    <div key={h} style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase',
                      letterSpacing: '0.05em', color: '#6b7280', padding: '4px 0',
                    }}>{h}</div>
                  ))}
                </div>
                {[...props.creator_breakdown].sort((a, b) => b.views - a.views).map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 60px', gap: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e5e7eb' }}>{c.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e5e7eb' }}>{c.posts}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e5e7eb' }}>{formatViews(c.views)}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e5e7eb' }}>{c.avg_dps != null ? c.avg_dps.toFixed(1) : '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Verdict explanation */}
            {props.verdict_explanation && (
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#e5e7eb', fontStyle: 'italic', marginBottom: 16,
              }}>{props.verdict_explanation}</div>
            )}

            {/* Recommendations */}
            {props.recommendations && props.recommendations.length > 0 && (
              <div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#6b7280', marginBottom: 8,
                }}>Recommendations</div>
                {props.recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00d4ff',
                      minWidth: 18, textAlign: 'right',
                    }}>{i + 1}.</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    },

    TrendReport: ({ props }) => {
      const confidenceColor = (c?: string) => c === 'high' ? '#2dd4a8' : c === 'medium' ? '#f59e0b' : '#6b7280';

      return (
        <div style={{
          backgroundColor: '#0f0f16', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#ffffff' }}>{props.report_title}</div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b7280',
              backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: 99,
            }}>{props.period}</span>
          </div>

          {/* Rising Trends */}
          {props.rising_trends && props.rising_trends.length > 0 && (
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <div style={{ width: 2, backgroundColor: '#2dd4a8', borderRadius: 1, marginRight: 16, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#2dd4a8', marginBottom: 10,
                }}>📈 Rising</div>
                {props.rising_trends.map((t, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#2dd4a8' }}>{t.metric}</span>
                      {t.magnitude && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2dd4a8',
                          backgroundColor: 'rgba(45, 212, 168, 0.1)', padding: '1px 8px', borderRadius: 99,
                        }}>{t.magnitude}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb', marginTop: 2 }}>{t.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Falling Trends */}
          {props.falling_trends && props.falling_trends.length > 0 && (
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <div style={{ width: 2, backgroundColor: '#e63946', borderRadius: 1, marginRight: 16, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#e63946', marginBottom: 10,
                }}>📉 Declining</div>
                {props.falling_trends.map((t, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#e63946' }}>{t.metric}</span>
                      {t.magnitude && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e63946',
                          backgroundColor: 'rgba(230, 57, 70, 0.1)', padding: '1px 8px', borderRadius: 99,
                        }}>{t.magnitude}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb', marginTop: 2 }}>{t.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emerging Patterns */}
          {props.emerging_patterns && props.emerging_patterns.length > 0 && (
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <div style={{ width: 2, backgroundColor: '#7c3aed', borderRadius: 1, marginRight: 16, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#7c3aed', marginBottom: 10,
                }}>🔮 Emerging</div>
                {props.emerging_patterns.map((p, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>{p.pattern}</span>
                      {p.confidence && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: confidenceColor(p.confidence),
                          backgroundColor: `${confidenceColor(p.confidence)}1a`, padding: '1px 8px', borderRadius: 99,
                        }}>{p.confidence}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb', marginTop: 2 }}>{p.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Recommendations */}
          {props.strategic_recommendations && props.strategic_recommendations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#00d4ff', marginBottom: 8,
              }}>Strategic Recommendations</div>
              {props.strategic_recommendations.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00d4ff',
                    minWidth: 18, textAlign: 'right',
                  }}>{i + 1}.</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#e5e7eb' }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Data quality note */}
          {props.data_quality_note && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6b7280', fontStyle: 'italic',
            }}>ℹ {props.data_quality_note}</div>
          )}
        </div>
      );
    },
  },

  actions: {
    analyze_creator: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'analyze_creator', creatorName: params?.creatorName } }));
      }
    },
    generate_brief: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'generate_brief', creatorName: params?.creatorName, topic: params?.topic } }));
      }
    },
    refresh_data: async () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'refresh_data' } }));
      }
    },
    export_report: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'export_report', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Exporting report as ${params?.format ?? 'pdf'}` } }));
      }
    },
    navigate_creator: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'navigate_creator', creatorId: params?.creatorId } }));
      }
    },
    send_invite: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'send_invite', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `I'd like to send an onboarding invite to ${params?.creator_name ?? params?.email ?? 'a new creator'}` } }));
      }
    },
    nudge_creator: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'nudge_creator', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Send a nudge to ${params?.creator_name} about completing their onboarding` } }));
      }
    },
    create_event: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'create_event', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Creating cultural event: ${params?.event_name ?? 'new event'}` } }));
      }
    },
    match_creators_to_event: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'match_creators_to_event', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Finding best creators for ${params?.event_name}` } }));
      }
    },
    push_brief_to_creators: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'push_brief_to_creators', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Pushing brief for ${params?.event_name} to ${params?.creator_names?.length ?? 0} creators` } }));
      }
    },
    check_push_status: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'check_push_status', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Checking push status for ${params?.event_name ?? 'brief'}` } }));
      }
    },
    generate_batch_briefs: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'generate_batch_briefs', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Generating batch briefs for ${params?.scope ?? 'upcoming events'}...` } }));
      }
    },
    approve_brief: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'approve_brief', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Approved: ${params?.brief_title}` } }));
      }
    },
    schedule_post: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'schedule_post', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Scheduling post for ${params?.creator_name} on ${params?.date}` } }));
      }
    },
    generate_report: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'generate_report', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Generating ${params?.report_type ?? 'agency'} report for ${params?.period ?? 'current period'}` } }));
      }
    },
    reschedule_post: async (params) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'reschedule_post', params } }));
        window.dispatchEvent(new CustomEvent('trendzo-chat', { detail: { message: `Rescheduling ${params?.post_title} to ${params?.new_date}` } }));
      }
    },
  },
});
