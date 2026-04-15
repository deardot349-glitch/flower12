'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface StockFlower {
  id: string; name: string; color: string | null
  pricePerStem: number; stockCount: number; imageUrl: string | null
}
interface WrappingOption {
  id: string; name: string; price: number; imageUrl: string | null
}
interface CustomExtra {
  id: string; name: string; description: string | null; price: number; imageUrl: string | null
}
interface SelectedFlower {
  id: string; name: string; color: string | null; pricePerStem: number; quantity: number
}
interface SelectedExtra {
  id: string; name: string; price: number
}

const BOUQUET_SIZES = [
  { label: 'Мікро',    stems: '3–5',   icon: '🌱', hint: 'Маленький подарунок або бутоньєрка' },
  { label: 'Малий',    stems: '7–9',   icon: '💐', hint: 'Ніжний букет — день народження, побачення' },
  { label: 'Середній', stems: '11–15', icon: '🌸', hint: 'Класика — найпопулярніший розмір' },
  { label: 'Великий',  stems: '19–25', icon: '🌺', hint: 'Пишний букет — урочиста подія' },
  { label: 'XXL',      stems: '29–51', icon: '👑', hint: 'Справжнє вау — весілля, ювілей' },
]

function SizeHints({ totalStems, sym, avg }: { totalStems: number; sym: string; avg: number }) {
  const getActive = (stems: string) => {
    const [lo, hi] = stems.split('–').map(Number)
    return totalStems >= lo && totalStems <= hi
  }
  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-4 mb-5">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">💡 Орієнтовні розміри букетів</p>
      <div className="grid grid-cols-5 gap-1.5">
        {BOUQUET_SIZES.map(s => {
          const active = getActive(s.stems)
          return (
            <div key={s.label}
              className={`rounded-xl p-2 text-center transition-all cursor-default ${active ? 'bg-pink-500 text-white shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-600'}`}
              title={s.hint}>
              <div className="text-lg leading-none mb-0.5">{s.icon}</div>
              <div className={`text-xs font-black leading-tight ${active ? 'text-white' : 'text-gray-800'}`}>{s.label}</div>
              <div className={`text-[10px] leading-tight ${active ? 'text-pink-100' : 'text-gray-400'}`}>{s.stems} шт</div>
            </div>
          )
        })}
      </div>
      {totalStems > 0 && (
        <p className="text-xs text-center text-gray-500 mt-2.5">
          Ви обрали <strong className="text-pink-600">{totalStems} стебел</strong>
          {avg > 0 && <> · середня ціна стебла <strong className="text-gray-700">{sym}{avg.toFixed(0)}</strong></>}
        </p>
      )}
      {totalStems === 0 && (
        <p className="text-xs text-center text-gray-400 mt-2.5">Починайте додавати квіти — розмір визначиться автоматично</p>
      )}
    </div>
  )
}

export default function CustomBouquetPage({ params }: { params: { shopSlug: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stockFlowers, setStockFlowers] = useState<StockFlower[]>([])
  const [wrappingOptions, setWrappingOptions] = useState<WrappingOption[]>([])
  const [customExtras, setCustomExtras] = useState<CustomExtra[]>([])
  const [currency, setCurrency] = useState('UAH')
  const [shopName, setShopName] = useState('')

  const [selectedFlowers, setSelectedFlowers] = useState<SelectedFlower[]>([])
  const [selectedWrapping, setSelectedWrapping] = useState<WrappingOption | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])
  const [specialInstructions, setSpecialInstructions] = useState('')

  const [showCheckout, setShowCheckout] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [formData, setFormData] = useState({ customerName: '', phone: '', email: '', address: '', city: '', zipCode: '' })
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const sym = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  useEffect(() => { fetchData() }, [params.shopSlug])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/shop/public/${params.shopSlug}/custom-bouquet-data`)
      const data = await res.json()
      if (!res.ok) { router.replace(`/${params.shopSlug}`); return }
      setStockFlowers(data.stockFlowers || [])
      setWrappingOptions(data.wrappingOptions || [])
      setCustomExtras(data.customExtras || [])
      if (data.currency) setCurrency(data.currency)
      if (data.shopName) setShopName(data.shopName)
    } catch { router.replace(`/${params.shopSlug}`) }
    finally { setLoading(false) }
  }

  const addFlower = (flower: StockFlower) => {
    setSelectedFlowers(prev => {
      const existing = prev.find(f => f.id === flower.id)
      if (existing) return prev.map(f => f.id === flower.id ? { ...f, quantity: f.quantity + 1 } : f)
      return [...prev, { id: flower.id, name: flower.name, color: flower.color, pricePerStem: flower.pricePerStem, quantity: 1 }]
    })
  }
  const setFlowerQty = (id: string, qty: number) => {
    if (qty <= 0) setSelectedFlowers(prev => prev.filter(f => f.id !== id))
    else setSelectedFlowers(prev => prev.map(f => f.id === id ? { ...f, quantity: qty } : f))
  }
  const toggleExtra = (extra: CustomExtra) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.id === extra.id)
      if (exists) return prev.filter(e => e.id !== extra.id)
      return [...prev, { id: extra.id, name: extra.name, price: extra.price }]
    })
  }

  const totalPrice = (
    selectedFlowers.reduce((s, f) => s + f.pricePerStem * f.quantity, 0) +
    (selectedWrapping?.price || 0) +
    selectedExtras.reduce((s, e) => s + e.price, 0)
  )
  const totalStems = selectedFlowers.reduce((s, f) => s + f.quantity, 0)
  const avgStemPrice = totalStems > 0
    ? selectedFlowers.reduce((s, f) => s + f.pricePerStem * f.quantity, 0) / totalStems
    : 0

  const canCheckout = selectedFlowers.length > 0

  const submitOrder = async () => {
    if (!formData.customerName.trim() || !formData.phone.trim()) {
      setErrorMsg("Введіть ім'я та телефон"); return
    }
    if (deliveryMethod === 'delivery' && (!formData.address.trim() || !formData.city.trim())) {
      setErrorMsg('Введіть адресу доставки'); return
    }
    setErrorMsg(''); setSubmitStatus('loading')
    try {
      const res = await fetch('/api/custom-bouquet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: params.shopSlug,
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email || null,
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'delivery' ? {
            address: formData.address, city: formData.city, zipCode: formData.zipCode,
          } : null,
          customBouquet: {
            flowers: selectedFlowers, wrapping: selectedWrapping,
            extras: selectedExtras, specialInstructions, totalPrice,
          },
        }),
      })
      const data = await res.json()
      if (res.ok) { setSubmitStatus('success'); setTimeout(() => router.push(`/${params.shopSlug}`), 2500) }
      else { setErrorMsg(data.error || 'Помилка замовлення'); setSubmitStatus('error') }
    } catch { setErrorMsg('Помилка зʼєднання. Спробуйте ще раз.'); setSubmitStatus('error') }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
        <p className="text-gray-500">Завантаження...</p>
      </div>
    </div>
  )

  const stepNum = (n: number) => (
    <span className="w-7 h-7 bg-gradient-to-br from-pink-400 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm">{n}</span>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-pink-50/20">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-400 text-white">
        <div className="max-w-5xl mx-auto px-4 py-7">
          <button onClick={() => router.push(`/${params.shopSlug}`)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white mb-4 text-sm font-medium transition-colors">
            ← Назад до магазину
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🎨</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Власний букет</h1>
              <p className="text-white/70 text-sm mt-0.5">Оберіть квіти, упаковку та аксесуари під свій смак</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Builder ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Size hints */}
            <SizeHints totalStems={totalStems} sym={sym} avg={avgStemPrice} />

            {/* Step 1: Flowers */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2.5">
                  {stepNum(1)}
                  Оберіть квіти
                  <span className="text-xs text-gray-400 font-normal ml-1">непарна кількість виглядає найкраще</span>
                </h2>
              </div>
              <div className="p-5">
                {stockFlowers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Квіти для конструктора ще не додано</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {stockFlowers.map(flower => {
                      const sel = selectedFlowers.find(f => f.id === flower.id)
                      const stockLeft = flower.stockCount - (sel?.quantity ?? 0)
                      const isLow = flower.stockCount > 0 && flower.stockCount <= 5
                      return (
                        <div key={flower.id}
                          className={`relative border-2 rounded-xl overflow-hidden transition-all duration-200 ${sel ? 'border-pink-500 shadow-md shadow-pink-100' : 'border-gray-200 hover:border-pink-300 hover:shadow-sm'}`}>
                          {/* Image */}
                          <div className={`relative h-24 overflow-hidden ${sel ? 'bg-pink-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                            {flower.imageUrl
                              ? <Image src={flower.imageUrl} alt={flower.name} fill className="object-cover" />
                              : <div className="absolute inset-0 flex items-center justify-center text-3xl">🌸</div>}
                            {sel && (
                              <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-black">{sel.quantity}</span>
                              </div>
                            )}
                            {isLow && !sel && (
                              <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                Мало!
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-2.5">
                            <p className="font-bold text-sm text-gray-900 truncate leading-tight">{flower.name}</p>
                            {flower.color && <p className="text-[11px] text-gray-400 mb-1">{flower.color}</p>}
                            <p className="text-sm font-black text-pink-600">{sym}{flower.pricePerStem.toFixed(0)}<span className="text-[10px] font-normal text-gray-400">/шт</span></p>
                            {sel ? (
                              <div className="flex items-center gap-1.5 mt-2">
                                <button onClick={() => setFlowerQty(flower.id, sel.quantity - 1)}
                                  className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-black py-1.5 text-base leading-none transition-colors">−</button>
                                <span className="font-black text-gray-900 text-sm w-6 text-center">{sel.quantity}</span>
                                <button onClick={() => setFlowerQty(flower.id, sel.quantity + 1)}
                                  disabled={sel.quantity >= flower.stockCount}
                                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-black py-1.5 text-base leading-none disabled:opacity-40 transition-colors">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addFlower(flower)} disabled={flower.stockCount === 0}
                                className="w-full mt-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-lg text-xs font-bold py-1.5 disabled:opacity-40 transition-all shadow-sm">
                                {flower.stockCount === 0 ? 'Немає в наявності' : '+ Додати'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Wrapping */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2.5">
                  {stepNum(2)} Упаковка
                  <span className="text-xs text-gray-400 font-normal">необов'язково</span>
                </h2>
              </div>
              <div className="p-5">
                {wrappingOptions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Варіанти упаковки не додано</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* No wrapping option */}
                    <button onClick={() => setSelectedWrapping(null)}
                      className={`border-2 rounded-xl p-3 text-left transition-all ${!selectedWrapping ? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-xl">🚫</div>
                      <p className="font-bold text-sm text-gray-900">Без упаковки</p>
                      <p className="text-xs text-gray-400 font-medium">Безкоштовно</p>
                    </button>
                    {wrappingOptions.map(w => (
                      <button key={w.id} onClick={() => setSelectedWrapping(prev => prev?.id === w.id ? null : w)}
                        className={`border-2 rounded-xl p-3 text-left transition-all ${selectedWrapping?.id === w.id ? 'border-pink-500 bg-pink-50 shadow-md shadow-pink-100' : 'border-gray-200 hover:border-pink-300'}`}>
                        <div className="relative h-16 rounded-lg mb-2 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                          {w.imageUrl
                            ? <Image src={w.imageUrl} alt={w.name} fill className="object-cover" />
                            : <div className="absolute inset-0 flex items-center justify-center text-2xl">🎁</div>}
                          {selectedWrapping?.id === w.id && (
                            <div className="absolute inset-0 bg-pink-500/10 flex items-center justify-center">
                              <span className="text-pink-600 text-xl font-black">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-sm text-gray-900 truncate">{w.name}</p>
                        <p className={`text-sm font-black ${w.price > 0 ? 'text-pink-600' : 'text-green-600'}`}>
                          {w.price === 0 ? 'Безкоштовно' : `+${sym}${w.price.toFixed(0)}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Step 3: Extras */}
            {customExtras.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                  <h2 className="text-base font-black text-gray-900 flex items-center gap-2.5">
                    {stepNum(3)} Аксесуари та подарунки
                    <span className="text-xs text-gray-400 font-normal">необов'язково</span>
                  </h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {customExtras.map(ex => {
                      const isSelected = selectedExtras.some(e => e.id === ex.id)
                      return (
                        <button key={ex.id} onClick={() => toggleExtra(ex)}
                          className={`border-2 rounded-xl p-3 text-left transition-all ${isSelected ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100' : 'border-gray-200 hover:border-purple-300'}`}>
                          <div className={`relative rounded-lg mb-2 overflow-hidden flex items-center justify-center ${ex.imageUrl ? 'h-16' : 'h-10'}`}>
                            {ex.imageUrl
                              ? <Image src={ex.imageUrl} alt={ex.name} fill className="object-cover" />
                              : <span className="text-2xl">🎀</span>}
                            {isSelected && (
                              <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                                <span className="text-purple-600 text-xl font-black">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="font-bold text-sm text-gray-900 truncate">{ex.name}</p>
                          {ex.description && <p className="text-xs text-gray-400 truncate mt-0.5">{ex.description}</p>}
                          <p className={`text-sm font-black mt-1 ${ex.price > 0 ? 'text-purple-600' : 'text-green-600'}`}>
                            {ex.price === 0 ? 'Безкоштовно' : `+${sym}${ex.price.toFixed(0)}`}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Step 4: Instructions */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2.5">
                  {stepNum(customExtras.length > 0 ? 4 : 3)}
                  Побажання
                  <span className="text-xs text-gray-400 font-normal">необов'язково</span>
                </h2>
              </div>
              <div className="p-5">
                <textarea rows={3} value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
                  placeholder="Кольорова гамма, текст на листівку, особливі побажання..." />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Ніжні пастельні тони', 'Яскраві кольори', 'Тільки білі квіти', 'Подарункова листівка'].map(hint => (
                    <button key={hint} onClick={() => setSpecialInstructions(p => p ? `${p}, ${hint.toLowerCase()}` : hint)}
                      className="text-xs bg-pink-50 hover:bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-medium transition-colors">
                      + {hint}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT: Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-4 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-4">
                <h2 className="text-base font-black text-white">Ваш букет</h2>
                {totalStems > 0 && (
                  <p className="text-pink-100 text-xs mt-0.5">{totalStems} стебел · {
                    BOUQUET_SIZES.find(s => {
                      const [lo, hi] = s.stems.split('–').map(Number)
                      return totalStems >= lo && totalStems <= hi
                    })?.label ?? (totalStems > 51 ? 'XXL+' : 'Мікро')
                  }</p>
                )}
              </div>
              <div className="p-5">
                {selectedFlowers.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-2">🌿</div>
                    <p className="text-sm text-gray-400">Ще нічого не обрано</p>
                    <p className="text-xs text-gray-300 mt-1">Додавайте квіти зліва</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-4">
                    {selectedFlowers.map(f => (
                      <div key={f.id} className="flex items-center gap-2 text-sm">
                        <span className="text-pink-500 font-black text-xs w-5 text-center">{f.quantity}×</span>
                        <span className="text-gray-700 flex-1 truncate">{f.name}</span>
                        <span className="font-bold text-gray-900 flex-shrink-0">{sym}{(f.quantity * f.pricePerStem).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedWrapping && (
                  <div className="flex justify-between text-sm mb-1 text-gray-500 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1">🎁 <span className="truncate max-w-[100px]">{selectedWrapping.name}</span></span>
                    <span className="font-bold flex-shrink-0">{selectedWrapping.price === 0 ? 'Безкоштовно' : `+${sym}${selectedWrapping.price.toFixed(0)}`}</span>
                  </div>
                )}

                {selectedExtras.length > 0 && (
                  <div className="space-y-1 border-t border-gray-100 pt-3 mb-1">
                    {selectedExtras.map(ex => (
                      <div key={ex.id} className="flex justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">🎀 <span className="truncate max-w-[100px]">{ex.name}</span></span>
                        <span className="font-bold flex-shrink-0">{ex.price === 0 ? 'Безкоштовно' : `+${sym}${ex.price.toFixed(0)}`}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFlowers.length > 0 && (
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-pink-100">
                    <div className="flex justify-between items-baseline">
                      <span className="font-black text-gray-900">Разом</span>
                      <span className="text-2xl font-black text-pink-600">{sym}{totalPrice.toFixed(0)}</span>
                    </div>
                    {specialInstructions && (
                      <p className="text-[11px] text-gray-400 mt-2 italic line-clamp-2">💬 {specialInstructions}</p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { if (canCheckout) setShowCheckout(true) }}
                  disabled={!canCheckout}
                  className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3.5 rounded-xl font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md">
                  {canCheckout ? 'Оформити замовлення →' : 'Оберіть квіти'}
                </button>

                {!canCheckout && (
                  <p className="text-center text-xs text-gray-400 mt-2">Додайте хоча б одну квітку</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">Оформити замовлення</h2>
                <p className="text-sm text-gray-400 mt-0.5">{totalStems} стебел · {sym}{totalPrice.toFixed(0)}</p>
              </div>
              <button onClick={() => setShowCheckout(false)}
                className="w-9 h-9 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 flex items-center justify-center text-sm transition-colors">✕</button>
            </div>

            {submitStatus === 'success' ? (
              <div className="text-center py-10">
                <div className="text-6xl mb-4">🌸</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Замовлення прийнято!</h3>
                <p className="text-gray-400 text-sm">Повертаємося до магазину...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Спосіб отримання</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['pickup', 'delivery'] as const).map(m => (
                      <button key={m} onClick={() => setDeliveryMethod(m)}
                        className={`p-3 border-2 rounded-xl text-sm font-bold transition-all ${deliveryMethod === m ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {m === 'pickup' ? '🏪 Самовивіз' : '🚚 Доставка'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <input type="text" placeholder="Ім'я та прізвище *" value={formData.customerName}
                    onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50" />
                  <input type="tel" placeholder="Телефон *" value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50" />
                  <input type="email" placeholder="Email (необов'язково)" value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50" />
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="space-y-3">
                    <input type="text" placeholder="Вулиця та будинок *" value={formData.address}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Місто *" value={formData.city}
                        onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50" />
                      <input type="text" placeholder="Індекс" value={formData.zipCode}
                        onChange={e => setFormData(p => ({ ...p, zipCode: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50" />
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-xl p-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Квіти ({totalStems} стебел)</span>
                    <span>{sym}{selectedFlowers.reduce((s, f) => s + f.pricePerStem * f.quantity, 0).toFixed(0)}</span>
                  </div>
                  {selectedWrapping && selectedWrapping.price > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{selectedWrapping.name}</span>
                      <span>+{sym}{selectedWrapping.price.toFixed(0)}</span>
                    </div>
                  )}
                  {selectedExtras.map(ex => ex.price > 0 && (
                    <div key={ex.id} className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{ex.name}</span>
                      <span>+{sym}{ex.price.toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-base pt-2 border-t border-pink-100 mt-1">
                    <span>Разом</span>
                    <span className="text-pink-600">{sym}{totalPrice.toFixed(0)}</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">⚠️ {errorMsg}</div>
                )}

                <button onClick={submitOrder} disabled={submitStatus === 'loading'}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-black text-sm disabled:opacity-50 transition-all shadow-md">
                  {submitStatus === 'loading' ? '⏳ Надсилаємо...' : '✅ Підтвердити замовлення'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
