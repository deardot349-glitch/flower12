import { redirect } from 'next/navigation'

// The old separate Delivery Zones page has been removed.
// Delivery settings (including cities) now live in Settings → 🚚 Доставка.
export default function DeliveryRedirect() {
  redirect('/dashboard/settings?tab=delivery')
}
