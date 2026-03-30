import CopyLinkButton from './components/CopyLinkButton'

interface HubTool {
  id: string
  title: string
  description: string
  path: string
  status: 'preview' | 'coming_soon'
}

const FEATURED_TOOLS: HubTool[] = [
  {
    id: 'freedom-os',
    title: 'Freedom OS',
    description: 'Personalized financial freedom roadmap builder',
    path: '/free/freedom-os',
    status: 'preview',
  },
  {
    id: 'credit',
    title: 'Credit Booster',
    description: 'Step-by-step credit score improvement plan',
    path: '/free/credit',
    status: 'coming_soon',
  },
  {
    id: 'debt',
    title: 'Debt Escape Planner',
    description: 'Optimized debt payoff strategy calculator',
    path: '/free/debt',
    status: 'coming_soon',
  },
  {
    id: 'income',
    title: 'Income Stack Builder',
    description: 'Multi-stream income diversification planner',
    path: '/free/income',
    status: 'coming_soon',
  },
]

const PUBLIC_HUB_URL = '/free'

const STATUS_STYLES: Record<HubTool['status'], { label: string; bg: string; color: string; border: string }> = {
  preview: {
    label: 'Preview',
    bg: 'rgba(229,9,20,0.1)',
    color: '#ff1744',
    border: 'rgba(229,9,20,0.2)',
  },
  coming_soon: {
    label: 'Coming Soon',
    bg: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.35)',
    border: 'rgba(255,255,255,0.08)',
  },
}

export default function AdminHubPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: '#0a0a0f' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Value Hub
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Manage your public free-tool delivery hub
          </p>
        </div>

        {/* Section 1: Public Hub Link */}
        <section
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Public Hub Link
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <code
              className="px-4 py-2 rounded-lg text-sm font-mono"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {PUBLIC_HUB_URL}
            </code>
            <CopyLinkButton text={PUBLIC_HUB_URL} />
            <a
              href={PUBLIC_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 no-underline"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open public hub
            </a>
          </div>
        </section>

        {/* Section 2: Featured Tools */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Featured Tools
          </h2>
          <div className="flex flex-col gap-3">
            {FEATURED_TOOLS.map((tool) => {
              const badge = STATUS_STYLES[tool.status]
              const isLive = tool.status === 'preview'
              return (
                <div
                  key={tool.id}
                  className="flex items-center justify-between rounded-xl px-5 py-4 transition-all duration-200"
                  style={{
                    background: isLive
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.015)',
                    border: `1px solid ${isLive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: isLive ? '#fff' : 'rgba(255,255,255,0.35)' }}
                      >
                        {tool.title}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {tool.description}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <a
                      href={tool.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono no-underline transition-colors duration-200 hover:underline"
                      style={{ color: isLive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)' }}
                    >
                      {tool.path}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Edit mode placeholder */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Edit mode and persistence will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  )
}
