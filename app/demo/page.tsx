// This static page is intentionally left as a thin pass-through.
// /demo is resolved by Next.js as this static route BEFORE [shopSlug].
// We redirect to the actual shop URL so [shopSlug]/page.tsx renders it.
import { redirect } from 'next/navigation'
export default function DemoRedirect() {
  // The demo shop uses slug "kvity-demo" to avoid this route conflict
  redirect('/kvity-demo')
}
