'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { UA_CITIES } from '@/lib/cities'

interface ShopCard {
  id: string
  name: string
  slug: string
  city: string | null
  country: string | null
  location: string | null
  about: string | null
  coverImageUrl: string | null
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  phoneNumber: string | null
  showPhone: boolean
  instagramHandle: string | null
  showInstagram: boolean
  telegramHandle: string | null
  showTelegram: boolean
  workingHours: string | null
  deliveryTimeEstimate: string | null
  sameDayDelivery: boolean
  minimumOrderAmount: number | null
  currency: string
  plan: { slug: string }
  flowers: { id: string; name: string; price: number; imageUrl: string | null }[]
  _count: { flowers: number; orders: number }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStars(completedOrders: number): number {
  // Derive a rating from completed orders (capped at 5.0)
  if (completedOrders === 0) return 4.0
  if (completedOrders < 5)  return 4.2
  if (completedOrders < 15) return 4.5
  if (completedOrders < 30) return 4.7
  return 4.9
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const half  = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} className="text-amber-400 text-sm">★</span>)}
      {half && <span className="text-amber-400 text-sm">½</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-gray-300 text-sm">★</span>)}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

function isOpenNow(workingHoursJson: string | null): { open: boolean; label: string } {
  if (!workingHoursJson) return { open: false, label: 'Години не вказані' }
  try {
    const hours = JSON.parse(workingHoursJson)
    const now   = new Date()
    const days  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const today = days[now.getDay()]
    const day   = hours[today]
    if (!day || day.closed) return { open: false, label: 'Зачинено сьогодні' }
    const [oh, om] = day.open.split(':').map(Number)
    const [ch, cm] = day.close.split(':').map(Number)
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const openMins  = oh * 60 + om
    const closeMins = ch * 60 + cm
    const isOpen = nowMins >= openMins && nowMins < closeMins
    return {
      open: isOpen,
      label: isOpen
        ? `Відкрито · до ${day.close}`
        : `Зачинено · відкривається ${day.open}`,
    }
  } catch {
    return { open: false, label: '' }
  }
}

function currencySymbol(currency: string) {
  return currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ShopsPage() {
  const [shops,       setShops]       = useState<ShopCard[]>([])
  const [cities,      setCities]      = useState<string[]>([])
  const [selectedCity,setSelectedCity] = useState<string>('all')
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  const fetchShops = useCallback(async (city: string) => {
    setLoading(true)
    setError('')
    try {
      const params = city !== 'all' ? `?city=${encodeURIComponent(city)}` : ''
      const res  = await fetch(`/api/shops-directory${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка завантаження')
      setShops(data.shops || [])
      setCities(data.cities || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchShops('all') }, [fetchShops])

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    fetchShops(city)
  }

  const filtered = shops.filter(s =>
    search.trim() === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.about || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">

      {/* ── Hero header ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              🌸 FlowerGoUa
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Квіткові магазини України
          </h1>
          <p className="text-gray-500 text-lg mb-6">
            Знайдіть квіткову крамницю у вашому місті, перегляньте асортимент та зробіть замовлення
          </p>

          {/* Search + City Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Пошук магазину..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div className="relative sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
              <select
                value={selectedCity}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-sm transition-all bg-white appearance-none"
              >
                <option value="all">Всі міста</option>
                {/* Cities from DB first */}
                {cities.length > 0 && (
                  <>
                    <option disabled>── Активні міста ──</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </>
                )}
                {/* Full UA cities list */}
                <option disabled>── Всі міста ──</option>
                {UA_CITIES.filter(c => !cities.includes(c)).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats bar */}
          {!loading && (
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <span>
                <strong className="text-gray-900">{filtered.length}</strong>{' '}
                {filtered.length === 1 ? 'магазин' : filtered.length < 5 ? 'магазини' : 'магазинів'}
                {selectedCity !== 'all' ? ` у місті ${selectedCity}` : ' по Україні'}
              </span>
              {cities.length > 0 && (
                <span>
                  <strong className="text-gray-900">{cities.length}</strong> міст
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* City pills */}
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => handleCityChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCity === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600'
              }`}
            >
              🌍 Всі міста
            </button>
            {cities.map(city => (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCity === city
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600'
                }`}
              >
                📍 {city}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4" />
            <p className="text-gray-400 font-medium">Завантажуємо магазини...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🌸</div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              {selectedCity !== 'all'
                ? `У місті ${selectedCity} магазинів поки немає`
                : 'Магазинів не знайдено'}
            </h2>
            <p className="text-gray-400 mb-6">
              {search ? 'Спробуйте інший пошуковий запит або оберіть інше місто' : 'Спробуйте обрати інше місто'}
            </p>
            <button
              onClick={() => { setSearch(''); handleCityChange('all') }}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-md"
            >
              Показати всі магазини
            </button>
          </div>
        )}

        {/* Shop cards grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(shop => <ShopCard key={shop.id} shop={shop} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-400">
          <Link href="/" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            🌸 FlowerGoUa
          </Link>
          {' — '} платформа для квіткових магазинів України
        </div>
      </div>
    </div>
  )
}

// ── Individual shop card ──────────────────────────────────────────────────────

function ShopCard({ shop }: { shop: ShopCard }) {
  const rating      = getStars(shop._count.orders)
  const status      = isOpenNow(shop.workingHours)
  const primary     = shop.primaryColor || '#ec4899'
  const accent      = shop.accentColor  || '#a855f7'
  const sym         = currencySymbol(shop.currency)
  const flowerCount = shop._count.flowers
  const firstFlower = shop.flowers[0]

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col">

      {/* Cover / gradient header */}
      <div className="relative h-40 overflow-hidden flex-shrink-0">
        {shop.coverImageUrl ? (
          <Image
            src={shop.coverImageUrl}
            alt={shop.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${primary}22, ${accent}33)` }}
          >
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
              🌸
            </div>
          </div>
        )}

        {/* Open/closed badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
            status.open
              ? 'bg-green-500 text-white'
              : 'bg-white/90 text-gray-600'
          }`}>
            {status.open ? '● Відкрито' : '● Зачинено'}
          </span>
        </div>

        {/* Logo overlay */}
        {shop.logoUrl && (
          <div className="absolute bottom-3 left-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
              <Image src={shop.logoUrl} alt="logo" width={40} height={40} className="object-cover" />
            </div>
          </div>
        )}

        {/* Same-day delivery badge */}
        {shop.sameDayDelivery && (
          <div className="absolute bottom-3 right-3">
            <span className="text-xs font-bold px-2 py-1 bg-amber-400 text-white rounded-full shadow-sm">
              ⚡ Того ж дня
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">

        {/* Name + rating */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-pink-600 transition-colors">
            {shop.name}
          </h3>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <StarRating rating={rating} />
          {shop._count.orders > 0 && (
            <span className="text-xs text-gray-400">{shop._count.orders} замовлень</span>
          )}
        </div>

        {/* City */}
        {(shop.city || shop.location) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <span>📍</span>
            <span>{[shop.location, shop.city, shop.country].filter(Boolean).join(', ')}</span>
          </div>
        )}

        {/* About */}
        {shop.about && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
            {shop.about}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          {flowerCount > 0 && (
            <span className="flex items-center gap-1">
              <span>🌷</span>
              <strong className="text-gray-700">{flowerCount}</strong> букетів
            </span>
          )}
          {shop.deliveryTimeEstimate && (
            <span className="flex items-center gap-1">
              <span>🚚</span>
              {shop.deliveryTimeEstimate}
            </span>
          )}
          {shop.minimumOrderAmount && shop.minimumOrderAmount > 0 ? (
            <span className="flex items-center gap-1">
              <span>🛒</span>
              від {sym}{shop.minimumOrderAmount}
            </span>
          ) : null}
        </div>

        {/* Flower preview */}
        {shop.flowers.length > 0 && (
          <div className="flex gap-2 mb-4">
            {shop.flowers.slice(0, 3).map(f => (
              <div key={f.id} className="flex-1 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative" style={{ height: 72 }}>
                {f.imageUrl ? (
                  <Image src={f.imageUrl} alt={f.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs font-bold px-1 py-0.5 truncate text-center">
                  {sym}{f.price}
                </div>
              </div>
            ))}
            {shop._count.flowers > 3 && (
              <div className="flex-shrink-0 w-16 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                +{shop._count.flowers - 3}
              </div>
            )}
          </div>
        )}

        {/* Social links */}
        <div className="flex items-center gap-2 mb-4">
          {shop.showPhone && shop.phoneNumber && (
            <a href={`tel:${shop.phoneNumber}`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              📞 Дзвонити
            </a>
          )}
          {shop.showInstagram && shop.instagramHandle && (
            <a href={`https://instagram.com/${shop.instagramHandle}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              📸 Instagram
            </a>
          )}
          {shop.showTelegram && shop.telegramHandle && (
            <a href={`https://t.me/${shop.telegramHandle}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              ✈️ Telegram
            </a>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/${shop.slug}`}
          className="block w-full text-center py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:shadow-md active:scale-95"
          style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
        >
          Переглянути магазин →
        </Link>
      </div>
    </div>
  )
}
