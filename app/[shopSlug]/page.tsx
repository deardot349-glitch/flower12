'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Flower {
  id: string
  name: string
  price: number
  imageUrl: string | null
  availability: string
  description: string | null
  createdAt: string
}

interface DeliveryZone {
  id: string
  name: string
  fee: number
  estimatedMinHours?: number
  estimatedMaxHours?: number
  sameDayAvailable?: boolean
}

interface Shop {
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
  thursday: 'Чт', friday: 'Пт', saturday: 'Сб', sunday: 'Нд'
}

export default function ShopPage({ params }: { params: { shopSlug: string } }) {
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState<OrderStep>(1)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null)
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    message: ''
  })
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    fetchShop()
  }, [params.shopSlug])

  const fetchShop = async () => {
    try {
      const res = await fetch(`/api/shop/public/${params.shopSlug}`)
      const data = await res.json()
      if (data.shop) setShop(data.shop)
    } catch (err) {
      console.error('Помилка завантаження магазину')
    } finally {
      setLoading(false)
    }
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
    if (currentStep === 2 && deliveryMethod === 'pickup') {
      setCurrentStep(4) // skip address step for pickup
    } else if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as OrderStep)
    }
  }
  const prevStep = () => {
    if (currentStep === 4 && deliveryMethod === 'pickup') {
      setCurrentStep(2) // skip back over address step
    } else if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OrderStep)
    }
  }

  const getEstimatedDelivery = () => {
    if (!shop || deliveryMethod !== 'delivery') return null
    const currentHour = new Date().getHours()
    const cutoff = parseInt((shop.deliveryCutoffTime || '14:00').split(':')[0])
    if (shop.sameDayDelivery && currentHour < cutoff) {
      return shop.deliveryTimeEstimate || 'Сьогодні, 2–4 години'
    }
    return 'Завтра, 10:00 – 14:00'
  }

  const getWorkingHoursDisplay = (): string | null => {
    if (!shop?.workingHours) return null
    try {
      const parsed = JSON.parse(shop.workingHours)
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const todayHours = parsed[today]
      if (!todayHours) return null
      if (todayHours.closed) return 'Сьогодні закрито'
      return `Сьогодні: ${todayHours.open} – ${todayHours.close}`
    } catch {
      return shop.workingHours
    }
  }

  const openGoogleMaps = () => {
    if (shop?.googleMapsUrl) { window.open(shop.googleMapsUrl, '_blank'); return }
    if (shop?.location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location)}`, '_blank')
    }
  }

  const getBadgeLabel = (createdAt: string) => {
    try {
      const daysAgo = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysAgo === 0) return { label: 'Свіже сьогодні', color: 'text-green-700 bg-green-100' }
      if (daysAgo === 1) return { label: 'Вчора', color: 'text-emerald-700 bg-emerald-100' }
      if (daysAgo <= 3) return { label: `${daysAgo} дні тому`, color: 'text-blue-700 bg-blue-100' }
      return { label: 'В наявності', color: 'text-gray-700 bg-gray-100' }
    } catch {
      return { label: 'Нове', color: 'text-gray-700 bg-gray-100' }
    }
  }

  const handleSubmit = async () => {
    setSubmitStatus('loading')
    const estimatedDelivery = getEstimatedDelivery()
    const zoneLine = selectedZone ? `Зона: ${selectedZone.name} (${currencySymbol}${selectedZone.fee})` : ''
    const orderMessage = [
      deliveryMethod === 'pickup' ? '🏪 САМОВИВІЗ' : '🚚 ДОСТАВКА',
      `Букет: ${selectedFlower?.name}`,
      '',
      'Контакт:',
      formData.customerName,
      formData.phone,
      formData.email,
      deliveryMethod === 'delivery' ? `\nАдреса доставки:\n${formData.address}\n${formData.city}, ${formData.zipCode}\n${zoneLine}\n⏱️ Очікувана доставка: ${estimatedDelivery}` : '',
      formData.message ? `\nПовідомлення:\n${formData.message}` : '',
    ].filter(Boolean).join('\n').trim()

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: params.shopSlug,
          flowerId: selectedFlower?.id,
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email || undefined,
          message: orderMessage,
          deliveryMethod,
          totalAmount: (selectedFlower?.price || 0) + (selectedZone?.fee || 0),
          deliveryAddress: deliveryMethod === 'delivery' ? {
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
          } : null,
        })
      })
      if (res.ok) {
        setSubmitStatus('success')
        setCartCount(prev => prev + 1)
        setTimeout(closeModal, 3500)
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Завантажуємо магазин...</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="text-7xl mb-5">🌸</div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Магазин не знайдено</h1>
          <p className="text-gray-500 mb-7 leading-relaxed">Цей квітковий магазин не існує або був видалений.</p>
          <a href="/" className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-7 py-3.5 rounded-2xl font-bold shadow-lg">← FlowerGoUa</a>
        </div>
      </div>
    )
  }

  const primary = shop.primaryColor || '#ec4899'
  const accent = shop.accentColor || '#a855f7'
  const layout = shop.layoutStyle || 'classic'
  const currencySymbol = shop.currency === 'UAH' ? '₴' : shop.currency === 'EUR' ? '€' : shop.currency === 'GBP' ? '£' : '$'
  const estimatedDelivery = getEstimatedDelivery()
  const hoursDisplay = getWorkingHoursDisplay()

  return (
    <main className="min-h-screen bg-gray-50" style={{ paddingBottom: 'max(100px, calc(80px + env(safe-area-inset-bottom, 0px)))' }}>
      <style>{`
        :root { --primary: ${primary}; --accent: ${accent}; }
        .btn-primary { background: linear-gradient(135deg, ${primary}, ${accent}); }
        .btn-primary:hover { filter: brightness(0.92); transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .text-primary { color: ${primary}; }
        .border-primary { border-color: ${primary}; }
        .bg-primary-light { background-color: ${primary}18; }
        .ring-primary { --tw-ring-color: ${primary}; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        .anim-fade { animation: fadeInUp 0.5s ease-out both; }
        .anim-slide { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-delay-1 { animation-delay: 0.1s; }
        .anim-delay-2 { animation-delay: 0.2s; }
        .anim-delay-3 { animation-delay: 0.3s; }
        .card-hover { transition: box-shadow 0.2s, transform 0.2s; }
        .card-hover:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.12); transform: translateY(-2px); }
        @media (max-width: 640px) { .card-hover:hover { transform: none; } }
      `}</style>

      {/* ===== COVER / HEADER ===== */}
      <div className="relative">
        <div className="relative overflow-hidden" style={{ height: 'clamp(220px, 45vw, 380px)', background: `linear-gradient(135deg, ${primary}cc, ${accent}cc)` }}>
          {shop.coverImageUrl ? (
            <Image src={shop.coverImageUrl} alt={shop.name} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="text-8xl">🌸</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Shop info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-5">
          <div className="max-w-4xl mx-auto flex items-end gap-4">
            {/* Logo */}
            <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-2xl shadow-2xl flex items-center justify-center flex-shrink-0 border-[3px] border-white overflow-hidden">
              {shop.logoUrl ? (
                <Image src={shop.logoUrl} alt="Логотип" width={112} height={112} className="object-cover w-full h-full" />
              ) : (
                <span className="text-3xl md:text-4xl font-black" style={{ color: primary }}>
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 pb-1">
              <h1 className="text-2xl md:text-4xl font-black text-white mb-2 drop-shadow-lg leading-tight">{shop.name}</h1>
              <div className="flex flex-wrap gap-2">
                {shop.showLocation && shop.location && (
                  <button onClick={openGoogleMaps}
                    className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium hover:bg-white/30 transition-all active:scale-95">
                    📍 {shop.location}
                  </button>
                )}
                {hoursDisplay && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium">
                    🕐 {hoursDisplay}
                  </div>
                )}
              </div>
            </div>

            {/* Cart badge */}
            {cartCount > 0 && (
              <div className="pb-1">
                <div className="relative bg-white/25 backdrop-blur-sm p-2.5 rounded-full border border-white/30">
                  <span className="text-xl">🛒</span>
                  <span className="absolute -top-1 -right-1 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg" style={{ background: primary }}>
                    {cartCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== ABOUT ===== */}
      {shop.about && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
            <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">{shop.about}</p>
          </div>
        </div>
      )}

      {/* ===== CUSTOM BOUQUET BANNER ===== */}
      {shop.allowCustomBouquet && (
        <div className="mx-4 md:mx-auto md:max-w-4xl mt-4 rounded-2xl overflow-hidden shadow-md" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
          <div className="px-5 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎨</span>
                <h2 className="text-lg font-black text-white">Власний букет</h2>
              </div>
              <p className="text-white/85 text-sm">Оберіть квіти й обгортку на власний смак</p>
            </div>
            <a href={`/${shop.slug}/custom-bouquet`}
              className="flex-shrink-0 bg-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
              style={{ color: accent }}>
              Створити →
            </a>
          </div>
        </div>
      )}

      {/* ===== CATALOG ===== */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900">Букети в наявності</h2>
            <p className="text-sm text-gray-400 mt-0.5">{shop.flowers.length} букетів в наявності</p>
          </div>
          <a href={`/${shop.slug}/track-order`}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl border-2 transition-all active:scale-95 hover:shadow-sm"
            style={{ color: primary, borderColor: `${primary}40`, background: `${primary}08` }}>
            📦 Моє замовлення
          </a>
        </div>

        {shop.flowers.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Букетів поки немає</h3>
            <p className="text-gray-500 text-sm">Заходьте пізніше — скоро з'являться нові композиції!</p>
          </div>
        ) : layout === 'list' ? (
          // ── LIST layout ──────────────────────────────────────────
          <div className="space-y-3">
            {shop.flowers.map((flower, idx) => {
              const badge = getBadgeLabel(flower.createdAt)
              const isUnavailable = flower.availability === 'out_of_stock'
              return (
                <div key={flower.id}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex items-center gap-4 p-3 anim-fade ${isUnavailable ? 'opacity-60' : 'card-hover'}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}>
                  {/* Thumb */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primary}18, ${accent}18)` }}>
                    {flower.imageUrl
                      ? <Image src={flower.imageUrl} alt={flower.name} fill className="object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center text-3xl">🌸</div>}
                    {isUnavailable && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><span className="text-white text-xs font-bold">Немає</span></div>}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-gray-900 text-base">{flower.name}</h3>
                      {flower.availability === 'limited' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Мало</span>}
                    </div>
                    {flower.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{flower.description}</p>}
                  </div>
                  {/* Price + button */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xl font-black" style={{ color: primary }}>{currencySymbol}{flower.price.toFixed(0)}</span>
                    <button onClick={() => !isUnavailable && handleOrder(flower)} disabled={isUnavailable}
                      className="btn-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm disabled:opacity-40 active:scale-95">
                      {isUnavailable ? '—' : 'Замовити'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // ── GRID layouts: classic / modern / bold ────────────────
          <div className={`grid gap-4 md:gap-5 ${
            layout === 'bold' ? 'grid-cols-1' :
            layout === 'modern' ? 'grid-cols-2 sm:grid-cols-2' :
            'grid-cols-2 sm:grid-cols-2 xl:grid-cols-3'
          }`}>
            {shop.flowers.map((flower, idx) => {
              const badge = getBadgeLabel(flower.createdAt)
              const isUnavailable = flower.availability === 'out_of_stock'
              const imgHeight = layout === 'bold' ? '320px' : layout === 'modern' ? '180px' : '160px'
              return (
                <div key={flower.id}
                  className={`bg-white rounded-3xl shadow-sm overflow-hidden card-hover anim-fade border border-gray-100 ${isUnavailable ? 'opacity-60' : ''}`}
                  style={{ animationDelay: `${idx * 0.06}s` }}>
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ height: imgHeight, background: `linear-gradient(135deg, ${primary}18, ${accent}18)` }}>
                    {flower.imageUrl ? (
                      <Image src={flower.imageUrl} alt={flower.name} fill
                        className={`object-cover ${shop.enableAnimations && !isUnavailable ? 'hover:scale-105 transition-transform duration-500' : ''}`} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={layout === 'bold' ? 'text-9xl' : 'text-7xl'}>🌸</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <span className={`${badge.color} text-xs font-bold px-2.5 py-1 rounded-full shadow-sm`}>{badge.label}</span>
                      {flower.availability === 'limited' && <span className="bg-amber-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">Мало</span>}
                      {isUnavailable && <span className="bg-gray-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">Немає</span>}
                    </div>
                    {/* Bold: overlay price */}
                    {layout === 'bold' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-10">
                        <h3 className="text-2xl font-black text-white mb-1">{flower.name}</h3>
                        {flower.description && <p className="text-sm text-white/80 line-clamp-1">{flower.description}</p>}
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className={`p-3 md:p-4 ${layout === 'bold' ? 'flex items-center justify-between' : ''}`}>
                    {layout !== 'bold' && (
                      <>
                        <h3 className="text-sm md:text-lg font-black text-gray-900 mb-1 leading-snug line-clamp-2">{flower.name}</h3>
                        {flower.description && <p className="hidden md:block text-sm text-gray-500 mb-3 leading-relaxed line-clamp-2">{flower.description}</p>}
                      </>
                    )}
                    <div className={`flex items-center justify-between gap-1.5 md:gap-3 ${layout !== 'bold' ? 'mt-2 md:mt-3' : ''}`}>
                      <div className={`font-black ${layout === 'bold' ? 'text-3xl' : 'text-base md:text-2xl'}`} style={{ color: primary }}>
                        {currencySymbol}{flower.price.toFixed(0)}
                      </div>
                      <button onClick={() => !isUnavailable && handleOrder(flower)} disabled={isUnavailable}
                        className={`btn-primary text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex-shrink-0 text-xs md:text-sm ${
                          layout === 'bold' ? 'px-8 py-4 text-base' : 'px-3 py-2 md:px-5 md:py-3'
                        }`}>
                        {isUnavailable ? 'Немає' : 'Замовити'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== DELIVERY INFO ===== */}
      {(shop.sameDayDelivery || (shop.deliveryZones && shop.deliveryZones.length > 0)) && shop.showDeliveryEstimate && (
        <div className="bg-white border-y border-gray-100 mt-2">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-7">
            <h2 className="text-xl font-black text-gray-900 mb-5">🚚 Доставка</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {shop.sameDayDelivery && (
                <div className="rounded-2xl p-5 border-2" style={{ background: `${primary}0d`, borderColor: `${primary}30` }}>
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">Доставка в день замовлення</h3>
                  <p className="text-xs text-gray-500">Замовляйте до {shop.deliveryCutoffTime || '14:00'}</p>
                </div>
              )}
              {shop.deliveryTimeEstimate && (
                <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-100">
                  <div className="text-2xl mb-2">⏱️</div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">Час доставки</h3>
                  <p className="text-xs text-gray-500">{shop.deliveryTimeEstimate}</p>
                </div>
              )}
              {shop.minimumOrderAmount && shop.minimumOrderAmount > 0 && (
                <div className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-100">
                  <div className="text-2xl mb-2">🛒</div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">Мінімальне замовлення</h3>
                  <p className="text-xs text-gray-500">{currencySymbol}{shop.minimumOrderAmount}</p>
                </div>
              )}
              {shop.deliveryZones && shop.deliveryZones.length > 0 && (
                <div className="bg-purple-50 rounded-2xl p-5 border-2 border-purple-100 sm:col-span-2 md:col-span-1">
                  <div className="text-2xl mb-2">🗺️</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">Зони доставки</h3>
                  <div className="space-y-1.5">
                    {shop.deliveryZones.slice(0, 5).map((zone, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{zone.name}</span>
                        <span className="font-bold text-gray-900">{currencySymbol}{zone.fee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CONTACT ===== */}
      {(shop.showPhone || shop.showWhatsapp || shop.showTelegram || shop.showInstagram || shop.showEmail || (shop.showLocation && shop.location)) && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-7">
          <h2 className="text-xl font-black text-gray-900 mb-5">📞 Зв'язатися</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shop.showPhone && shop.phoneNumber && (
              <a href={`tel:${shop.phoneNumber}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all hover:shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">📞</div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Подзвонити</div>
                  <div className="text-sm font-bold text-gray-900">{shop.phoneNumber}</div>
                </div>
              </a>
            )}
            {shop.showWhatsapp && shop.whatsappNumber && (
              <a href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#e7fce9' }}>💬</div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">WhatsApp</div>
                  <div className="text-sm font-bold text-gray-900">Написати</div>
                </div>
              </a>
            )}
            {shop.showTelegram && shop.telegramHandle && (
              <a href={`https://t.me/${shop.telegramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#e3f2fd' }}>✈️</div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Telegram</div>
                  <div className="text-sm font-bold text-gray-900">{shop.telegramHandle}</div>
                </div>
              </a>
            )}
            {shop.showInstagram && shop.instagramHandle && (
              <a href={`https://instagram.com/${shop.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#fce4ec' }}>📸</div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Instagram</div>
                  <div className="text-sm font-bold text-gray-900">{shop.instagramHandle}</div>
                </div>
              </a>
            )}
            {shop.showEmail && shop.email && (
              <a href={`mailto:${shop.email}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all hover:shadow-md">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">✉️</div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Email</div>
                  <div className="text-sm font-bold text-gray-900">{shop.email}</div>
                </div>
              </a>
            )}
            {shop.showLocation && shop.location && (
              <button onClick={openGoogleMaps}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all hover:shadow-md text-left w-full">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">📍</div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Адреса</div>
                  <div className="text-sm font-bold text-gray-900">{shop.location}</div>
                </div>
              </button>
            )}
          </div>

          {/* Working hours */}
          {shop.workingHours && (() => {
            try {
              const parsed = JSON.parse(shop.workingHours!)
              return (
                <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">🕐 Години роботи</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                      const h = parsed[day]
                      if (!h) return null
                      const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day
                      return (
                        <div key={day} className={`flex items-center justify-between text-xs py-0.5 ${isToday ? 'font-bold text-gray-900' : ''}`}>
                          <span className="text-gray-500">{DAYS_UA[day]}{isToday ? ' (сьогодні)' : ''}</span>
                          <span className={h.closed ? 'text-red-400' : 'text-gray-700'}>{h.closed ? 'Закрито' : `${h.open}–${h.close}`}</span>
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
            <div className="mt-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.location + (shop.city ? ', ' + shop.city : ''))}&output=embed`}
                width="100%" height="280" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div className="bg-gray-900 text-white mt-4">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <h3 className="font-black text-lg mb-1">{shop.name}</h3>
              <p className="text-sm text-gray-400">Квіти з любов'ю для вас</p>
            </div>
            <div className="flex items-center gap-3">
              {shop.showInstagram && shop.instagramHandle && (
                <a href={`https://instagram.com/${shop.instagramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors active:scale-90 text-xl">📸</a>
              )}
              {shop.showTelegram && shop.telegramHandle && (
                <a href={`https://t.me/${shop.telegramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors active:scale-90 text-xl">✈️</a>
              )}
              {shop.showWhatsapp && shop.whatsappNumber && (
                <a href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors active:scale-90 text-xl">💬</a>
              )}
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-500">© {new Date().getFullYear()} {shop.name}</span>
            <a href={`/${shop.slug}/track-order`} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 active:opacity-70">
              📦 Відстежити замовлення
            </a>
          </div>
        </div>
      </div>

      {/* ===== STICKY MOBILE ORDER BUTTON ===== */}
      {shop.flowers.length > 0 && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 pt-3 shadow-2xl sticky-bottom-bar">
          <button
            onClick={() => {
              const firstAvailable = shop.flowers.find(f => f.availability !== 'out_of_stock')
              if (firstAvailable) handleOrder(firstAvailable)
              else window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="btn-primary w-full text-white py-4 rounded-2xl font-black text-base shadow-lg active:scale-[0.98] transition-all"
          >
            🌸 Замовити букет
          </button>
        </div>
      )}

      {/* ===== ORDER MODAL ===== */}
      {showModal && selectedFlower && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white w-full max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden anim-slide" style={{ maxHeight: '92vh' }}>
            {/* Modal drag handle (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 20px)' }}>
              <div className="px-5 py-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Замовити</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedFlower.name} · <span className="font-bold" style={{ color: primary }}>{currencySymbol}{selectedFlower.price.toFixed(0)}</span></p>
                  </div>
                  <button onClick={closeModal} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors active:scale-90 text-lg">✕</button>
                </div>

                {/* Progress steps */}
                <div className="flex items-center gap-2 mb-6">
                  {(deliveryMethod === 'pickup' ? [1,2,4] : [1,2,3,4]).map((s) => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= currentStep ? 'opacity-100' : 'opacity-20'}`}
                      style={{ background: s <= currentStep ? `linear-gradient(to right, ${primary}, ${accent})` : '#e5e7eb' }} />
                  ))}
                </div>

                {/* SUCCESS */}
                {submitStatus === 'success' ? (
                  <div className="text-center py-8">
                    <div className="text-7xl mb-4">✅</div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Замовлення прийнято!</h3>
                    <p className="text-gray-500 mb-4">Ми зателефонуємо на <span className="font-bold text-gray-900">{formData.phone}</span> для підтвердження.</p>
                    {estimatedDelivery && deliveryMethod === 'delivery' && (
                      <p className="mb-4 text-sm text-green-700 bg-green-50 rounded-xl p-3">
                        🚚 Очікувана доставка: {estimatedDelivery}
                      </p>
                    )}
                    <a href={`/${shop?.slug}/track-order`}
                      className="block w-full py-3.5 rounded-2xl font-bold text-white shadow-md active:scale-[0.98] transition-all"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
                      📦 Відстежити замовлення
                    </a>
                    <p className="text-xs text-gray-400 mt-2">Введіть номер телефону щоб перевірити статус</p>
                  </div>
                ) : (
                  <>
                    {/* STEP 1: Delivery method */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900">Як отримати?</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { method: 'pickup' as const, icon: '🏪', title: 'Самовивіз', desc: shop.location || 'З магазину' },
                            { method: 'delivery' as const, icon: '🚚', title: 'Доставка', desc: shop.sameDayDelivery ? '⚡ В той же день' : 'Доставимо до вас' },
                          ].map(opt => (
                            <button key={opt.method} onClick={() => setDeliveryMethod(opt.method)}
                              className={`p-4 border-2 rounded-2xl transition-all text-left active:scale-95`}
                              style={deliveryMethod === opt.method ? { borderColor: primary, background: `${primary}0f` } : { borderColor: '#e5e7eb', background: '#fafafa' }}>
                              <div className="text-3xl mb-2">{opt.icon}</div>
                              <div className="font-bold text-gray-900 text-sm mb-0.5">{opt.title}</div>
                              <div className="text-xs text-gray-500 leading-snug">{opt.desc}</div>
                            </button>
                          ))}
                        </div>

                        {/* Delivery zones */}
                        {deliveryMethod === 'delivery' && shop.deliveryZones && shop.deliveryZones.length > 0 && (
                          <div>
                            <p className="text-sm font-bold text-gray-700 mb-2">Зона доставки</p>
                            <div className="space-y-2">
                              {shop.deliveryZones.map((zone, i) => (
                                <button key={i} onClick={() => setSelectedZone(zone)}
                                  className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-2xl transition-all text-sm active:scale-98`}
                                  style={selectedZone?.id === zone.id ? { borderColor: primary, background: `${primary}0f` } : { borderColor: '#e5e7eb' }}>
                                  <span className="font-medium text-gray-800">{zone.name}</span>
                                  <span className="font-bold" style={{ color: primary }}>{currencySymbol}{zone.fee}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button onClick={nextStep} disabled={!deliveryMethod || (deliveryMethod === 'delivery' && shop.deliveryZones?.length > 0 && !selectedZone)}
                          className="btn-primary w-full text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 shadow-md active:scale-[0.98]">
                          Продовжити →
                        </button>
                      </div>
                    )}

                    {/* STEP 2: Contact */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900">Ваші дані</h3>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ім'я та прізвище *</label>
                          <input type="text" inputMode="text" autoComplete="name" placeholder="Ірина Ковальчук"
                            value={formData.customerName}
                            onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 transition-colors bg-gray-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Номер телефону *</label>
                          <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 99 123 45 67"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 transition-colors bg-gray-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-gray-400 font-normal">(необов'язково)</span></label>
                          <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 transition-colors bg-gray-50" />
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95">← Назад</button>
                          <button onClick={nextStep} disabled={!formData.customerName || !formData.phone}
                            className="btn-primary flex-2 text-white px-8 py-4 rounded-2xl font-bold disabled:opacity-40 shadow-md active:scale-[0.98]">Далі →</button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Delivery address */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900">
                          {deliveryMethod === 'delivery' ? 'Адреса доставки' : 'Підтвердження самовивозу'}
                        </h3>

                        {deliveryMethod === 'delivery' ? (
                          <>
                            {estimatedDelivery && (
                              <div className="rounded-2xl p-4 flex items-center gap-3 border-2" style={{ background: `${primary}0d`, borderColor: `${primary}30` }}>
                                <span className="text-2xl">⏱️</span>
                                <div>
                                  <div className="text-xs font-semibold" style={{ color: primary }}>Очікувана доставка</div>
                                  <div className="text-sm font-bold text-gray-900">{estimatedDelivery}</div>
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Вулиця та будинок *</label>
                              <input type="text" inputMode="text" autoComplete="street-address" placeholder="вул. Хрещатик, 1"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 bg-gray-50" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Місто *</label>
                                <input type="text" inputMode="text" autoComplete="address-level2" placeholder="Київ"
                                  value={formData.city}
                                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 bg-gray-50" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Індекс</label>
                                <input type="text" inputMode="numeric" placeholder="01001"
                                  value={formData.zipCode}
                                  onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 bg-gray-50" />
                              </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                              <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95">← Назад</button>
                              <button onClick={nextStep} disabled={!formData.address || !formData.city}
                                className="btn-primary flex-2 text-white px-8 py-4 rounded-2xl font-bold disabled:opacity-40 shadow-md active:scale-[0.98]">Далі →</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-2xl p-5 border-2" style={{ background: `${primary}0d`, borderColor: `${primary}30` }}>
                              <p className="text-sm font-semibold mb-1" style={{ color: primary }}>🏪 Самовивіз за адресою:</p>
                              <p className="font-bold text-gray-900">{shop.location || shop.name}</p>
                            </div>
                            <div className="flex gap-3 pt-1">
                              <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95">← Назад</button>
                              <button onClick={nextStep} className="btn-primary flex-2 text-white px-8 py-4 rounded-2xl font-bold shadow-md active:scale-[0.98]">Далі →</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* STEP 4: Summary + message */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900">Ваше замовлення</h3>

                        {/* Summary card */}
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-sm border border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Букет</span>
                            <span className="font-bold text-gray-900">{selectedFlower.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Ціна</span>
                            <span className="text-lg font-black" style={{ color: primary }}>{currencySymbol}{selectedFlower.price.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Отримання</span>
                            <span className="font-medium">{deliveryMethod === 'pickup' ? '🏪 Самовивіз' : '🚚 Доставка'}</span>
                          </div>
                          {selectedZone && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Зона</span>
                              <span className="font-medium">{selectedZone.name} (+{currencySymbol}{selectedZone.fee})</span>
                            </div>
                          )}
                          {estimatedDelivery && deliveryMethod === 'delivery' && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Доставка</span>
                              <span className="font-medium text-blue-600">{estimatedDelivery}</span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                            <span className="text-gray-500">Контакт</span>
                            <span className="font-medium text-xs text-right">{formData.customerName} · {formData.phone}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Побажання <span className="text-gray-400 font-normal">(необов'язково)</span></label>
                          <textarea rows={3} value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-pink-400 bg-gray-50"
                            placeholder="Текст на листівку, зручний час доставки, особливі побажання..." />
                        </div>

                        {submitStatus === 'error' && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                            ❌ Не вдалося надіслати замовлення. Спробуйте ще раз.
                          </div>
                        )}

                        <div className="flex gap-3 pt-1">
                          <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95">← Назад</button>
                          <button onClick={handleSubmit} disabled={submitStatus === 'loading'}
                            className="btn-primary flex-2 text-white px-6 py-4 rounded-2xl font-bold shadow-lg disabled:opacity-50 active:scale-[0.98] text-base">
                            {submitStatus === 'loading' ? '⏳ Надсилаємо...' : '✅ Замовити'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Bottom padding */}
                <div className="h-4"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
