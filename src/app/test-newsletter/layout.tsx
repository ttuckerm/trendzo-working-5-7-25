export const metadata = {
  title: 'Newsletter Link Testing | Trendzo Admin',
  description: 'Test and verify newsletter link authentication and redirection',
}

export default function NewsletterTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
} 