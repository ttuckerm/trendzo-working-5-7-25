import React from 'react';

// This is a self-contained layout file.
// By defining `<html>` and `<body>` tags here, we tell Next.js not to use the 
// parent layout file at `src/app/admin/layout.tsx`. This isolates the sandbox.

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
} 