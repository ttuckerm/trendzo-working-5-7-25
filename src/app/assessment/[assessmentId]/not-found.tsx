import Link from 'next/link'

export default function AssessmentNotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08080d',
        color: '#f4f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          background: '#1c1c24',
          border: '1px solid #22222c',
          borderRadius: 12,
          padding: '40px 32px',
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          ASSESSMENT // NOT FOUND
        </div>
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 32,
            color: '#f4f4f6',
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          This assessment doesn&rsquo;t exist or the link is invalid.
        </h1>
        <p
          style={{
            color: '#9b9ba4',
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Double-check the URL. If you came here from a generated assessment,
          the row may have been removed. You can run a new assessment to get a
          fresh personalized HUD.
        </p>
        <Link
          href="/free/escape-assessment"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            background: '#f04a4d',
            color: '#f4f4f6',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Start a new assessment
        </Link>
      </div>
    </div>
  )
}
