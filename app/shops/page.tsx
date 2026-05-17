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
  location: string | null
  about: string | null
  tagline: string | null
  tags: string | null
  coverImageUrl: string | null
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  phoneNumber: string | null
  showPhone: boolean
  whatsappNumber: string | null
  showWhatsapp: boolean
  instagramHandle: string | null
  showInstagram: boolean
  telegramHandle: string | null
  showTelegram: boolean
  workingHours: string | null
  sameDayDelivery: boolean
  allowCustomBouquet: boolean
  minimumOrderAmount: number | null
  currency: string
  plan: { slug: string }
  flowers: { id: string; name: string; price: number; imageUrl: string | null; availability: string }[]
  _count: { flowers: number; orders: number }
}

type SortKey = 'activity' | 'newest' | 'plan'

function isOpenNow(json: string | null): { open: boolean; label: string } {
  if (!json) return { open: false, label: '' }
  try {
    const h = JSON.parse(json)
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const today = days[new Date().getDay()]
    const d = h[today]
    if (!d || d.closed) return { open: false, label: 'Зачинено' }
    const now = new Date().getHours() * 60 + new Date().getMinutes()
    const [oh, om] = d.open.split(':').map(Number)
    const [ch, cm] = d.close.split(':').map(Number)
    const open = now >= oh * 60 + om && now < ch * 60 + cm
    return { open, label: open ? `до ${d.close}` : `з ${d.open}` }
  } catch { return { open: false, label: '' } }
}

function sym(currency: string) {
  return currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
}

function getStars(orders: number) {
  if (orders === 0) return 4.0
  if (orders < 5)  return 4.2
  if (orders < 15) return 4.5
  if (orders < 30) return 4.7
  return 4.9
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(n) ? 'text-amber-400' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-[11px] text-gray-400 ml-1 font-medium">{n.toFixed(1)}</span>
    </span>
  )
}

export default function ShopsPage() {
  const [shops,        setShops]        = useState<ShopCard[]>([])
  const [cities,       setCities]       = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('all')
  const [search,       setSearch]       = useState('')
  const [sort,         setSort]         = useState<SortKey>('activity')
  const [filterSameDay, setFilterSameDay] = useState(false)
  const [filterCustom,  setFilterCustom]  = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const fetchShops = useCallback(async (city: string, s: SortKey, sd: boolean, cu: boolean) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ sort: s })
      if (city !== 'all') params.set('city', city)
      if (sd) params.set('sameDay', '1')
      if (cu) params.set('custom',  '1')
      const res  = await fetch(`/api/shops-directory?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка')
      setShops(data.shops  || [])
      setCities(data.cities || [])
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Помилка') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchShops(selectedCity, sort, filterSameDay, filterCustom) }, [fetchShops, selectedCity, sort, filterSameDay, filterCustom])

  const filtered = shops.filter(s =>
    !search.trim() ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.tagline || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.about   || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.tags    || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
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

          {/* Search + city + sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Пошук магазину, міста, спеціалізації..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 text-sm transition-all" />
            </div>

            {/* City */}
            <div className="relative sm:w-48">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-pink-500/50 text-sm appearance-none">
                <option value="all" className="bg-gray-900">Всі міста</option>
                {cities.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                {UA_CITIES.filter(c => !cities.includes(c)).map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
              </select>
            </div>

            {/* Sort */}
            <div className="relative sm:w-48">
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-pink-500/50 text-sm appearance-none">
                <option value="activity" className="bg-gray-900">🔥 За активністю</option>
                <option value="newest"   className="bg-gray-900">🆕 Спочатку нові</option>
                <option value="plan"     className="bg-gray-900">⭐ За планом</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {/* City pills */}
          <button onClick={() => setSelectedCity('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              selectedCity === 'all'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}>
            Всі міста
          </button>
          {cities.map(city => (
            <button key={city} onClick={() => setSelectedCity(city)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                selectedCity === city
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}>
              {city}
            </button>
          ))}

          {/* Feature filters */}
          <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
            <button onClick={() => setFilterSameDay(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterSameDay
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-white/5 text-gray-500 border border-white/10 hover:text-amber-400 hover:border-amber-500/30'
              }`}>
              ⚡ Доставка сьогодні
            </button>
            <button onClick={() => setFilterCustom(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterCustom
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  : 'bg-white/5 text-gray-500 border border-white/10 hover:text-purple-400 hover:border-purple-500/30'
              }`}>
              🎨 Власний букет
            </button>
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-6">
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
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl mb-6 text-sm">⚠️ {error}</div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🌸</p>
            <h2 className="text-xl font-bold text-white mb-2">Магазинів не знайдено</h2>
            <p className="text-gray-500 mb-6 text-sm">Спробуйте інший запит або зніміть фільтри</p>
            <button onClick={() => { setSearch(''); setSelectedCity('all'); setFilterSameDay(false); setFilterCustom(false) }}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg">
              Скинути фільтри
            </button>
          </div>
        )}

        {/* Cards grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(shop => <ShopCard key={shop.id} shop={shop} />)}
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

// ─── Shop card ────────────────────────────────────────────────────────────────

function ShopCard({ shop }: { shop: ShopCard }) {
  const rating   = getStars(shop._count.orders)
  const status   = isOpenNow(shop.workingHours)
  const primary  = shop.primaryColor || '#ec4899'
  const accent   = shop.accentColor  || '#a855f7'
  const s        = sym(shop.currency)
  const inStock  = shop.flowers.filter(f => f.availability !== 'out_of_stock')
  const minPrice = inStock.length > 0 ? Math.min(...inStock.map(f => f.price)) : null
  const maxPrice = inStock.length > 0 ? Math.max(...inStock.map(f => f.price)) : null
  const isPremium = shop.plan.slug === 'premium'
  const tags = shop.tags ? shop.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all group ${
      isPremium
        ? 'bg-gray-900 border-white/[0.12] hover:border-pink-500/40 shadow-lg shadow-pink-900/10'
        : 'bg-gray-900 border-white/[0.07] hover:border-white/[0.14]'
    }`}>

      {/* Premium glow ring */}
      {isPremium && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-pink-500/10" />
      )}

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
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {/* Open/closed */}
          {status.label && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              status.open
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800/80 text-gray-400 border border-white/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.open ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              {status.open ? `Відкрито ${status.label}` : 'Зачинено'}
            </div>
          )}
        </div>

        {/* Top right badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {isPremium && (
            <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/80 to-purple-600/80 text-white backdrop-blur-sm border border-white/10">
              ⭐ Бізнес
            </div>
          )}
          {shop.sameDayDelivery && (
            <div className="text-[11px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
              ⚡ Сьогодні
            </div>
          )}
          {shop.allowCustomBouquet && (
            <div className="text-[11px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
              🎨 Конструктор
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="absolute bottom-3 left-4">
          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
            {shop.logoUrl
              ? <Image src={shop.logoUrl} alt="logo" width={48} height={48} className="object-cover" />
              : <span className="text-lg font-bold" style={{ color: primary }}>{shop.name.charAt(0)}</span>
            }
          </div>
        </div>

        {/* Price range */}
        {minPrice !== null && (
          <div className="absolute bottom-3 right-3">
            <div className="text-xs font-semibold text-white bg-black/40 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {s}{minPrice}{maxPrice !== minPrice ? `–${maxPrice}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">

        {/* Name + rating */}
        <div className="mb-2">
          <h3 className={`font-bold text-base leading-snug line-clamp-1 transition-colors group-hover:text-pink-400 ${
            isPremium ? 'text-white' : 'text-gray-100'
          }`}>
            {shop.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Stars n={rating} />
            {shop._count.orders > 0 && (
              <span className="text-xs text-gray-600">{shop._count.orders} зам.</span>
            )}
          </div>
        </div>

        {/* Tagline or about */}
        {(shop.tagline || shop.about) && (
          <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
            {shop.tagline || shop.about}
          </p>
        )}

        {/* Location */}
        {(shop.city || shop.location) && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {shop.city || shop.location}
          </div>
        )}

        {/* Specialty tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 4).map(tag => (
              <span key={tag}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {shop._count.flowers > 0 && (
            <span className="text-[11px] text-gray-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-lg font-medium">
              🌷 {shop._count.flowers} букетів
            </span>
          )}
          {shop.minimumOrderAmount && shop.minimumOrderAmount > 0 ? (
            <span className="text-[11px] text-gray-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-lg font-medium">
              від {s}{shop.minimumOrderAmount}
            </span>
          ) : null}
        </div>

        {/* Flower previews */}
        {inStock.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {inStock.slice(0, 3).map(f => (
              <div key={f.id} className="flex-1 relative rounded-xl overflow-hidden bg-gray-800 border border-white/5" style={{ height: 64 }}>
                {f.imageUrl
                  ? <Image src={f.imageUrl} alt={f.name} fill className="object-cover opacity-90" />
                  : <div className="absolute inset-0 flex items-center justify-center text-xl">🌸</div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1 pb-1">
                  <p className="text-white text-[10px] font-bold text-center">{s}{f.price}</p>
                </div>
              </div>
            ))}
            {shop._count.flowers > 3 && (
              <div className="w-12 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                +{shop._count.flowers - 3}
              </div>
            )}
          </div>
        )}

        {/* Contacts */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {shop.showPhone && shop.phoneNumber && (
            <a href={`tel:${shop.phoneNumber}`}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-white/5 border border-white/8 px-2 py-1 rounded-lg transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Дзвонити
            </a>
          )}
          {shop.showWhatsapp && shop.whatsappNumber && (
            <a href={`https://wa.me/${shop.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-green-400 bg-white/5 border border-white/8 px-2 py-1 rounded-lg transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
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
          className="block w-full text-center py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:shadow-lg mt-auto"
          style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
          Переглянути магазин →
        </Link>
      </div>
    </div>
  )
}
