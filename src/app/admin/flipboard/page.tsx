'use client';
import Flipboard from '../super-admin-components/Flipboard'
import AdminProtectionWrapper from '../AdminProtectionWrapper'

export default function FlipboardPage() {
  return (
    <AdminProtectionWrapper>
      <Flipboard />
    </AdminProtectionWrapper>
  )
}


