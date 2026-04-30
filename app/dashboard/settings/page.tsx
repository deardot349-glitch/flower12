'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPlanConfig } from '@/lib/plans'
import { UA_CITIES } from '@/lib/cities'
import DiscountsTab from '@/components/DiscountsTab'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'general' | 'directory' | 'appearance' | 'contact' | 'hours' | 'delivery' | 'payment' | 'orders' | 'discounts' | 'seo' | 'telegram' | 'legal' | 'danger'
type DayHours = { open: string; close: string; closed: boolean }
type WeeklyHours = Record<string, DayHours>

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Понеділок', tuesday: 'Вівторок', wednesday: 'Середа',
  thursday: 'Четвер', friday: "П'ятниця", saturday: 'Субота', sunday: 'Неділя',
}
const defaultDay: DayHours = { open: '09:00', close: '18:00', closed: false }
const defaultHours: WeeklyHours = Object.fromEntries(
  DAYS.map(d => [d, { ...defaultDay, closed: d === 'sunday' }])
)

const COLOR_THEMES = [
  { name: 'Рожевий',     primary: '#ec4899', accent: '#a855f7' },
  { name: 'Червоний',    primary: '#ef4444', accent: '#f97316' },
  { name: 'Помаранч.',   primary: '#f97316', accent: '#eab308' },
  { name: 'Жовтий',     primary: '#eab308', accent: '#84cc16' },
  { name: 'Зелений',    primary: '#22c55e', accent: '#10b981' },
  { name: 'Бірюзовий',  primary: '#14b8a6', accent: '#06b6d4' },
  { name: 'Синій',      primary: '#3b82f6', accent: '#6366f1' },
  { name: 'Фіолетовий', primary: '#8b5cf6', accent: '#ec4899' },
  { name: 'Коричневий', primary: '#92400e', accent: '#d97706' },
  { name: 'Чорний',     primary: '#1f2937', accent: '#4b5563' },
  { name: 'Золотий',    primary: '#b45309', accent: '#d97706' },
  { name: 'Лавандовий', primary: '#7c3aed', accent: '#c084fc' },
]

const SPECIALTY_TAGS = [
  'Троянди', 'Тюльпани', 'Піони', 'Орхідеї', 'Лілії', 'Соняшники',
  'Весільні букети', 'Корпоративні замовлення', 'Екзотика', 'Польові квіти',
  'Сухоцвіти', 'Букети в коробці', 'Мʼякі іграшки', 'Швидка доставка',
]

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all bg-white'

// ── Default shop state ────────────────────────────────────────────────────────
const defaultShop = {
  name: '', about: '', tagline: '', tags: '',
  language: 'uk', currency: 'UAH', timezone: 'Europe/Kyiv',
  city: '', country: '', location: '', googleMapsUrl: '',
  coverImageUrl: '', logoUrl: '',
  primaryColor: '#ec4899', accentColor: '#a855f7',
  enableAnimations: true, layoutStyle: 'classic',
  // Contact
  email: '', phoneNumber: '', whatsappNumber: '', viberNumber: '',
  telegramHandle: '', instagramHandle: '',
  showPhone: true, showEmail: true, showWhatsapp: true,
  showViber: true, showTelegram: true, showInstagram: true, showLocation: true,
  // Pickup
  pickupEnabled: false, pickupAddress: '', pickupInstructions: '',
  // Payment
  cashOnDelivery: true, cardOnDelivery: true, monojarUrl: '',
  // Delivery
  sameDayDelivery: true, deliveryTimeEstimate: '', deliveryCutoffTime: '14:00',
  minimumOrderAmount: 0, freeDeliveryFrom: 0,
  showDeliveryEstimate: true, allowSameDayOrders: true, allowScheduledDelivery: false,
  // Orders
  autoConfirmOrders: false, requirePhoneVerify: false,
  requireCustomerEmail: false, orderNotifyEmail: '',
  orderNotifyEmailEnabled: false, customerEmailNotifications: true,
  showOrderTracking: true, orderIdPrefix: 'FL',
  outOfStockBehavior: 'show_unavailable', stockAlertThreshold: 5,
  // SEO
  seoTitle: '', seoDescription: '', seoKeywords: '',
  // Legal
  refundPolicy: '', termsUrl: '',
  // Custom bouquet
  allowCustomBouquet: true,
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-100 mb-1">
      <div className="w-9 h-9 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
      <div>
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        {hint && <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hint}</div>}
      </div>
      <div className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'left-7' : 'left-1'}`} />
      </div>
    </div>
  )
}

function PlanLockBanner({ feature, requiredPlan }: { feature: string; requiredPlan: 'basic' | 'premium' }) {
  const label = requiredPlan === 'basic' ? 'Про або Бізнес' : 'Бізнес'
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <span className="text-xl">🔒</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-900">{feature} — план «{label}»</p>
        <p className="text-xs text-amber-700 mt-0.5 mb-2">Перейдіть на платний план щоб розблокувати.</p>
        <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors">
          Перейти на {label} →
        </Link>
      </div>
    </div>
  )
}

function ContactCard({ icon, label, isVisible, onToggle, hasValue, children }: {
  icon: string; label: string; isVisible: boolean; onToggle: (v: boolean) => void; hasValue: boolean; children: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${isVisible ? 'border-gray-200' : 'border-gray-100 bg-gray-50/40'}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{label}</span>
          {isVisible && hasValue
            ? <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">видно</span>
            : !isVisible
              ? <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">приховано</span>
              : null}
        </div>
        <button type="button" onClick={() => onToggle(!isVisible)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isVisible ? 'bg-green-500' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isVisible ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

function TagsInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [input, setInput] = useState('')
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : []

  const add = (tag: string) => {
    const t = tag.trim()
    if (!t || tags.includes(t)) { setInput(''); return }
    onChange([...tags, t].join(', '))
    setInput('')
  }
  const remove = (tag: string) => onChange(tags.filter(t => t !== tag).join(', '))

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 bg-pink-100 text-pink-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {tag}
              <button type="button" onClick={() => remove(tag)} className="text-pink-400 hover:text-pink-700 font-black text-base leading-none">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 mb-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input) } if (e.key === ',') { e.preventDefault(); add(input) } }}
          placeholder="Додати спеціалізацію..." className={inputCls} />
        <button type="button" onClick={() => add(input)} disabled={!input.trim()}
          className="px-4 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">+</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SPECIALTY_TAGS.filter(t => !tags.includes(t)).map(tag => (
          <button key={tag} type="button" onClick={() => add(tag)}
            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-700 hover:bg-pink-50 transition-all">
            + {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

function DeliveryCitiesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [inputVal, setInputVal] = useState('')
  const cities = value ? value.split(',').map(c => c.trim()).filter(Boolean) : []
  const add = (city: string) => {
    const t = city.trim()
    if (!t || cities.includes(t)) { setInputVal(''); return }
    onChange([...cities, t].join(', '))
    setInputVal('')
  }
  const remove = (city: string) => onChange(cities.filter(c => c !== city).join(', '))
  return (
    <div>
      {cities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {cities.map(city => (
            <span key={city} className="flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
              📍 {city}
              <button type="button" onClick={() => remove(city)} className="text-blue-400 hover:text-blue-700 font-black">×</button>
            </span>
          ))}
          <button type="button" onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg">Очистити</button>
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" list="dcities" value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(inputVal) } }}
          placeholder="Місто доставки..." className={`${inputCls} flex-1`} />
        <datalist id="dcities">{UA_CITIES.filter(c => !cities.includes(c)).map(c => <option key={c} value={c} />)}</datalist>
        <button type="button" onClick={() => add(inputVal)} disabled={!inputVal.trim()}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">+</button>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">Enter або кома щоб додати. Підтримуються будь-які назви.</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [planSlug, setPlanSlug]   = useState('free')
  const [shopData, setShopData]   = useState(defaultShop)
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(defaultHours)

  const [loading, setLoading]   = useState(false)
  const [uploading, setUploading] = useState<'cover' | 'logo' | null>(null)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramMsg, setTelegramMsg] = useState('')
  const [telegramError, setTelegramError] = useState('')

  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const logoRef  = useRef<HTMLInputElement>(null)

  const [deliveryFee, setDeliveryFee]       = useState(0)
  const [deliveryZoneId, setDeliveryZoneId] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm]   = useState('')
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [deleteError, setDeleteError]       = useState('')

  const plan = getPlanConfig(planSlug)
  const sym  = shopData.currency === 'UAH' ? '₴' : shopData.currency === 'EUR' ? '€' : shopData.currency === 'GBP' ? '£' : '$'

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const [shopRes, zonesRes] = await Promise.all([
        fetch('/api/shop').then(r => r.json()),
        fetch('/api/delivery-zones').then(r => r.json()).catch(() => ({ zones: [] })),
      ])
      if (shopRes.shop) {
        const s = shopRes.shop
        setPlanSlug(s.plan?.slug || 'free')
        setShopData({
          name: s.name || '', about: s.about || '',
          tagline: s.tagline || '', tags: s.tags || '',
          language: s.language || 'uk', currency: s.currency || 'UAH', timezone: s.timezone || 'Europe/Kyiv',
          city: s.city || '', country: s.country || '',
          location: s.location || '', googleMapsUrl: s.googleMapsUrl || '',
          coverImageUrl: s.coverImageUrl || '', logoUrl: s.logoUrl || '',
          primaryColor: s.primaryColor || '#ec4899', accentColor: s.accentColor || '#a855f7',
          enableAnimations: s.enableAnimations ?? true, layoutStyle: s.layoutStyle || 'classic',
          email: s.email || '', phoneNumber: s.phoneNumber || '',
          whatsappNumber: s.whatsappNumber || '', viberNumber: s.viberNumber || '',
          telegramHandle: s.telegramHandle || '', instagramHandle: s.instagramHandle || '',
          showPhone: s.showPhone ?? true, showEmail: s.showEmail ?? true,
          showWhatsapp: s.showWhatsapp ?? true, showViber: s.showViber ?? true,
          showTelegram: s.showTelegram ?? true, showInstagram: s.showInstagram ?? true,
          showLocation: s.showLocation ?? true,
          pickupEnabled: s.pickupEnabled ?? false,
          pickupAddress: s.pickupAddress || '', pickupInstructions: s.pickupInstructions || '',
          cashOnDelivery: s.cashOnDelivery ?? true, cardOnDelivery: s.cardOnDelivery ?? true,
          monojarUrl: s.monojarUrl || '',
          sameDayDelivery: s.sameDayDelivery ?? true,
          deliveryTimeEstimate: s.deliveryTimeEstimate || '',
          deliveryCutoffTime: s.deliveryCutoffTime || '14:00',
          minimumOrderAmount: s.minimumOrderAmount ?? 0,
          freeDeliveryFrom: s.freeDeliveryFrom ?? 0,
          showDeliveryEstimate: s.showDeliveryEstimate ?? true,
          allowSameDayOrders: s.allowSameDayOrders ?? true,
          allowScheduledDelivery: s.allowScheduledDelivery ?? false,
          autoConfirmOrders: s.autoConfirmOrders ?? false,
          requirePhoneVerify: s.requirePhoneVerify ?? false,
          requireCustomerEmail: s.requireCustomerEmail ?? false,
          orderNotifyEmail: s.orderNotifyEmail || s.email || '',
          orderNotifyEmailEnabled: s.orderNotifyEmailEnabled ?? false,
          customerEmailNotifications: s.customerEmailNotifications ?? true,
          showOrderTracking: s.showOrderTracking ?? true,
          orderIdPrefix: s.orderIdPrefix || 'FL',
          outOfStockBehavior: s.outOfStockBehavior || 'show_unavailable',
          stockAlertThreshold: s.stockAlertThreshold ?? 5,
          seoTitle: s.seoTitle || '', seoDescription: s.seoDescription || '', seoKeywords: s.seoKeywords || '',
          refundPolicy: s.refundPolicy || '', termsUrl: s.termsUrl || '',
          allowCustomBouquet: s.allowCustomBouquet ?? true,
        })
        if (s.coverImageUrl) setCoverPreview(s.coverImageUrl)
        if (s.logoUrl) setLogoPreview(s.logoUrl)
        if (s.telegramChatId) { setTelegramChatId(s.telegramChatId); setTelegramConnected(true) }
        if (s.workingHours) { try { setWeeklyHours({ ...defaultHours, ...JSON.parse(s.workingHours) }) } catch {} }
      }
      const zones = zonesRes.zones || []
      if (zones.length > 0) { setDeliveryFee(zones[0].fee ?? 0); setDeliveryZoneId(zones[0].id) }
    } catch {}
  }

  const set = (key: string, value: any) => setShopData(p => ({ ...p, [key]: value }))
  const notify = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }

  const handleUpload = async (file: File, type: 'cover' | 'logo') => {
    if (file.size > 5 * 1024 * 1024) { setError('Макс. 5MB'); return }
    if (!file.type.startsWith('image/')) { setError('Тільки зображення'); return }
    setUploading(type); setError('')
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('type', type)
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const key = type === 'cover' ? 'coverImageUrl' : 'logoUrl'
      await fetch('/api/shop', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...shopData, [key]: data.url, workingHours: JSON.stringify(weeklyHours) }) })
      setShopData(p => ({ ...p, [key]: data.url }))
      if (type === 'cover') setCoverPreview(data.url)
      else setLogoPreview(data.url)
      notify('✅ Фото збережено!')
    } catch (err: any) { setError(err.message) }
    finally { setUploading(null) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/shop', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...shopData, workingHours: JSON.stringify(weeklyHours) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Save delivery fee
      const zonePayload = { name: 'Доставка', fee: deliveryFee, estimatedMinHours: 1, estimatedMaxHours: 4, sameDayAvailable: true, active: true }
      if (deliveryFee > 0) {
        if (deliveryZoneId) {
          await fetch(`/api/delivery-zones/${deliveryZoneId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(zonePayload) })
        } else {
          const zr = await fetch('/api/delivery-zones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(zonePayload) })
          const zd = await zr.json()
          if (zd.zone?.id) setDeliveryZoneId(zd.zone.id)
        }
      } else if (deliveryZoneId) {
        await fetch(`/api/delivery-zones/${deliveryZoneId}`, { method: 'DELETE' })
        setDeliveryZoneId(null)
      }
      notify('✅ Збережено!')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'ВИДАЛИТИ') return
    setDeleteLoading(true); setDeleteError('')
    try {
      const res = await fetch('/api/shop', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'DELETE' }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      window.location.href = '/api/auth/signout?callbackUrl=/'
    } catch (err: any) { setDeleteError(err.message); setDeleteLoading(false) }
  }

  const tabs: { id: Tab; label: string; icon: string; badge?: string }[] = [
    { id: 'general',    label: 'Загальне',      icon: '🏪' },
    { id: 'directory',  label: 'Каталог',        icon: '🗂️' },
    { id: 'appearance', label: 'Дизайн',          icon: '🎨' },
    { id: 'contact',    label: 'Контакти',        icon: '📞' },
    { id: 'hours',      label: 'Години роботи',   icon: '🕐' },
    { id: 'delivery',   label: 'Доставка',         icon: '🚚' },
    { id: 'payment',    label: 'Оплата',           icon: '💳' },
    { id: 'orders',     label: 'Замовлення',       icon: '📦' },
    { id: 'discounts',  label: 'Промокоди',         icon: '🏷️' },
    { id: 'seo',        label: 'SEO',              icon: '🔍' },
    { id: 'telegram',   label: 'Telegram',         icon: '✈️', badge: plan.allowTelegram ? undefined : 'ПРО' },
    { id: 'legal',      label: 'Правові',          icon: '📄' },
    { id: 'danger',     label: 'Небезпека',        icon: '⚠️' },
  ]

  const seoTitle   = shopData.seoTitle       || `${shopData.name} — квіти та букети`
  const seoDesc    = shopData.seoDescription || `Замовте свіжі букети онлайн у ${shopData.name}.`
  const seoUrlSlug = shopData.name.toLowerCase().replace(/\s+/g, '-') || 'your-shop'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-5 md:py-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Налаштування</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Керуйте всіма аспектами вашого магазину</p>
        </div>

        {error   && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex gap-2"><span>⚠️</span>{error}</div>}
        {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex gap-2"><span>✅</span>{success}</div>}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="lg:hidden">
              <select value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-pink-400 outline-none shadow-sm">
                {tabs.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}{t.badge ? ` (${t.badge})` : ''}</option>)}
              </select>
            </div>
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm p-2 sticky top-4">
              {tabs.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all w-full text-left ${
                    activeTab === tab.id ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span>{tab.icon}</span>
                  <span className="flex-1">{tab.label}</span>
                  {tab.badge && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{tab.badge}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 space-y-6">

                {/* ══════════ GENERAL ══════════ */}
                {activeTab === 'general' && <>
                  <SectionTitle icon="🏪" title="Загальна інформація" subtitle="Основні дані магазину" />
                  <Field label="Назва магазину">
                    <input required type="text" value={shopData.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Квіти від Марії" />
                  </Field>
                  <Field label="Опис магазину" hint="Розгорнутий опис — показується на публічній сторінці">
                    <textarea rows={4} value={shopData.about} onChange={e => set('about', e.target.value)} className={inputCls} placeholder="Ми створюємо букети з любов'ю вже 10 років..." />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Мова">
                      <select value={shopData.language} onChange={e => set('language', e.target.value)} className={inputCls}>
                        <option value="uk">🇺🇦 Українська</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="pl">🇵🇱 Polski</option>
                      </select>
                    </Field>
                    <Field label="Валюта">
                      <select value={shopData.currency} onChange={e => set('currency', e.target.value)} className={inputCls}>
                        <option value="UAH">🇺🇦 UAH – Гривня (₴)</option>
                        <option value="USD">💵 USD – Долар ($)</option>
                        <option value="EUR">💶 EUR – Євро (€)</option>
                        <option value="GBP">💷 GBP – Фунт (£)</option>
                        <option value="PLN">🇵🇱 PLN – Злотий</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Часовий пояс">
                    <select value={shopData.timezone} onChange={e => set('timezone', e.target.value)} className={inputCls}>
                      <option value="Europe/Kyiv">🇺🇦 Europe/Kyiv (UTC+2/+3)</option>
                      <option value="Europe/Warsaw">🇵🇱 Europe/Warsaw</option>
                      <option value="Europe/Berlin">🇩🇪 Europe/Berlin</option>
                      <option value="UTC">🌍 UTC</option>
                    </select>
                  </Field>
                  <Field label="📍 Місто" hint="Використовується для пошуку у каталозі /shops">
                    <input type="text" list="cities-gl" value={shopData.city} onChange={e => set('city', e.target.value)} className={inputCls} placeholder="Луцьк" />
                    <datalist id="cities-gl">{UA_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                  </Field>
                  <Toggle label="Конструктор букетів на замовлення" hint="Клієнти складають власний букет з вашого асортименту і бачать ціну в реальному часі"
                    checked={shopData.allowCustomBouquet} onChange={v => set('allowCustomBouquet', v)} />
                </>}

                {/* ══════════ DIRECTORY ══════════ */}
                {activeTab === 'directory' && <>
                  <SectionTitle icon="🗂️" title="Профіль у каталозі /shops" subtitle="Що бачать клієнти на картці магазину" />
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-sm text-blue-800">
                    <p className="font-bold mb-1">📍 Умови відображення у каталозі:</p>
                    <ul className="text-xs text-blue-700 list-disc pl-4 space-y-0.5">
                      <li>Активний план Про або Бізнес</li>
                      <li>Вказане місто (вкладка «Загальне»)</li>
                    </ul>
                  </div>
                  <Field label="Короткий слоган" hint="Одне речення що робить вас особливими. Показується на картці в каталозі (макс. 80 символів)">
                    <input type="text" value={shopData.tagline} onChange={e => set('tagline', e.target.value.slice(0, 80))} className={inputCls} placeholder="Найсвіжіші букети у Луцьку з доставкою за 2 години" />
                    <div className="flex justify-end mt-1"><span className={`text-xs ${shopData.tagline.length > 70 ? 'text-amber-600' : 'text-gray-400'}`}>{shopData.tagline.length}/80</span></div>
                  </Field>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Спеціалізація / теги</label>
                    <p className="text-xs text-gray-400 mb-3">Що ви продаєте? Показується на картці в каталозі.</p>
                    <TagsInput value={shopData.tags} onChange={v => set('tags', v)} />
                  </div>
                  {/* Live preview */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Попередній перегляд картки</p>
                    <div className="max-w-xs bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                      <div className="h-20 relative" style={{ background: `linear-gradient(135deg, ${shopData.primaryColor}30, ${shopData.accentColor}30)` }}>
                        <div className="absolute bottom-2.5 left-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center">
                            <span className="text-sm font-bold" style={{ color: shopData.primaryColor }}>{shopData.name.charAt(0) || '🌸'}</span>
                          </div>
                        </div>
                        {shopData.sameDayDelivery && <div className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">⚡ Сьогодні</div>}
                        {planSlug === 'premium' && <div className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/80 to-purple-600/80 text-white">⭐ Бізнес</div>}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-white text-sm">{shopData.name || 'Назва магазину'}</p>
                        {(shopData.tagline || shopData.about) && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{shopData.tagline || shopData.about}</p>}
                        {shopData.city && <p className="text-[11px] text-gray-500 mt-1.5">📍 {shopData.city}</p>}
                        {shopData.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {shopData.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 4).map(tag => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>}

                {/* ══════════ APPEARANCE ══════════ */}
                {activeTab === 'appearance' && <>
                  <SectionTitle icon="🎨" title="Зовнішній вигляд" subtitle="Дизайн публічної сторінки магазину" />

                  {/* Cover photo */}
                  {plan.allowCoverPhoto ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Фото обкладинки</p>
                      <p className="text-xs text-gray-400 mb-3">Рекомендовано 1920×600px, до 5MB</p>
                      {coverPreview ? (
                        <div className="relative h-44 rounded-2xl overflow-hidden border border-gray-200 group">
                          <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button type="button" onClick={() => coverRef.current?.click()} className="bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-bold">🔄 Змінити</button>
                            <button type="button" onClick={() => { setCoverPreview(null); set('coverImageUrl', '') }} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold">🗑 Видалити</button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => uploading !== 'cover' && coverRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-pink-400 hover:bg-pink-50/40 transition-all cursor-pointer">
                          {uploading === 'cover'
                            ? <div className="flex flex-col items-center gap-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /><p className="text-sm text-gray-500">Завантажуємо...</p></div>
                            : <div className="pointer-events-none flex flex-col items-center gap-2"><div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-2xl">🖼️</div><p className="text-sm font-semibold text-gray-700">Натисніть щоб завантажити</p><p className="text-xs text-gray-400">PNG, JPG, WebP — до 5MB</p></div>}
                        </div>
                      )}
                      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'cover'); e.target.value = '' }} />
                    </div>
                  ) : <PlanLockBanner feature="Фото обкладинки" requiredPlan="basic" />}

                  {/* Logo */}
                  {plan.allowLogoUpload ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Логотип магазину</p>
                      <p className="text-xs text-gray-400 mb-3">Квадрат, мін. 200×200px</p>
                      <div className="flex items-center gap-5">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                          {logoPreview ? <Image src={logoPreview} alt="Logo" width={96} height={96} className="object-cover w-full h-full" /> : <span className="text-3xl font-bold text-pink-400">{shopData.name.charAt(0) || '🌸'}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button type="button" onClick={() => logoRef.current?.click()} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold">
                            {uploading === 'logo' ? '⏳ Завантаження...' : '📁 Завантажити'}
                          </button>
                          {logoPreview && <button type="button" onClick={() => { setLogoPreview(null); set('logoUrl', '') }} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold">🗑 Видалити</button>}
                        </div>
                        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'logo'); e.target.value = '' }} />
                      </div>
                    </div>
                  ) : <PlanLockBanner feature="Логотип магазину" requiredPlan="premium" />}

                  {/* Colors */}
                  {plan.allowCustomColors ? (
                    <ColorPicker
                      primaryColor={shopData.primaryColor} accentColor={shopData.accentColor}
                      shopName={shopData.name}
                      onPrimary={v => set('primaryColor', v)} onAccent={v => set('accentColor', v)} />
                  ) : <PlanLockBanner feature="Кастомні кольори бренду" requiredPlan="basic" />}

                  <Field label="Стиль відображення букетів">
                    <select value={shopData.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className={inputCls}>
                      <option value="classic">Класичний — сітка карток (рекомендовано)</option>
                      <option value="modern">Сучасний — 2 колонки, великі фото</option>
                      <option value="list">Список — компактний</option>
                      <option value="bold">Повноекранний — великі банери</option>
                    </select>
                  </Field>
                  <Toggle label="Увімкнути анімації" checked={shopData.enableAnimations} onChange={v => set('enableAnimations', v)} />
                </>}

                {/* ══════════ CONTACT ══════════ */}
                {activeTab === 'contact' && <>
                  <SectionTitle icon="📞" title="Контакти" subtitle="Вмикайте перемикач щоб показати контакт клієнтам" />

                  <ContactCard icon="📍" label="Адреса та локація" isVisible={shopData.showLocation} onToggle={v => set('showLocation', v)} hasValue={!!(shopData.location || shopData.city)}>
                    <div className="space-y-2">
                      <input type="text" value={shopData.location} onChange={e => set('location', e.target.value)} disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40' : ''}`} placeholder="вул. Хрещатик, 1" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={shopData.city} onChange={e => set('city', e.target.value)} disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40' : ''}`} placeholder="Місто" />
                        <input type="text" value={shopData.country} onChange={e => set('country', e.target.value)} disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40' : ''}`} placeholder="Країна" />
                      </div>
                      <input type="url" value={shopData.googleMapsUrl} onChange={e => set('googleMapsUrl', e.target.value)} disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40' : ''}`} placeholder="Google Maps посилання" />
                    </div>
                  </ContactCard>

                  {[
                    { key: 'phoneNumber',     showKey: 'showPhone',     icon: '📞', label: 'Телефон',    type: 'tel',   prefix: null, ph: '+380 99 123 4567' },
                    { key: 'email',           showKey: 'showEmail',     icon: '✉️',  label: 'Email',      type: 'email', prefix: null, ph: 'hello@shop.com' },
                    { key: 'whatsappNumber',  showKey: 'showWhatsapp',  icon: '💬', label: 'WhatsApp',   type: 'tel',   prefix: null, ph: '+380991234567' },
                    { key: 'viberNumber',     showKey: 'showViber',     icon: '📲', label: 'Viber',      type: 'tel',   prefix: null, ph: '+380991234567' },
                    { key: 'telegramHandle',  showKey: 'showTelegram',  icon: '✈️',  label: 'Telegram',   type: 'text',  prefix: '@',  ph: 'yourshop' },
                    { key: 'instagramHandle', showKey: 'showInstagram', icon: '📸', label: 'Instagram',  type: 'text',  prefix: '@',  ph: 'yourshop' },
                  ].map(({ key, showKey, icon, label, type, prefix, ph }) => {
                    const visible = (shopData as any)[showKey] as boolean
                    const val     = (shopData as any)[key] as string
                    return (
                      <ContactCard key={key} icon={icon} label={label} isVisible={visible} onToggle={v => set(showKey, v)} hasValue={!!val}>
                        <div className="relative">
                          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400">{prefix}</span>}
                          <input type={type} value={val} onChange={e => set(key, e.target.value)} disabled={!visible} placeholder={ph}
                            className={`${inputCls} ${prefix ? 'pl-8' : ''} ${!visible ? 'opacity-40' : ''}`} />
                        </div>
                      </ContactCard>
                    )
                  })}
                </>}

                {/* ══════════ HOURS ══════════ */}
                {activeTab === 'hours' && <>
                  <SectionTitle icon="🕐" title="Години роботи" subtitle="Розклад на кожен день тижня" />
                  <div className="space-y-2">
                    {DAYS.map(day => {
                      const h = weeklyHours[day] || defaultDay
                      return (
                        <div key={day} className={`rounded-xl border p-3 transition-colors ${h.closed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold text-sm ${h.closed ? 'text-gray-400' : 'text-gray-700'}`}>{DAY_LABELS[day]}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{h.closed ? 'Зачинено' : 'Відкрито'}</span>
                              <button type="button" onClick={() => setWeeklyHours(p => ({ ...p, [day]: { ...p[day], closed: !h.closed } }))}
                                className={`relative w-10 h-5 rounded-full transition-colors ${h.closed ? 'bg-gray-300' : 'bg-green-500'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.closed ? 'left-0.5' : 'left-5'}`} />
                              </button>
                            </div>
                          </div>
                          {!h.closed && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 flex-1">
                                <span className="text-xs text-gray-500 w-14">Відкр.</span>
                                <input type="time" value={h.open} onChange={e => setWeeklyHours(p => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-pink-400 outline-none" />
                              </div>
                              <span className="text-gray-400">—</span>
                              <div className="flex items-center gap-1.5 flex-1">
                                <span className="text-xs text-gray-500 w-14">Закр.</span>
                                <input type="time" value={h.close} onChange={e => setWeeklyHours(p => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-pink-400 outline-none" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { label: 'Всі відкриті 9–18', fn: () => setWeeklyHours(Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '18:00', closed: false }]))) },
                      { label: 'Всі відкриті 10–20', fn: () => setWeeklyHours(Object.fromEntries(DAYS.map(d => [d, { open: '10:00', close: '20:00', closed: false }]))) },
                      { label: 'Закрити вихідні', fn: () => setWeeklyHours(p => ({ ...p, saturday: { ...p.saturday, closed: true }, sunday: { ...p.sunday, closed: true } })) },
                      { label: 'Всі зачинені', fn: () => setWeeklyHours(Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '18:00', closed: true }]))) },
                    ].map(({ label, fn }) => (
                      <button key={label} type="button" onClick={fn} className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">{label}</button>
                    ))}
                  </div>
                </>}

                {/* ══════════ DELIVERY ══════════ */}
                {activeTab === 'delivery' && <>
                  <SectionTitle icon="🚚" title="Доставка" subtitle="Умови та налаштування доставки" />

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                    <p className="text-sm font-bold text-blue-900 mb-1">💰 Вартість доставки</p>
                    <p className="text-xs text-blue-700 mb-3">Додається до ціни букету при оформленні замовлення. 0 = безкоштовна.</p>
                    <div className="flex items-center gap-3 max-w-xs">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">{sym}</span>
                        <input type="number" min="0" step="1" value={deliveryFee} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
                          className="w-full rounded-xl border border-blue-300 bg-white pl-8 pr-4 py-2.5 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
                      </div>
                    </div>
                    {deliveryFee > 0 && <p className="text-xs text-blue-700 mt-2">Клієнт бачить: ціна букету + {sym}{deliveryFee} доставка</p>}
                  </div>

                  <Field label="🎁 Безкоштовна доставка від суми" hint="Якщо сума замовлення перевищує цей поріг — доставка безкоштовна. 0 = вимкнено">
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">{sym}</span>
                      <input type="number" min="0" step="10" value={shopData.freeDeliveryFrom} onChange={e => set('freeDeliveryFrom', parseFloat(e.target.value) || 0)}
                        className={`${inputCls} pl-8`} placeholder="наприклад: 1500" />
                    </div>
                    {shopData.freeDeliveryFrom > 0 && <p className="text-xs text-green-700 mt-1.5 font-medium">✅ При замовленні від {sym}{shopData.freeDeliveryFrom} — безкоштовна доставка</p>}
                  </Field>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1.5">📍 Міста доставки</p>
                    <p className="text-xs text-gray-400 mb-3">Куди ви доставляєте. Показується клієнтам при оформленні.</p>
                    <DeliveryCitiesInput value={shopData.deliveryTimeEstimate} onChange={v => set('deliveryTimeEstimate', v)} />
                  </div>

                  <hr className="border-gray-100" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Мінімальна сума замовлення" hint="0 = без мінімуму">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">{sym}</span>
                        <input type="number" min="0" step="10" value={shopData.minimumOrderAmount} onChange={e => set('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                          className={`${inputCls} pl-8`} />
                      </div>
                    </Field>
                    <Field label="Зупинити прийом після (час)">
                      <input type="time" value={shopData.deliveryCutoffTime} onChange={e => set('deliveryCutoffTime', e.target.value)} className={inputCls} />
                      <p className="text-xs text-gray-400 mt-1">Замовлення після — на наступний день</p>
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <Toggle label="Доставка в той самий день" hint="Відображається мітка '⚡ Сьогодні' в каталозі" checked={shopData.sameDayDelivery} onChange={v => set('sameDayDelivery', v)} />
                    <Toggle label="Дозволити замовлення на сьогодні" checked={shopData.allowSameDayOrders} onChange={v => set('allowSameDayOrders', v)} />
                    <Toggle label="Дозволити запланований час доставки" hint="Клієнти можуть обрати конкретний час доставки" checked={shopData.allowScheduledDelivery} onChange={v => set('allowScheduledDelivery', v)} />
                    <Toggle label="Показувати час доставки клієнту" checked={shopData.showDeliveryEstimate} onChange={v => set('showDeliveryEstimate', v)} />
                  </div>

                  <hr className="border-gray-100" />
                  <SectionTitle icon="🏪" title="Самовивіз" subtitle="Клієнти можуть забрати замовлення самостійно" />
                  <Toggle label="Дозволити самовивіз" hint="На сторінці замовлення з'явиться опція 'Самовивіз'" checked={shopData.pickupEnabled} onChange={v => set('pickupEnabled', v)} />
                  {shopData.pickupEnabled && (
                    <div className="space-y-3 pl-1">
                      <Field label="Адреса самовивізу">
                        <input type="text" value={shopData.pickupAddress} onChange={e => set('pickupAddress', e.target.value)} className={inputCls} placeholder="вул. Хрещатик, 1, Київ" />
                      </Field>
                      <Field label="Інструкції для самовивізу" hint="Під'їзд, поверх, час тощо">
                        <textarea rows={2} value={shopData.pickupInstructions} onChange={e => set('pickupInstructions', e.target.value)} className={inputCls} placeholder="2-й поверх, вхід праворуч від кав'ярні" />
                      </Field>
                    </div>
                  )}
                </>}

                {/* ══════════ PAYMENT ══════════ */}
                {activeTab === 'payment' && <>
                  <SectionTitle icon="💳" title="Методи оплати" subtitle="Оберіть які методи оплати ви приймаєте" />

                  <div className="space-y-3">
                    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${shopData.cashOnDelivery ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      onClick={() => set('cashOnDelivery', !shopData.cashOnDelivery)}>
                      <span className="text-2xl">💵</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">Готівка при отриманні</p>
                        <p className="text-xs text-gray-500">Клієнт платить кур'єру або при самовивізі</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${shopData.cashOnDelivery ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                        {shopData.cashOnDelivery && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                    </div>

                    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${shopData.cardOnDelivery ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      onClick={() => set('cardOnDelivery', !shopData.cardOnDelivery)}>
                      <span className="text-2xl">💳</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">Картка при отриманні</p>
                        <p className="text-xs text-gray-500">Термінал у кур'єра або при самовивізі</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${shopData.cardOnDelivery ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                        {shopData.cardOnDelivery && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                    </div>

                    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${shopData.monojarUrl ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      onClick={() => !shopData.monojarUrl && set('monojarUrl', 'https://')}>
                      <span className="text-2xl">🏦</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">Monobank Jar</p>
                        <p className="text-xs text-gray-500 mb-2">Клієнт переводить на банку перед отриманням</p>
                        <input type="url" value={shopData.monojarUrl} onChange={e => set('monojarUrl', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-green-400 outline-none bg-white"
                          placeholder="https://send.monobank.ua/jar/..." />
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${shopData.monojarUrl && shopData.monojarUrl !== 'https://' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                        {shopData.monojarUrl && shopData.monojarUrl !== 'https://' && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-500">
                    💡 Клієнт бачить активні методи оплати на сторінці оформлення замовлення. Рекомендуємо увімкнути принаймні один варіант.
                  </div>
                </>}

                {/* ══════════ ORDERS ══════════ */}
                {activeTab === 'orders' && <>
                  <SectionTitle icon="📦" title="Замовлення" subtitle="Як приймаються та обробляються замовлення" />

                  <div className="space-y-2">
                    <Toggle label="Автоматичне підтвердження" hint="Замовлення підтверджуються одразу без вашого схвалення" checked={shopData.autoConfirmOrders} onChange={v => set('autoConfirmOrders', v)} />
                    <Toggle label="Вимагати email клієнта" hint="Поле email обов'язкове при оформленні замовлення" checked={shopData.requireCustomerEmail} onChange={v => set('requireCustomerEmail', v)} />
                    <Toggle label="Показувати відстеження замовлення" hint="Клієнти можуть перевірити статус за номером телефону" checked={shopData.showOrderTracking} onChange={v => set('showOrderTracking', v)} />
                  </div>

                  <hr className="border-gray-100" />

                  <Field label="Префікс номера замовлення" hint="Наприклад: FL-001, KVITY-001, SHOP-001">
                    <div className="flex items-center gap-3 max-w-xs">
                      <input type="text" value={shopData.orderIdPrefix} onChange={e => set('orderIdPrefix', e.target.value.toUpperCase().slice(0, 6))} className={`${inputCls} font-mono`} placeholder="FL" maxLength={6} />
                      <span className="text-sm text-gray-400 font-mono whitespace-nowrap">→ {shopData.orderIdPrefix || 'FL'}-001</span>
                    </div>
                  </Field>

                  <Field label="Поведінка коли букет відсутній" hint="Що відображається клієнтам якщо букет закінчився">
                    <select value={shopData.outOfStockBehavior} onChange={e => set('outOfStockBehavior', e.target.value)} className={inputCls}>
                      <option value="show_unavailable">Показати як недоступний (з міткою)</option>
                      <option value="hide">Приховати з каталогу повністю</option>
                      <option value="show">Показати і дозволити замовити</option>
                    </select>
                  </Field>

                  <Field label="Поріг запасу для сповіщення" hint="Сповіщення коли залишилося менше X стебел квітки">
                    <div className="flex items-center gap-3 max-w-xs">
                      <input type="number" min="0" max="100" value={shopData.stockAlertThreshold} onChange={e => set('stockAlertThreshold', parseInt(e.target.value) || 0)}
                        className={inputCls} />
                      <span className="text-sm text-gray-400 whitespace-nowrap">стебел</span>
                    </div>
                  </Field>

                  <hr className="border-gray-100" />
                  <SectionTitle icon="📧" title="Email сповіщення" subtitle="Налаштуйте хто і коли отримує листи" />

                  <div className="space-y-3">
                    <Toggle label="Лист клієнту при замовленні" hint="Клієнт отримує підтвердження на свій email після оформлення замовлення"
                      checked={shopData.customerEmailNotifications} onChange={v => set('customerEmailNotifications', v)} />
                    <Toggle label="Сповіщення власнику на email" hint="Ви отримуєте лист кожного разу при новому замовленні"
                      checked={shopData.orderNotifyEmailEnabled} onChange={v => set('orderNotifyEmailEnabled', v)} />
                    {shopData.orderNotifyEmailEnabled && (
                      <Field label="Email для сповіщень власника">
                        <input type="email" value={shopData.orderNotifyEmail} onChange={e => set('orderNotifyEmail', e.target.value)} className={inputCls} placeholder="orders@yourshop.com" />
                      </Field>
                    )}
                  </div>
                </>}

                {/* ══════════ DISCOUNTS ══════════ */}
                {activeTab === 'discounts' && (
                  <DiscountsTab currency={shopData.currency} />
                )}

                {/* ══════════ SEO ══════════ */}
                {activeTab === 'seo' && <>
                  <SectionTitle icon="🔍" title="SEO та пошукові системи" subtitle="Як ваш магазин відображається в Google та соціальних мережах" />

                  <Field label="SEO-заголовок" hint="Показується у вкладці браузера і результатах пошуку (макс. 60 символів)">
                    <input type="text" value={shopData.seoTitle} onChange={e => set('seoTitle', e.target.value)} maxLength={60} className={inputCls} placeholder={`${shopData.name} — квіти та букети`} />
                    <div className="flex justify-end mt-1"><span className={`text-xs ${shopData.seoTitle.length > 55 ? 'text-amber-600' : 'text-gray-400'}`}>{shopData.seoTitle.length}/60</span></div>
                  </Field>
                  <Field label="SEO-опис" hint="Короткий опис у результатах пошуку (макс. 155 символів)">
                    <textarea rows={3} value={shopData.seoDescription} onChange={e => set('seoDescription', e.target.value)} maxLength={155} className={inputCls} placeholder="Замовте свіжі квіти та букети з доставкою по Луцьку..." />
                    <div className="flex justify-end mt-1"><span className={`text-xs ${shopData.seoDescription.length > 145 ? 'text-amber-600' : 'text-gray-400'}`}>{shopData.seoDescription.length}/155</span></div>
                  </Field>
                  <Field label="Ключові слова" hint="Через кому. Допомагають пошуковикам зрозуміти тематику">
                    <input type="text" value={shopData.seoKeywords} onChange={e => set('seoKeywords', e.target.value)} className={inputCls} placeholder="квіти Луцьк, букети доставка, троянди на замовлення" />
                  </Field>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Попередній перегляд у Google</p>
                    <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
                      <p className="text-[#1a0dab] text-lg hover:underline cursor-pointer leading-tight">{seoTitle}</p>
                      <p className="text-xs text-[#006621] mt-0.5">flowergoua.com/{seoUrlSlug}</p>
                      <p className="text-sm text-[#545454] leading-relaxed mt-1">{seoDesc}</p>
                    </div>
                  </div>
                </>}

                {/* ══════════ TELEGRAM ══════════ */}
                {activeTab === 'telegram' && <>
                  <SectionTitle icon="✈️" title="Telegram сповіщення" subtitle="Отримуйте замовлення і керуйте ними прямо в Telegram" />
                  {!plan.allowTelegram ? <PlanLockBanner feature="Telegram сповіщення" requiredPlan="basic" /> : (
                    <>
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 space-y-3">
                        <p className="font-bold text-blue-900">📱 Як підключити — 4 кроки:</p>
                        {[
                          <>Знайдіть бота <a href="https://t.me/flower12go_bot" target="_blank" className="font-bold underline">@flower12go_bot</a> в Telegram</>,
                          <>Натисніть <strong>▶ Start</strong></>,
                          <>Введіть <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">/getchatid</code></>,
                          'Скопіюйте число і вставте нижче',
                        ].map((text, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-blue-200 text-blue-900 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-sm text-blue-700">{text}</span>
                          </div>
                        ))}
                      </div>
                      {telegramConnected ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-green-800">✅ Telegram підключено!</p>
                            <p className="text-sm text-green-600 mt-0.5">Chat ID: <code className="bg-green-100 px-1.5 py-0.5 rounded font-mono">{telegramChatId}</code></p>
                          </div>
                          <button type="button" onClick={async () => {
                            setTelegramLoading(true)
                            try { await fetch('/api/telegram/connect', { method: 'DELETE' }); setTelegramConnected(false); setTelegramChatId('') }
                            catch { setTelegramError('Помилка') }
                            finally { setTelegramLoading(false) }
                          }} disabled={telegramLoading} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200">Відключити</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Field label="Telegram Chat ID">
                            <input type="text" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} className={`${inputCls} font-mono`} placeholder="123456789" />
                          </Field>
                          <button type="button" disabled={telegramLoading || !telegramChatId.trim()} onClick={async () => {
                            setTelegramLoading(true); setTelegramError(''); setTelegramMsg('')
                            try {
                              const res  = await fetch('/api/telegram/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: telegramChatId.trim() }) })
                              const data = await res.json()
                              if (!res.ok) throw new Error(data.error)
                              setTelegramConnected(true); setTelegramMsg(data.message)
                            } catch (err: any) { setTelegramError(err.message) }
                            finally { setTelegramLoading(false) }
                          }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                            {telegramLoading ? 'Підключаємо...' : '🔗 Підключити Telegram'}
                          </button>
                        </div>
                      )}
                      {telegramMsg   && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{telegramMsg}</div>}
                      {telegramError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{telegramError}</div>}
                    </>
                  )}
                </>}

                {/* ══════════ LEGAL ══════════ */}
                {activeTab === 'legal' && <>
                  <SectionTitle icon="📄" title="Правові документи" subtitle="Умови повернення та правила використання" />

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-800">
                    <p className="font-bold mb-1">⚖️ Навіщо це потрібно?</p>
                    <p className="text-xs text-amber-700">Чіткі умови повернення зменшують кількість спорів з клієнтами та підвищують довіру. Посилання на умови можна розмістити в підвалі вашого магазину.</p>
                  </div>

                  <Field label="Умови повернення" hint="Ваша політика щодо повернення та обміну квітів">
                    <textarea rows={6} value={shopData.refundPolicy} onChange={e => set('refundPolicy', e.target.value)} className={inputCls}
                      placeholder="Свіжі квіти поверненню та обміну не підлягають. У випадку отримання неякісного товару — будь ласка, зробіть фото та зверніться до нас протягом 2 годин після отримання..." />
                    <p className="text-xs text-gray-400 mt-1">{shopData.refundPolicy.length} символів</p>
                  </Field>

                  <Field label="Посилання на умови використання" hint="Зовнішня сторінка з вашими правилами (необов'язково)">
                    <input type="url" value={shopData.termsUrl} onChange={e => set('termsUrl', e.target.value)} className={inputCls} placeholder="https://yoursite.com/terms" />
                  </Field>
                </>}

                {/* ══════════ DANGER ══════════ */}
                {activeTab === 'danger' && <>
                  <SectionTitle icon="⚠️" title="Небезпечна зона" subtitle="Ці дії необоротні" />
                  <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50">
                    <h3 className="text-base font-bold text-red-800 mb-1">🚫 Видалити магазин та акаунт</h3>
                    <p className="text-sm text-red-700 mb-4 leading-relaxed">Це назавжди видалить ваш магазин, усі букети, замовлення, підписки та ваш акаунт. Без можливості відновлення.</p>
                    <p className="text-sm font-semibold text-red-800 mb-2">Напишіть «ВИДАЛИТИ» для підтвердження:</p>
                    <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="ВИДАЛИТИ"
                      className="w-full border-2 border-red-300 rounded-xl px-4 py-2.5 text-sm font-mono mb-3 focus:border-red-500 outline-none bg-white" />
                    {deleteError && <p className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg mb-3">{deleteError}</p>}
                    <button type="button" onClick={handleDelete} disabled={deleteConfirm !== 'ВИДАЛИТИ' || deleteLoading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-colors">
                      {deleteLoading ? 'Видаляємо...' : '🗑️ Назавжди видалити'}
                    </button>
                  </div>
                </>}

              </div>

              {/* Save bar */}
              {activeTab !== 'danger' && (
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white rounded-2xl shadow-sm px-5 py-4">
                  <button type="submit" disabled={loading || uploading !== null}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md text-sm">
                    {loading ? 'Зберігаємо...' : '💾 Зберегти зміни'}
                  </button>
                  <button type="button" onClick={load} disabled={loading}
                    className="w-full sm:w-auto px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm">
                    Скинути
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Color Picker sub-component ────────────────────────────────────────────────
function ColorPicker({ primaryColor, accentColor, shopName, onPrimary, onAccent }: {
  primaryColor: string; accentColor: string; shopName: string; onPrimary: (v: string) => void; onAccent: (v: string) => void
}) {
  const [tab, setTab] = useState<'presets' | 'custom'>('presets')
  const active = COLOR_THEMES.find(t => t.primary.toLowerCase() === primaryColor.toLowerCase() && t.accent.toLowerCase() === accentColor.toLowerCase())

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Колірна тема</p>
      <p className="text-xs text-gray-400 mb-3">Кольори кнопок, значків і градієнтів</p>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {(['presets', 'custom'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'presets' ? '🎨 Готові теми' : '✏️ Свій колір'}
          </button>
        ))}
      </div>
      {tab === 'presets' && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {COLOR_THEMES.map(theme => {
            const isActive = active?.name === theme.name
            return (
              <button key={theme.name} type="button" onClick={() => { onPrimary(theme.primary); onAccent(theme.accent) }}
                className={`flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all ${isActive ? 'border-gray-900 shadow-lg scale-105' : 'border-transparent hover:border-gray-300'}`}>
                <div className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
                  {isActive && <span className="text-white text-lg">✓</span>}
                </div>
                <span className="text-xs text-gray-600 font-medium text-center leading-tight">{theme.name}</span>
              </button>
            )
          })}
        </div>
      )}
      {tab === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: 'Основний колір', hint: 'Кнопки та акценти', val: primaryColor, onChange: onPrimary, swatches: ['#ec4899','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#1f2937'] },
            { label: 'Акцентний колір', hint: 'Градієнти', val: accentColor, onChange: onAccent, swatches: ['#a855f7','#6366f1','#06b6d4','#10b981','#84cc16','#f97316','#ec4899','#4b5563'] },
          ].map(({ label, hint, val, onChange, swatches }) => (
            <div key={label}>
              <p className="text-sm font-semibold text-gray-700 mb-0.5">{label}</p>
              <p className="text-xs text-gray-400 mb-2">{hint}</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-12 h-12 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer shadow-sm flex-shrink-0" style={{ background: val }}>
                  <input type="color" value={val} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <input type="text" value={val} onChange={e => onChange(e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono focus:border-pink-400 outline-none" maxLength={7} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {swatches.map(c => (
                  <button key={c} type="button" onClick={() => onChange(c)} className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${val === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/25 rounded-lg flex items-center justify-center text-white font-bold">{shopName.charAt(0) || '🌸'}</div>
            <span className="text-white font-semibold text-sm">{shopName || 'Назва магазину'}</span>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">Переглянути</div>
            <div className="bg-white text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ color: primaryColor }}>Замовити</div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-1.5 text-xs text-gray-400 text-center">{primaryColor} → {accentColor}</div>
      </div>
    </div>
  )
}
