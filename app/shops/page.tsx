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
  flowers: { id: string; name: string; price: number; imageUrl: string | null; availability: string }[]
  _count: { flowers: number; orders: number }
}

function getStars(completedOrders: number): number {
  if (completedOrders === 0) return 4.0
  if (completedOrders < 5)  return 4.2
  if (completedOrders < 15) return 4.5
  if (completedOrders < 30) return 4.7
  return 4.9
}

function isOpenNow(workingHoursJson: string | null): { open: boolean; label: string; closeTime?: string } {
  if (!workingHoursJson) return { open: false, label: '' }
  try {
    const hours = JSON.parse(workingHoursJson)
    const now   = new Date()
    const days  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const today = days[now.getDay()]
    const day   = hours[today]
    if (!day || day.closed) return { open: false, label: 'Зачинено сьогодні' }
    const [oh, om] = day.open.split(':').map(Number)
    const [ch, cm] = day.close.split(':').map(Number)
    const nowMins   = now.getHours() * 60 + now.getMinutes()
    const openMins  = oh * 60 + om
    const closeMins = ch * 60 + cm
    const isOpen = nowMins >= openMins && nowMins < closeMins
    return {
      open: isOpen,
      label: isOpen ? `Відкрито до ${day.close}` : `Відкривається ${day.open}`,
      closeTime: day.close,
    }
  } catch {
    return { open: false, label: '' }
  }
}

function currSym(currency: string) {
  return currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const empty = 5 - full
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full  }).map((_, i) => (
        <svg key={`f${i}`} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className="w-3.5 h-3.5 text-gray-200" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ShopsPage() {
  const [shops,        setShops]        = useState<ShopCard[]>([])
  const [cities,       setCities]       = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const fetchShops = useCallback(async (city: string) => {
    setLoading(true); setError('')
    try {
      const params = city !== 'all' ? `?city=${encodeURIComponent(city)}` : ''
      const res  = await fetch(`/api/shops-directory${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка завантаження')
      setShops(data.shops || [])
      setCities(data.cities || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchShops('all') }, [fetchShops])

  const handleCityChange = (city: string) => { setSelectedCity(city); fetchShops(city) }

  const filtered = shops.filter(s =>
    search.trim() === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.about || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Dark Hero Header ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-pink-600/15 rounded-full blur-[80px]" />
          <div className="absolute top-10 right-1/4 w-56 h-56 bg-purple-600/15 rounded-full blur-[70px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-10 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm">🌸</div>
              <span className="font-bold text-white">FlowerGoUa</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400 text-sm">Каталог магазинів</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Квіткові магазини України
          </h1>
          <p className="text-gray-400 text-base mb-7">
            Знайдіть квіткову крамницю у вашому місті, перегляньте асортимент та зробіть замовлення
          </p>

          {/* Search + city filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Пошук магазину або міста..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:bg-white/8 text-sm transition-all" />
            </div>
            <div className="relative sm:w-56">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select value={selectedCity} onChange={e => handleCityChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-pink-500/50 text-sm appearance-none transition-all">
                <option value="all" className="bg-gray-900">Всі міста</option>
                {cities.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                {UA_CITIES.filter(c => !cities.includes(c)).map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* City pills */}
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-7">
            <button onClick={() => handleCityChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCity === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}>
              Всі міста
            </button>
            {cities.map(city => (
              <button key={city} onClick={() => handleCityChange(city)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCity === city
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}>
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-7">
            <span className="text-white font-semibold">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'магазин' : filtered.length < 5 ? 'магазини' : 'магазинів'}
            {selectedCity !== 'all' ? ` у місті ${selectedCity}` : ' по всій Україні'}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mb-4" />
            <p className="text-gray-500">Завантажуємо магазини...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🌸</p>
            <h2 className="text-xl font-bold text-white mb-2">
              {selectedCity !== 'all' ? `У місті ${selectedCity} магазинів поки немає` : 'Магазинів не знайдено'}
            </h2>
            <p className="text-gray-500 mb-6 text-sm">Спробуйте інший пошуковий запит або місто</p>
            <button onClick={() => { setSearch(''); handleCityChange('all') }}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:from-pink-400 hover:to-purple-500 transition-all">
              Показати всі магазини
            </button>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(shop => <ShopCardComponent key={shop.id} shop={shop} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.05] mt-10 py-8">
        <div className="max-w-6xl mx-auto px-5 text-center text-sm text-gray-600">
          <Link href="/" className="font-bold text-white hover:text-pink-400 transition-colors">🌸 FlowerGoUa</Link>
          {' — '} платформа для квіткових магазинів України ·{' '}
          <Link href="/signup" className="text-pink-500 hover:text-pink-400 transition-colors">Відкрити свій магазин →</Link>
        </div>
      </div>
    </div>
  )
}

function ShopCardComponent({ shop }: { shop: ShopCard }) {
  const rating   = getStars(shop._count.orders)
  const status   = isOpenNow(shop.workingHours)
  const primary  = shop.primaryColor || '#ec4899'
  const accent   = shop.accentColor  || '#a855f7'
  const sym      = currSym(shop.currency)
  const inStock  = shop.flowers.filter(f => f.availability !== 'out_of_stock')
  const minPrice = inStock.length > 0 ? Math.min(...inStock.map(f => f.price)) : null
  const maxPrice = inStock.length > 0 ? Math.max(...inStock.map(f => f.price)) : null

  return (
    <div className="bg-gray-900 border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.14] transition-all group flex flex-col">

      {/* Cover */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {shop.coverImageUrl ? (
          <Image src={shop.coverImageUrl} alt={shop.name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90" />
        ) : (
          <div className="w-full h-full relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primary}25, ${accent}30)` }}>
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-15">🌸</div>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

        {/* Open badge */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            status.open
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gray-800/80 text-gray-400 border border-white/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.open ? 'bg-emerald-400' : 'bg-gray-500'}`} />
            {status.open ? 'Відкрито' : 'Зачинено'}
          </div>
        </div>

        {/* Same-day badge */}
        {shop.sameDayDelivery && (
          <div className="absolute top-3 right-3">
            <div className="text-[11px] font-bold px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
              ⚡ Сьогодні
            </div>
          </div>
        )}

        {/* Logo bottom left */}
        <div className="absolute bottom-3 left-4 flex items-end gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
            {shop.logoUrl
              ? <Image src={shop.logoUrl} alt="logo" width={48} height={48} className="object-cover" />
              : <span className="text-lg font-bold" style={{ color: primary }}>{shop.name.charAt(0)}</span>
            }
          </div>
        </div>

        {/* Price range bottom right */}
        {minPrice !== null && (
          <div className="absolute bottom-3 right-3">
            <div className="text-xs font-semibold text-white bg-black/40 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {sym}{minPrice}{maxPrice !== minPrice ? `–${sym}${maxPrice}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name + rating */}
        <div className="mb-2">
          <h3 className="font-bold text-white text-base leading-snug group-hover:text-pink-400 transition-colors line-clamp-1">
            {shop.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StarRating rating={rating} />
            {shop._count.orders > 0 && (
              <span className="text-xs text-gray-600">{shop._count.orders} замовлень</span>
            )}
          </div>
        </div>

        {/* Location + hours */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {(shop.city || shop.location) && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {shop.city || shop.location}
            </span>
          )}
          {status.label && (
            <span className={`text-xs ${status.open ? 'text-emerald-500' : 'text-gray-500'}`}>
              {status.label}
            </span>
          )}
        </div>

        {/* About */}
        {shop.about && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1">
            {shop.about}
          </p>
        )}

        {/* Stats chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {shop._count.flowers > 0 && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1">
              <span className="text-xs text-gray-400">🌷</span>
              <span className="text-xs font-semibold text-gray-300">{shop._count.flowers} букетів</span>
            </div>
          )}
          {shop.minimumOrderAmount && shop.minimumOrderAmount > 0 ? (
            <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1">
              <span className="text-xs text-gray-400">від</span>
              <span className="text-xs font-semibold text-gray-300">{sym}{shop.minimumOrderAmount}</span>
            </div>
          ) : null}
          {shop.sameDayDelivery && (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1">
              <span className="text-xs font-semibold text-amber-400">⚡ Швидка доставка</span>
            </div>
          )}
        </div>

        {/* Flower preview */}
        {inStock.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {inStock.slice(0, 3).map(f => (
              <div key={f.id} className="flex-1 relative rounded-xl overflow-hidden bg-gray-800 border border-white/5" style={{ height: 68 }}>
                {f.imageUrl
                  ? <Image src={f.imageUrl} alt={f.name} fill className="object-cover opacity-90" />
                  : <div className="absolute inset-0 flex items-center justify-center text-xl">🌸</div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-2">
                  <p className="text-white text-[10px] font-bold text-center">{sym}{f.price}</p>
                </div>
              </div>
            ))}
            {shop._count.flowers > 3 && (
              <div className="w-14 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                +{shop._count.flowers - 3}
              </div>
            )}
          </div>
        )}

        {/* Contact chips */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {shop.showPhone && shop.phoneNumber && (
            <a href={`tel:${shop.phoneNumber}`}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-white/5 border border-white/8 px-2 py-1 rounded-lg transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Дзвонити
            </a>
          )}
          {shop.showInstagram && shop.instagramHandle && (
            <a href={`https://instagram.com/${shop.instagramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-pink-400 bg-white/5 border border-white/8 px-2 py-1 rounded-lg transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
          )}
          {shop.showTelegram && shop.telegramHandle && (
            <a href={`https://t.me/${shop.telegramHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-400 bg-white/5 border border-white/8 px-2 py-1 rounded-lg transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
          )}
        </div>

        {/* CTA */}
        <Link href={`/${shop.slug}`}
          className="block w-full text-center py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
          Переглянути магазин →
        </Link>
      </div>
    </div>
  )
}
