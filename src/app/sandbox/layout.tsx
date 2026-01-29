import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Viral Studio Sandbox',
  description: 'Testing environment for viral content creation workflow',
}

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  )
}