'use client'

import { useState } from 'react'
import Image from 'next/image'

export interface Flower {
  id: string
  name: string
  price: number
  imageUrl: string | null
  availability: string
  description: string | null
  createdAt: string
  madeAt: string | null
}

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  estimatedMinHours?: number
  estimatedMaxHours?: number
  sameDayAvailable?: boolean
}

export interface Shop {
  id: string
  name: string
  slug: string
  location: string | null
  city: string | null
  country: string | null
  googleMapsUrl: string | null
  about: string | null
  workingHours: string | null
  coverImageUrl: string | null
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  enableAnimations: boolean
  email: string | null
  phoneNumber: string | null
  whatsappNumber: string | null
  telegramHandle: string | null
  instagramHandle: string | null
  deliveryZones: DeliveryZone[]
  sameDayDelivery: boolean
  deliveryTimeEstimate: string | null
  deliveryCutoffTime: string | null
  minimumOrderAmount: number | null
  showDeliveryEstimate: boolean
  currency: string
  language: string
  flowers: Flower[]
  showPhone: boolean
  showEmail: boolean
  showWhatsapp: boolean
  showTelegram: boolean
  showInstagram: boolean
  showLocation: boolean
  allowCustomBouquet: boolean
  layoutStyle: string | null
}

type OrderStep = 1 | 2 | 3 | 4

const DAYS_UA: Record<string, string> = {
  monday: 'Пн', tuesday: 'Вт', wednesday: 'Ср',
  thursday: 'Чт', friday: 'Пт', saturday: 'Сб', sunday: 'Нд',
}

export default function ShopClient({ shop }: { shop: Shop }) {
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState<OrderStep>(1)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null)
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({
    customerName: '', phone: '', email: '',
    address: '', city: '', zipCode: '', message: '',
  })
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [cartCount, setCartCount] = useState(0)

  const primary = shop.primaryColor || '#ec4899'
  const accent  = shop.accentColor  || '#a855f7'
  const layout  = shop.layoutStyle  || 'classic'
  const currencySymbol =
    shop.currency === 'UAH' ? '₴' :
    shop.currency === 'EUR' ? '€' :
    shop.currency === 'GBP' ? '£' : '$'

  const getEstimatedDelivery = () => {
    if (deliveryMethod !== 'delivery') return null
    const cutoff = parseInt((shop.deliveryCutoffTime || '14:00').split(':')[0])
    if (shop.sameDayDelivery && new Date().getHours() < cutoff) {
      return shop.deliveryTimeEstimate || 'Сьогодні, 2–4 години'
    }
    return 'Завтра, 10:00 – 14:00'
  }

  const getWorkingHoursDisplay = (): string | null => {
    if (!shop.workingHours) return null
    try {
      const parsed = JSON.parse(shop.workingHours)
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const h = parsed[today]
      if (!h) return null
      if (h.closed) return 'Сьогодні закрито'
      return `Сьогодні: ${h.open} – ${h.close}`
    } catch { return shop.workingHours }
  }

  const openGoogleMaps = () => {
    if (shop.googleMapsUrl) { window.open(shop.googleMapsUrl, '_blank'); return }
    if (shop.location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location)}`, '_blank')
    }
  }

  const getFreshnessBadge = (flower: Flower) => {
    try {
      const daysAgo = Math.floor((Date.now() - new Date(flower.madeAt || flower.createdAt).getTime()) / 86_400_000)
      if (daysAgo === 0) return { label: 'Свіже сьогодні', cls: 'bg-emerald-100 text-emerald-700' }
      if (daysAgo === 1) return { label: 'Вчора', cls: 'bg-green-100 text-green-700' }
      if (daysAgo <= 3) return { label: `${daysAgo} дні тому`, cls: 'bg-blue-100 text-blue-700' }
      return { label: 'В наявності', cls: 'bg-gray-100 text-gray-600' }
    } catch { return { label: 'В наявності', cls: 'bg-gray-100 text-gray-600' } }
  }

  const handleOrder = (flower: Flower) => {
    setSelectedFlower(flower)
    setShowModal(true)
    setCurrentStep(1)
    setDeliveryMethod(null)
    setSelectedZone(null)
    setSubmitStatus('idle')
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentStep(1)
    setDeliveryMethod(null)
    setSelectedZone(null)
    setFormData({ customerName: '', phone: '', email: '', address: '', city: '', zipCode: '', message: '' })
  }

  const nextStep = () => {
    if (currentStep === 2 && deliveryMethod === 'pickup') setCurrentStep(4)
    else if (currentStep < 4) setCurrentStep((currentStep + 1) as OrderStep)
  }
  const prevStep = () => {
    if (currentStep === 4 && deliveryMethod === 'pickup') setCurrentStep(2)
    else if (currentStep > 1) setCurrentStep((currentStep - 1) as OrderStep)
  }

  const handleSubmit = async () => {
    setSubmitStatus('loading')
    const estimatedDelivery = getEstimatedDelivery()
    const orderMessage = [
      deliveryMethod === 'pickup' ? '🏪 САМОВИВІЗ' : '🚚 ДОСТАВКА',
      `Букет: ${selectedFlower?.name}`,
      `\nКонтакт:\n${formData.customerName}\n${formData.phone}`,
      formData.email ? formData.email : '',
      deliveryMethod === 'delivery' ? `\nАдреса:\n${formData.address}\n${formData.city} ${formData.zipCode}` : '',
      selectedZone ? `Зона: ${selectedZone.name} (${currencySymbol}${selectedZone.fee})` : '',
      estimatedDelivery ? `Доставка: ${estimatedDelivery}` : '',
      formData.message ? `\nПобажання:\n${formData.message}` : '',
    ].filter(Boolean).join('\n').trim()

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: shop.slug,
          flowerId: selectedFlower?.id,
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email || undefined,
          message: orderMessage,
          deliveryMethod,
          totalAmount: (selectedFlower?.price || 0) + (selectedZone?.fee || 0),
          deliveryAddress: deliveryMethod === 'delivery'
            ? { address: formData.address, city: formData.city, zipCode: formData.zipCode }
            : null,
        }),
      })
      if (res.ok) { setSubmitStatus('success'); setCartCount(c => c + 1); setTimeout(closeModal, 3500) }
      else setSubmitStatus('error')
    } catch { setSubmitStatus('error') }
  }

  const estimatedDelivery = getEstimatedDelivery()
  const hoursDisplay = getWorkingHoursDisplay()

  return (
    <main className="min-h-screen bg-gray-50" style={{ paddingBottom: 'max(100px, calc(80px + env(safe-area-inset-bottom)))' }}>
      <style>{`
        :root { --primary: ${primary}; --accent: ${accent}; }
        .btn-primary { background: linear-gradient(135deg, ${primary}, ${accent}); transition: filter .2s, transform .15s; }
        .btn-primary:hover { filter: brightness(0.9); }
        .btn-primary:active { transform: scale(0.97); }
        .ring-primary { --tw-ring-color: ${primary}; }
        .text-primary { color: ${primary}; }
      `}</style>

      {/* ── COVER ── */}
      <div className="relative">
        <div className="relative overflow-hidden bg-gray-900" style={{ height: 'clamp(200px, 40vw, 340px)' }}>
          {shop.coverImageUrl
            ? <Image src={shop.coverImageUrl} alt={shop.name} fill className="object-cover opacity-80" priority />
            : <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}cc, ${accent}cc)` }}>
                <span className="text-8xl opacity-20">🌸</span>
              </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
        </div>

        {/* Shop info bar */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="flex items-end gap-4 -mt-10 pb-5">
              {/* Logo */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center flex-shrink-0 border-2 border-white overflow-hidden relative">
                {shop.logoUrl
                  ? <Image src={shop.logoUrl} alt="Логотип" fill className="object-cover" />
                  : <span className="text-2xl md:text-3xl font-black" style={{ color: primary }}>{shop.name.charAt(0).toUpperCase()}</span>
                }
              </div>

              <div className="flex-1 pt-10 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{shop.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {shop.showLocation && shop.location && (
                        <button onClick={openGoogleMaps}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {shop.location}
                        </button>
                      )}
                      {hoursDisplay && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {hoursDisplay}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-10 md:pt-10">
                    {cartCount > 0 && (
                      <div className="relative">
                        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow" style={{ background: primary }}>
                          {cartCount}
                        </span>
                      </div>
                    )}
                    <a href={`/${shop.slug}/track-order`}
                      className="text-xs font-semibold px-3 py-2 rounded-xl border-2 transition-all"
                      style={{ color: primary, borderColor: `${primary}40` }}>
                      Відстежити
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ABOUT ── */}
      {shop.about && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-5">
            <p className="text-gray-600 text-sm leading-relaxed">{shop.about}</p>
          </div>
        </div>
      )}

      {/* ── CUSTOM BOUQUET BANNER ── */}
      {shop.allowCustomBouquet && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 mt-5">
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
            <div className="px-5 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/70 font-medium mb-0.5">Ексклюзивна послуга</p>
                <h2 className="text-base font-bold text-white">Власний букет на замовлення</h2>
                <p className="text-white/75 text-xs mt-0.5">Оберіть квіти й упаковку на власний смак</p>
              </div>
              <a href={`/${shop.slug}/custom-bouquet`}
                className="flex-shrink-0 bg-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
                style={{ color: primary }}>
                Створити →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── CATALOG ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Каталог</h2>
            <p className="text-sm text-gray-400 mt-0.5">{shop.flowers.length} букетів</p>
          </div>
        </div>

        {shop.flowers.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-14 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Букетів поки немає</h3>
            <p className="text-sm text-gray-400">Заходьте пізніше — скоро з'являться нові!</p>
          </div>
        ) : layout === 'list' ? (
          /* ── LIST LAYOUT ── */
          <div className="space-y-3">
            {shop.flowers.map((flower) => {
              const badge = getFreshnessBadge(flower)
              const isUnavailable = flower.availability === 'out_of_stock'
              return (
                <div key={flower.id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 p-3 hover:shadow-md transition-shadow ${isUnavailable ? 'opacity-60' : ''}`}>
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {flower.imageUrl
                      ? <Image src={flower.imageUrl} alt={flower.name} fill className="object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center text-3xl">🌸</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{flower.name}</h3>
                    {flower.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{flower.description}</p>}
                    <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-lg font-bold" style={{ color: primary }}>{currencySymbol}{flower.price.toFixed(0)}</span>
                    <button onClick={() => !isUnavailable && handleOrder(flower)} disabled={isUnavailable}
                      className="btn-primary text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-sm disabled:opacity-40">
                      {isUnavailable ? '—' : 'Замовити'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── GRID LAYOUT ── */
          <div className={`grid gap-4 ${
            layout === 'bold'   ? 'grid-cols-1 max-w-lg mx-auto' :
            layout === 'modern' ? 'grid-cols-2' :
                                  'grid-cols-2 xl:grid-cols-3'
          }`}>
            {shop.flowers.map((flower) => {
              const badge = getFreshnessBadge(flower)
              const isUnavailable = flower.availability === 'out_of_stock'
              const imgH = layout === 'bold' ? '280px' : layout === 'modern' ? '200px' : '170px'
              return (
                <div key={flower.id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 ${isUnavailable ? 'opacity-60' : ''}`}>
                  {/* Image */}
                  <div className="relative overflow-hidden bg-gray-100" style={{ height: imgH }}>
                    {flower.imageUrl
                      ? <Image src={flower.imageUrl} alt={flower.name} fill className="object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}15, ${accent}15)` }}>
                          <span className={layout === 'bold' ? 'text-8xl' : 'text-6xl'}>🌸</span>
                        </div>
                    }
                    {/* Badges top-left */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {flower.availability === 'limited' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-white shadow-sm">
                          Мало
                        </span>
                      )}
                    </div>
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full shadow">Немає в наявності</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{flower.name}</h3>
                    {flower.description && layout !== 'modern' && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2 hidden md:block">{flower.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-base md:text-xl font-bold" style={{ color: primary }}>
                        {currencySymbol}{flower.price.toFixed(0)}
                      </span>
                      <button
                        onClick={() => !isUnavailable && handleOrder(flower)}
                        disabled={isUnavailable}
                        className="btn-primary text-white rounded-xl font-semibold text-xs px-3 py-2 md:px-4 md:py-2.5 shadow-sm disabled:opacity-40 flex-shrink-0"
                      >
                        {isUnavailable ? '—' : 'Замовити'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── DELIVERY INFO ── */}
      {shop.showDeliveryEstimate && (shop.sameDayDelivery || shop.deliveryZones?.length > 0) && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            </span>
            Доставка
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {shop.sameDayDelivery && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-emerald-600 mb-1">⚡ Сьогодні</p>
                <p className="text-sm font-semibold text-gray-900">Доставка в день замовлення</p>
                <p className="text-xs text-gray-400 mt-1">До {shop.deliveryCutoffTime || '14:00'}</p>
              </div>
            )}
            {shop.deliveryTimeEstimate && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-blue-600 mb-1">⏱ Час доставки</p>
                <p className="text-sm font-semibold text-gray-900">{shop.deliveryTimeEstimate}</p>
              </div>
            )}
            {shop.minimumOrderAmount && shop.minimumOrderAmount > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-amber-600 mb-1">🛒 Мінімум</p>
                <p className="text-sm font-semibold text-gray-900">{currencySymbol}{shop.minimumOrderAmount}</p>
              </div>
            )}
            {shop.deliveryZones?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm sm:col-span-2 md:col-span-1">
                <p className="text-xs font-semibold text-purple-600 mb-2">🗺 Зони доставки</p>
                <div className="space-y-1.5">
                  {shop.deliveryZones.slice(0, 5).map((zone, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{zone.name}</span>
                      <span className="font-semibold text-gray-900">{currencySymbol}{zone.fee}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTACTS ── */}
      {(shop.showPhone || shop.showWhatsapp || shop.showTelegram || shop.showInstagram || shop.showEmail || (shop.showLocation && shop.location)) && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </span>
            Зв'язатися
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {shop.showPhone && shop.phoneNumber && (
              <a href={`tel:${shop.phoneNumber}`}
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Подзвонити</p>
                  <p className="text-sm font-semibold text-gray-900">{shop.phoneNumber}</p>
                </div>
              </a>
            )}
            {shop.showWhatsapp && shop.whatsappNumber && (
              <a href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#e7fce9]">
                  <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">WhatsApp</p>
                  <p className="text-sm font-semibold text-gray-900">Написати</p>
                </div>
              </a>
            )}
            {shop.showTelegram && shop.telegramHandle && (
              <a href={`https://t.me/${shop.telegramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#e3f2fd]">
                  <svg className="w-5 h-5 text-[#2AABEE]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Telegram</p>
                  <p className="text-sm font-semibold text-gray-900">{shop.telegramHandle}</p>
                </div>
              </a>
            )}
            {shop.showInstagram && shop.instagramHandle && (
              <a href={`https://instagram.com/${shop.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-pink-100 to-orange-100">
                  <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Instagram</p>
                  <p className="text-sm font-semibold text-gray-900">{shop.instagramHandle}</p>
                </div>
              </a>
            )}
            {shop.showEmail && shop.email && (
              <a href={`mailto:${shop.email}`}
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{shop.email}</p>
                </div>
              </a>
            )}
            {shop.showLocation && shop.location && (
              <button onClick={openGoogleMaps}
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left w-full">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Адреса</p>
                  <p className="text-sm font-semibold text-gray-900">{shop.location}</p>
                </div>
              </button>
            )}
          </div>

          {/* Working hours */}
          {shop.workingHours && (() => {
            try {
              const parsed = JSON.parse(shop.workingHours!)
              return (
                <div className="mt-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Години роботи</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                      const h = parsed[day]
                      if (!h) return null
                      const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day
                      return (
                        <div key={day} className={`flex items-center justify-between text-xs ${isToday ? 'font-semibold' : ''}`}>
                          <span className={isToday ? 'text-gray-900' : 'text-gray-500'}>
                            {DAYS_UA[day]}{isToday ? ' ·' : ''}
                          </span>
                          <span className={h.closed ? 'text-red-400' : isToday ? 'text-gray-900' : 'text-gray-600'}>
                            {h.closed ? 'Зачинено' : `${h.open}–${h.close}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            } catch { return null }
          })()}

          {/* Map */}
          {shop.showLocation && shop.location && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.location + (shop.city ? ', ' + shop.city : ''))}&output=embed`}
                width="100%" height="260" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-white mt-2">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-base mb-0.5">{shop.name}</h3>
              <p className="text-sm text-gray-400">Квіти з любов'ю</p>
            </div>
            <div className="flex items-center gap-2">
              {shop.showInstagram && shop.instagramHandle && (
                <a href={`https://instagram.com/${shop.instagramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {shop.showTelegram && shop.telegramHandle && (
                <a href={`https://t.me/${shop.telegramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
              )}
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-600">© {new Date().getFullYear()} {shop.name}</span>
            <a href={`/${shop.slug}/track-order`} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Відстежити замовлення
            </a>
          </div>
        </div>
      </footer>

      {/* ── STICKY CTA ── */}
      {shop.flowers.length > 0 && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-3 pb-safe shadow-2xl">
          <button
            onClick={() => {
              const first = shop.flowers.find(f => f.availability !== 'out_of_stock')
              if (first) handleOrder(first)
              else window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="btn-primary w-full text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg">
            Замовити букет
          </button>
        </div>
      )}

      {/* ── ORDER MODAL ── */}
      {showModal && selectedFlower && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white w-full max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden" style={{ maxHeight: '92dvh' }}>
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(92dvh - 20px)' }}>
              <div className="px-5 py-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-5 pr-2">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Оформити замовлення</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {selectedFlower.name} · <span className="font-semibold" style={{ color: primary }}>{currencySymbol}{selectedFlower.price.toFixed(0)}</span>
                    </p>
                  </div>
                  <button onClick={closeModal}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Step dots */}
                <div className="flex items-center gap-1.5 mb-6">
                  {[1,2,3,4].map(s => (
                    <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: s <= currentStep ? `linear-gradient(to right, ${primary}, ${accent})` : '#e5e7eb' }} />
                  ))}
                </div>

                {/* SUCCESS */}
                {submitStatus === 'success' ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Замовлення прийнято!</h3>
                    <p className="text-sm text-gray-500 mb-6">Ми зателефонуємо на <span className="font-semibold text-gray-700">{formData.phone}</span> для підтвердження.</p>
                    <a href={`/${shop.slug}/track-order`}
                      className="btn-primary block w-full text-white py-3.5 rounded-2xl font-semibold text-sm text-center shadow-md">
                      Відстежити замовлення
                    </a>
                  </div>
                ) : (
                  <>
                    {/* STEP 1 — Delivery method */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">Як отримати?</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { method: 'pickup' as const, title: 'Самовивіз', desc: shop.location || 'З магазину', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                            { method: 'delivery' as const, title: 'Доставка', desc: shop.sameDayDelivery ? '⚡ Сьогодні' : 'До вас', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg> },
                          ].map(opt => (
                            <button key={opt.method} onClick={() => setDeliveryMethod(opt.method)}
                              className="p-4 border-2 rounded-2xl transition-all text-left"
                              style={deliveryMethod === opt.method ? { borderColor: primary, background: `${primary}0d` } : { borderColor: '#e5e7eb' }}>
                              <div className="mb-2" style={{ color: deliveryMethod === opt.method ? primary : '#9ca3af' }}>{opt.icon}</div>
                              <p className="font-semibold text-gray-900 text-sm">{opt.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                        {deliveryMethod === 'delivery' && shop.deliveryZones?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-700">Зона доставки</p>
                            {shop.deliveryZones.map((zone, i) => (
                              <button key={i} onClick={() => setSelectedZone(zone)}
                                className="w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl transition-all text-sm"
                                style={selectedZone?.id === zone.id ? { borderColor: primary, background: `${primary}0d` } : { borderColor: '#e5e7eb' }}>
                                <span className="font-medium text-gray-800">{zone.name}</span>
                                <span className="font-bold" style={{ color: primary }}>{currencySymbol}{zone.fee}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <button onClick={nextStep}
                          disabled={!deliveryMethod || (deliveryMethod === 'delivery' && (shop.deliveryZones?.length ?? 0) > 0 && !selectedZone)}
                          className="btn-primary w-full text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 shadow-md mt-2">
                          Продовжити →
                        </button>
                      </div>
                    )}

                    {/* STEP 2 — Contact info */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">Ваші дані</h3>
                        {[
                          { label: "Ім'я та прізвище *", key: 'customerName' as const, type: 'text', ph: 'Ірина Ковальчук' },
                          { label: 'Телефон *', key: 'phone' as const, type: 'tel', ph: '+380 99 123 45 67' },
                          { label: "Email (необов'язково)", key: 'email' as const, type: 'email', ph: 'you@example.com' },
                        ].map(f => (
                          <div key={f.key} className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                            <input type={f.type} placeholder={f.ph} value={formData[f.key]}
                              onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 transition-colors" />
                          </div>
                        ))}
                        <div className="flex gap-3 pt-2">
                          <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-semibold text-sm">← Назад</button>
                          <button onClick={nextStep} disabled={!formData.customerName || !formData.phone}
                            className="btn-primary flex-[2] text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 shadow-md">Далі →</button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3 — Address */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">{deliveryMethod === 'delivery' ? 'Адреса доставки' : 'Підтвердження'}</h3>
                        {deliveryMethod === 'delivery' ? (
                          <>
                            {estimatedDelivery && (
                              <div className="rounded-xl p-3 text-sm flex items-center gap-2 border"
                                style={{ background: `${primary}0d`, borderColor: `${primary}30`, color: primary }}>
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="font-medium">Очікувана доставка: {estimatedDelivery}</span>
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-gray-600">Вулиця та будинок *</label>
                              <input type="text" placeholder="вул. Хрещатик, 1" value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-pink-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-600">Місто *</label>
                                <input type="text" placeholder="Київ" value={formData.city}
                                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-pink-400" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-600">Індекс</label>
                                <input type="text" placeholder="01001" value={formData.zipCode}
                                  onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-pink-400" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-xl p-4 border" style={{ background: `${primary}0d`, borderColor: `${primary}30` }}>
                            <p className="text-xs font-semibold mb-0.5" style={{ color: primary }}>Самовивіз</p>
                            <p className="text-sm font-bold text-gray-900">{shop.location || shop.name}</p>
                          </div>
                        )}
                        <div className="flex gap-3 pt-2">
                          <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-semibold text-sm">← Назад</button>
                          <button onClick={nextStep}
                            disabled={deliveryMethod === 'delivery' && (!formData.address || !formData.city)}
                            className="btn-primary flex-[2] text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 shadow-md">Далі →</button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4 — Confirm */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">Підтвердження</h3>
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 border border-gray-100">
                          {[
                            { label: 'Букет', value: selectedFlower.name },
                            { label: 'Ціна', value: `${currencySymbol}${selectedFlower.price.toFixed(0)}`, bold: true },
                            { label: 'Спосіб', value: deliveryMethod === 'pickup' ? 'Самовивіз' : 'Доставка' },
                            ...(selectedZone ? [{ label: 'Зона', value: `${selectedZone.name} +${currencySymbol}${selectedZone.fee}` }] : []),
                            { label: 'Контакт', value: `${formData.customerName}, ${formData.phone}` },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">{row.label}</span>
                              <span className={`font-${row.bold ? 'bold text-base' : 'medium'} text-gray-900 text-right max-w-[60%]`} style={row.bold ? { color: primary } : {}}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Побажання <span className="text-gray-400 font-normal">(необов'язково)</span></label>
                          <textarea rows={3} value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm resize-none focus:outline-none focus:border-pink-400"
                            placeholder="Текст на листівку, зручний час..." />
                        </div>
                        {submitStatus === 'error' && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs">
                            Не вдалося надіслати замовлення. Спробуйте ще раз.
                          </div>
                        )}
                        <div className="flex gap-3 pt-2">
                          <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-semibold text-sm">← Назад</button>
                          <button onClick={handleSubmit} disabled={submitStatus === 'loading'}
                            className="btn-primary flex-[2] text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50 shadow-md">
                            {submitStatus === 'loading'
                              ? <span className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                  Надсилаємо...
                                </span>
                              : 'Підтвердити замовлення'
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="h-5" />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
