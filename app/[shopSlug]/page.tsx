'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

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
  // Visibility toggles
  showPhone: boolean
  showEmail: boolean
  showWhatsapp: boolean
  showTelegram: boolean
  showInstagram: boolean
  showLocation: boolean
  allowCustomBouquet: boolean
}

type OrderStep = 1 | 2 | 3 | 4

export default function ShopPage({ params }: { params: { shopSlug: string } }) {
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState<OrderStep>(1)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null)
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
      console.error('Failed to load shop')
    } finally {
      setLoading(false)
    }
  }

  const handleInquire = (flower: Flower) => {
    setSelectedFlower(flower)
    setShowModal(true)
    setCurrentStep(1)
    setDeliveryMethod(null)
    setSubmitStatus('idle')
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentStep(1)
    setDeliveryMethod(null)
    setFormData({ customerName: '', phone: '', email: '', address: '', city: '', zipCode: '', message: '' })
  }

  const nextStep = () => { if (currentStep < 4) setCurrentStep((currentStep + 1) as OrderStep) }
  const prevStep = () => { if (currentStep > 1) setCurrentStep((currentStep - 1) as OrderStep) }

  const getEstimatedDelivery = () => {
    if (!shop || deliveryMethod !== 'delivery') return null
    const currentHour = new Date().getHours()
    const cutoff = parseInt((shop.deliveryCutoffTime || '14:00').split(':')[0])
    if (shop.sameDayDelivery && currentHour < cutoff) {
      return shop.deliveryTimeEstimate || 'Today, 2–4 hours'
    }
    return 'Tomorrow, 10:00 AM – 2:00 PM'
  }

  const getWorkingHoursDisplay = (): string | null => {
    if (!shop?.workingHours) return null
    try {
      const parsed = JSON.parse(shop.workingHours)
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const todayHours = parsed[today]
      if (!todayHours) return null
      if (todayHours.closed) return 'Closed today'
      return `Today: ${todayHours.open} – ${todayHours.close}`
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

  const getFreshnessLabel = (createdAt: string) => {
    try {
      const daysAgo = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysAgo === 0) return { label: 'Fresh Today', color: 'text-green-600 bg-green-50' }
      if (daysAgo === 1) return { label: 'Made Yesterday', color: 'text-emerald-600 bg-emerald-50' }
      if (daysAgo <= 3) return { label: `${daysAgo} days ago`, color: 'text-blue-600 bg-blue-50' }
      return { label: formatDistanceToNow(new Date(createdAt), { addSuffix: true }), color: 'text-gray-600 bg-gray-50' }
    } catch {
      return { label: 'New', color: 'text-gray-600 bg-gray-50' }
    }
  }

  const handleSubmit = async () => {
    setSubmitStatus('loading')
    const estimatedDelivery = getEstimatedDelivery()
    const orderMessage = [
      deliveryMethod === 'pickup' ? '🏪 PICKUP' : '🚚 DELIVERY',
      `Flower: ${selectedFlower?.name}`,
      '',
      'Contact:',
      formData.customerName,
      formData.phone,
      formData.email,
      deliveryMethod === 'delivery' ? `\nDelivery Address:\n${formData.address}\n${formData.city}, ${formData.zipCode}\n⏱️ Estimated: ${estimatedDelivery}` : '',
      formData.message ? `\nSpecial Message:\n${formData.message}` : '',
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
        setTimeout(closeModal, 3000)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop...</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Магазин не знайдено</h1>
          <p className="text-gray-500 mb-6">Цей квітковий магазин не існує або був видалений.</p>
          <a href="/" className="inline-block bg-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-600 transition-colors">← FlowerGoUa</a>
        </div>
      </div>
    )
  }

  const primary = shop.primaryColor || '#ec4899'
  const accent = shop.accentColor || '#a855f7'
  const currencySymbol = shop.currency === 'UAH' ? '₴' : shop.currency === 'EUR' ? '€' : shop.currency === 'GBP' ? '£' : '$'
  const estimatedDelivery = getEstimatedDelivery()
  const hoursDisplay = getWorkingHoursDisplay()

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50/30">
      <style>{`
        :root {
          --primary: ${primary};
          --accent: ${accent};
        }
        .btn-primary { background: linear-gradient(to right, ${primary}, ${accent}); }
        .btn-primary:hover { filter: brightness(0.9); }
        .text-primary { color: ${primary}; }
        .border-primary { border-color: ${primary}; }
        .bg-primary-light { background-color: ${primary}22; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      `}</style>

      {/* ===== COVER / HEADER ===== */}
      <div className="relative">
        <div className="relative h-80 md:h-96 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}88, ${accent}88)` }}>
          {shop.coverImageUrl ? (
            <Image src={shop.coverImageUrl} alt={shop.name} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-5xl font-bold text-white/30">{shop.name}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end gap-6">
              {/* Logo / Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-2xl flex items-center justify-center flex-shrink-0 border-4 border-white overflow-hidden">
                {shop.logoUrl ? (
                  <Image src={shop.logoUrl} alt="Logo" width={128} height={128} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-4xl md:text-5xl font-bold" style={{ color: primary }}>
                    {shop.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 pb-2">
                <h1 className="text-3xl md:text-5xl font-bold mb-2 drop-shadow-lg">{shop.name}</h1>
                <div className="flex flex-wrap gap-3 text-sm">
                  {shop.showLocation && shop.location && (
                    <button onClick={openGoogleMaps}
                      className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
                      <span>📍</span> {shop.location}
                    </button>
                  )}
                  {hoursDisplay && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <span>🕐</span> {hoursDisplay}
                    </div>
                  )}
                </div>
              </div>

              {cartCount > 0 && (
                <div className="pb-2">
                  <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-full">
                    <span className="text-xl">🛒</span>
                    <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ background: primary }}>
                      {cartCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== ABOUT ===== */}
      {shop.about && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${primary}22` }}>
                <span className="text-xl">ℹ️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">About Us</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{shop.about}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CUSTOM BOUQUET BANNER ===== */}
      {shop.allowCustomBouquet && (
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(to right, ${accent}, ${primary})` }}>
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fadeIn">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="text-4xl">🎨</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Create Your Custom Bouquet</h2>
                </div>
                <p className="text-white/90 text-sm md:text-base">Choose your own flowers, wrapping, and create something unique</p>
              </div>
              <a href={`/${shop.slug}/custom-bouquet`}
                className="group bg-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-xl whitespace-nowrap transform hover:scale-105 duration-300"
                style={{ color: accent }}>
                Start Creating →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===== FLOWER CATALOG ===== */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Flower Collection</h2>
          <p className="text-gray-600">{shop.flowers.length} bouquets available</p>
        </div>

        {shop.flowers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🌸</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No flowers available yet</h3>
            <p className="text-gray-500">Check back soon for beautiful new arrangements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shop.flowers.map(flower => {
              const freshness = getFreshnessLabel(flower.createdAt)
              return (
                <div key={flower.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="relative h-64 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}22, ${accent}22)` }}>
                    {flower.imageUrl ? (
                      <Image src={flower.imageUrl} alt={flower.name} fill className={`object-cover ${shop.enableAnimations ? 'group-hover:scale-110 transition-transform duration-500' : ''}`} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl">🌸</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <span className={`${freshness.color} text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg`}>
                        ✨ {freshness.label}
                      </span>
                      {flower.availability === 'limited' && (
                        <span className="bg-yellow-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                          Limited
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{flower.name}</h3>
                    {flower.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{flower.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mb-4">
                      Made on {new Date(flower.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold" style={{ color: primary }}>
                        {currencySymbol}{flower.price.toFixed(2)}
                      </div>
                      <button onClick={() => handleInquire(flower)}
                        className="btn-primary text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== DELIVERY SECTION ===== */}
      {(shop.sameDayDelivery || (shop.deliveryZones && shop.deliveryZones.length > 0)) && shop.showDeliveryEstimate && (
        <div className="bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🚚 Delivery Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shop.sameDayDelivery && (
                <div className="rounded-xl p-6 border-2" style={{ background: `${primary}11`, borderColor: `${primary}44` }}>
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-bold text-gray-900 mb-2">Same-Day Delivery</h3>
                  <p className="text-sm text-gray-600">Order before {shop.deliveryCutoffTime || '14:00'} for same-day delivery</p>
                </div>
              )}
              {shop.deliveryTimeEstimate && (
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-3xl mb-3">⏱️</div>
                  <h3 className="font-bold text-gray-900 mb-2">Estimated Time</h3>
                  <p className="text-sm text-gray-600">{shop.deliveryTimeEstimate}</p>
                </div>
              )}
              {shop.minimumOrderAmount && shop.minimumOrderAmount > 0 ? (
                <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                  <div className="text-3xl mb-3">🛒</div>
                  <h3 className="font-bold text-gray-900 mb-2">Minimum Order</h3>
                  <p className="text-sm text-gray-600">{currencySymbol}{shop.minimumOrderAmount} minimum</p>
                </div>
              ) : (
                shop.deliveryZones && shop.deliveryZones.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="text-3xl mb-3">🗺️</div>
                    <h3 className="font-bold text-gray-900 mb-2">Delivery Zones</h3>
                    <div className="space-y-1">
                      {shop.deliveryZones.slice(0, 4).map((zone, i) => (
                        <div key={i} className="text-xs text-gray-600 flex items-center justify-between">
                          <span>{zone.name}</span>
                          <span className="font-semibold">{currencySymbol}{zone.fee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CONTACT SECTION ===== */}
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📞 Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shop.showLocation && shop.location && (
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">📍 Visit Us</h3>
                <p className="text-sm text-gray-600 mb-3">{shop.location}{shop.city ? `, ${shop.city}` : ''}</p>
                <button onClick={openGoogleMaps} className="text-sm font-medium" style={{ color: primary }}>
                  Get Directions →
                </button>
              </div>
            )}

            {shop.workingHours && (
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-3">🕐 Working Hours</h3>
                {(() => {
                  try {
                    const parsed = JSON.parse(shop.workingHours!)
                    return (
                      <div className="space-y-1">
                        {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                          const h = parsed[day]
                          if (!h) return null
                          return (
                            <div key={day} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 capitalize">{day.slice(0,3)}</span>
                              <span className={`font-medium ${h.closed ? 'text-red-400' : 'text-gray-700'}`}>
                                {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  } catch {
                    return <p className="text-sm text-gray-600">{shop.workingHours}</p>
                  }
                })()}
              </div>
            )}

            {(shop.showPhone || shop.showWhatsapp || shop.showTelegram || shop.showInstagram || shop.showEmail) && (
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-4">💬 Quick Contact</h3>
                <div className="space-y-2">
                  {shop.showPhone && shop.phoneNumber && (
                    <a href={`tel:${shop.phoneNumber}`} className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">📞</div>
                      <div>
                        <div className="text-xs text-gray-500">Call</div>
                        <div className="text-sm font-medium text-gray-900">{shop.phoneNumber}</div>
                      </div>
                    </a>
                  )}
                  {shop.showWhatsapp && shop.whatsappNumber && (
                    <a href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: '#25D366' }}>💬</div>
                      <div>
                        <div className="text-xs text-gray-500">WhatsApp</div>
                        <div className="text-sm font-medium text-gray-900">Message Us</div>
                      </div>
                    </a>
                  )}
                  {shop.showTelegram && shop.telegramHandle && (
                    <a href={`https://t.me/${shop.telegramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: '#0088cc' }}>✈️</div>
                      <div>
                        <div className="text-xs text-gray-500">Telegram</div>
                        <div className="text-sm font-medium text-gray-900">{shop.telegramHandle}</div>
                      </div>
                    </a>
                  )}
                  {shop.showInstagram && shop.instagramHandle && (
                    <a href={`https://instagram.com/${shop.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>📸</div>
                      <div>
                        <div className="text-xs text-gray-500">Instagram</div>
                        <div className="text-sm font-medium text-gray-900">{shop.instagramHandle}</div>
                      </div>
                    </a>
                  )}
                  {shop.showEmail && shop.email && (
                    <a href={`mailto:${shop.email}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center text-white text-sm">✉️</div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-sm font-medium text-gray-900">{shop.email}</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {shop.showLocation && shop.location && (
            <div className="mt-8 rounded-2xl overflow-hidden shadow-lg">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.location + (shop.city ? ', ' + shop.city : ''))}&output=embed`}
                width="100%" height="400" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1">{shop.name}</h3>
              <p className="text-sm text-gray-400">Beautiful flowers for every occasion</p>
            </div>
            <div className="flex items-center gap-3">
              {shop.showInstagram && shop.instagramHandle && (
                <a href={`https://instagram.com/${shop.instagramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  📸
                </a>
              )}
              {shop.showTelegram && shop.telegramHandle && (
                <a href={`https://t.me/${shop.telegramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  ✈️
                </a>
              )}
              {shop.showWhatsapp && shop.whatsappNumber && (
                <a href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  💬
                </a>
              )}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} {shop.name} · Powered by Flower Shop Platform
          </div>
        </div>
      </div>

      {/* ===== ORDER MODAL ===== */}
      {showModal && selectedFlower && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 relative my-8">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Order {selectedFlower.name}</h2>
                <span className="text-sm text-gray-400">Step {currentStep}/4</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(currentStep/4)*100}%`, background: `linear-gradient(to right, ${primary}, ${accent})` }} />
              </div>
            </div>

            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Order Placed!</h3>
                <p className="text-green-700">We'll contact you at {formData.phone} to confirm.</p>
                {estimatedDelivery && deliveryMethod === 'delivery' && (
                  <p className="mt-3 text-sm text-green-600 bg-green-50 rounded-lg p-3 inline-block">
                    🚚 Estimated: {estimatedDelivery}
                  </p>
                )}
              </div>
            ) : (
              <>
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">How would you like to receive your flowers?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { method: 'pickup' as const, icon: '🏪', title: 'Store Pickup', desc: 'Pick up at our store', extra: shop.location ? `📍 ${shop.location}` : undefined },
                        { method: 'delivery' as const, icon: '🚚', title: 'Home Delivery', desc: 'Delivered to your address', extra: shop.sameDayDelivery ? '⚡ Same-day available' : undefined },
                      ].map(opt => (
                        <button key={opt.method} onClick={() => setDeliveryMethod(opt.method)}
                          className={`p-6 border-2 rounded-xl transition-all text-left`}
                          style={deliveryMethod === opt.method ? { borderColor: primary, background: `${primary}11` } : { borderColor: '#e5e7eb' }}>
                          <div className="text-4xl mb-3">{opt.icon}</div>
                          <h4 className="font-bold text-gray-900 mb-2">{opt.title}</h4>
                          <p className="text-sm text-gray-600">{opt.desc}</p>
                          {opt.extra && <p className="text-xs text-gray-400 mt-2">{opt.extra}</p>}
                        </button>
                      ))}
                    </div>
                    <button onClick={nextStep} disabled={!deliveryMethod}
                      className="btn-primary w-full text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-all">
                      Continue
                    </button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Contact Information</h3>
                    {[
                      { key: 'customerName', label: 'Full Name *', type: 'text', placeholder: 'John Doe', required: true },
                      { key: 'phone', label: 'Phone Number *', type: 'tel', placeholder: '+380 99 123 4567', required: true },
                      { key: 'email', label: 'Email (Optional)', type: 'email', placeholder: 'john@example.com', required: false },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder}
                          value={(formData as any)[f.key]}
                          onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none text-sm"
                          style={{ outlineColor: primary }} />
                      </div>
                    ))}
                    <div className="flex gap-3 pt-2">
                      <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">Back</button>
                      <button onClick={nextStep} disabled={!formData.customerName || !formData.phone}
                        className="btn-primary flex-1 text-white py-3 rounded-xl font-semibold disabled:opacity-50">Continue</button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {deliveryMethod === 'delivery' ? 'Delivery Address' : 'Pickup Confirmation'}
                    </h3>

                    {deliveryMethod === 'delivery' ? (
                      <>
                        {estimatedDelivery && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                            <span className="text-2xl">⏱️</span>
                            <div>
                              <div className="text-xs text-blue-600 font-medium">Estimated Delivery</div>
                              <div className="text-sm font-bold text-blue-900">{estimatedDelivery}</div>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                          <input type="text" placeholder="123 Main St" value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input type="text" placeholder="Kyiv" value={formData.city}
                              onChange={e => setFormData({ ...formData, city: e.target.value })}
                              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                            <input type="text" placeholder="01001" value={formData.zipCode}
                              onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none" />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">Back</button>
                          <button onClick={nextStep} disabled={!formData.address || !formData.city}
                            className="btn-primary flex-1 text-white py-3 rounded-xl font-semibold disabled:opacity-50">Continue</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-xl p-4" style={{ background: `${primary}11`, border: `1px solid ${primary}44` }}>
                          <p className="text-sm mb-1" style={{ color: primary }}>🏪 Store Pickup at:</p>
                          <p className="font-semibold text-gray-900">{shop.location || shop.name}</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">Back</button>
                          <button onClick={nextStep} className="btn-primary flex-1 text-white py-3 rounded-xl font-semibold">Continue</button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Final Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Message or Instructions (Optional)</label>
                      <textarea rows={4} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none"
                        placeholder="Special requests, preferred delivery time, card message..." />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <h4 className="font-bold text-gray-900">Order Summary</h4>
                      <div className="flex justify-between"><span className="text-gray-500">Item:</span><span className="font-medium">{selectedFlower.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Price:</span><span className="font-bold" style={{ color: primary }}>{currencySymbol}{selectedFlower.price.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Method:</span><span>{deliveryMethod === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}</span></div>
                      {estimatedDelivery && deliveryMethod === 'delivery' && (
                        <div className="flex justify-between"><span className="text-gray-500">ETA:</span><span className="text-blue-600">{estimatedDelivery}</span></div>
                      )}
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between"><span className="text-gray-500">Contact:</span><span>{formData.customerName} · {formData.phone}</span></div>
                      </div>
                    </div>

                    {submitStatus === 'error' && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">Failed to place order. Please try again.</div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button onClick={prevStep} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">Back</button>
                      <button onClick={handleSubmit} disabled={submitStatus === 'loading'}
                        className="btn-primary flex-1 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50">
                        {submitStatus === 'loading' ? 'Placing...' : 'Place Order 🌸'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
