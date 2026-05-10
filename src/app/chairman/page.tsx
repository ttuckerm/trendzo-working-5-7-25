import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic';

/**
 * Chairman root page — redirects to operations (the chairman's primary view).
 */
export default function ChairmanPage() {
  redirect('/admin/operations')
}
