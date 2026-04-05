import AgencyAuthGate from './AuthGate'

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgencyAuthGate>
      {children}
    </AgencyAuthGate>
  )
}
