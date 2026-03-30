import { redirect } from 'next/navigation'

/**
 * Chairman root page — redirects to operations (the chairman's primary view).
 */
export default function ChairmanPage() {
  redirect('/admin/operations')
}
