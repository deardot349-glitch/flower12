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

export default function CustomBouquetPage({ params }: { params: { shopSlug: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stockFlowers, setStockFlowers] = useState<StockFlower[]>([])
  const [wrappingOptions, setWrappingOptions] = useState<WrappingOption[]>([])
  const [customExtras, setCustomExtras] = useState<CustomExtra[]>([])
  const [currency, setCurrency] = useState('UAH')
  const [shopName, setShopName] = useState('')

  // Bouquet state
  const [selectedFlowers, setSelectedFlowers] = useState<SelectedFlower[]>([])
  const [selectedWrapping, setSelectedWrapping] = useState<WrappingOption | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])
  const [specialInstructions, setSpecialInstructions] = useState('')

  // Checkout
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
      if (!res.ok) {
        router.replace(`/${params.shopSlug}`)
        return
      }
      setStockFlowers(data.stockFlowers || [])
      setWrappingOptions(data.wrappingOptions || [])
      setCustomExtras(data.customExtras || [])
      if (data.currency) setCurrency(data.currency)
      if (data.shopName) setShopName(data.shopName)
    } catch {
      router.replace(`/${params.shopSlug}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Flower helpers ────────────────────────────────────────────────────────────
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

  // ── Extra helpers ─────────────────────────────────────────────────────────────
  const toggleExtra = (extra: CustomExtra) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.id === extra.id)
      if (exists) return prev.filter(e => e.id !== extra.id)
      return [...prev, { id: extra.id, name: extra.name, price: extra.price }]
    })
  }

  // ── Price calculation ─────────────────────────────────────────────────────────
  const totalPrice = (
    selectedFlowers.reduce((s, f) => s + f.pricePerStem * f.quantity, 0) +
    (selectedWrapping?.price || 0) +
    selectedExtras.reduce((s, e) => s + e.price, 0)
  )

  const totalStems = selectedFlowers.reduce((s, f) => s + f.quantity, 0)

  const canCheckout = selectedFlowers.length > 0

  // ── Submit ────────────────────────────────────────────────────────────────────
  const submitOrder = async () => {
    if (!formData.customerName.trim() || !formData.phone.trim()) {
      setErrorMsg("Введіть ім'я та телефон")
      return
    }
    if (deliveryMethod === 'delivery' && (!formData.address.trim() || !formData.city.trim())) {
      setErrorMsg('Введіть адресу доставки')
      return
    }
    setErrorMsg('')
    setSubmitStatus('loading')
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
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
          } : null,
          customBouquet: {
            flowers: selectedFlowers,
            wrapping: selectedWrapping,
            extras: selectedExtras,
            specialInstructions,
            totalPrice,
          },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitStatus('success')
        setTimeout(() => router.push(`/${params.shopSlug}`), 2500)
      } else {
        setErrorMsg(data.error || 'Помилка замовлення')
        setSubmitStatus('error')
      }
    } catch {
      setErrorMsg('Помилка зʼєднання. Спробуйте ще раз.')
      setSubmitStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
          <p className="text-gray-500">Завантаження...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button onClick={() => router.push(`/${params.shopSlug}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-3 text-sm">
            ← Назад до магазину
          </button>
          <h1 className="text-2xl md:text-3xl font-black">🎨 Створити власний букет</h1>
          <p className="text-white/80 text-sm mt-1">Оберіть квіти, обгортку та додатки</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Builder ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Step 1: Flowers */}
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-black">1</span>
                Оберіть квіти
              </h2>
              {stockFlowers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Квіти для кастому ще не додано</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stockFlowers.map(flower => {
                    const sel = selectedFlowers.find(f => f.id === flower.id)
                    return (
                      <div key={flower.id}
                        className={`border-2 rounded-xl p-3 transition-all ${sel ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'}`}>
                        <div className="relative h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg mb-2 overflow-hidden">
                          {flower.imageUrl
                            ? <Image src={flower.imageUrl} alt={flower.name} fill className="object-cover" />
                            : <div className="absolute inset-0 flex items-center justify-center text-2xl">🌸</div>}
                        </div>
                        <p className="font-bold text-sm text-gray-900 truncate">{flower.name}</p>
                        {flower.color && <p className="text-xs text-gray-400">{flower.color}</p>}
                        <p className="text-sm font-black text-pink-600 mt-0.5">{sym}{flower.pricePerStem.toFixed(2)}/шт</p>
                        {sel ? (
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => setFlowerQty(flower.id, sel.quantity - 1)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold py-1">−</button>
                            <span className="font-black text-gray-900 text-sm w-4 text-center">{sel.quantity}</span>
                            <button onClick={() => setFlowerQty(flower.id, sel.quantity + 1)}
                              disabled={sel.quantity >= flower.stockCount}
                              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded text-sm font-bold py-1 disabled:opacity-40">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addFlower(flower)}
                            className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-bold py-1.5">
                            Додати
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Step 2: Wrapping */}
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-black">2</span>
                Упаковка
                <span className="text-xs text-gray-400 font-normal">(необов'язково)</span>
              </h2>
              {wrappingOptions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Варіанти упаковки не додано</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {wrappingOptions.map(w => (
                    <button key={w.id} onClick={() => setSelectedWrapping(prev => prev?.id === w.id ? null : w)}
                      className={`border-2 rounded-xl p-3 text-left transition-all ${selectedWrapping?.id === w.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'}`}>
                      <div className="relative h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-2 overflow-hidden">
                        {w.imageUrl
                          ? <Image src={w.imageUrl} alt={w.name} fill className="object-cover" />
                          : <div className="absolute inset-0 flex items-center justify-center text-xl">🎁</div>}
                      </div>
                      <p className="font-bold text-sm text-gray-900 truncate">{w.name}</p>
                      <p className="text-sm font-black text-pink-600">{w.price === 0 ? 'Безкоштовно' : `+${sym}${w.price.toFixed(2)}`}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Step 3: Custom Extras */}
            {customExtras.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-black">3</span>
                  🎀 Додатки
                  <span className="text-xs text-gray-400 font-normal">(необов'язково)</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {customExtras.map(ex => {
                    const isSelected = selectedExtras.some(e => e.id === ex.id)
                    return (
                      <button key={ex.id} onClick={() => toggleExtra(ex)}
                        className={`border-2 rounded-xl p-3 text-left transition-all ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                        {ex.imageUrl && (
                          <div className="relative h-16 rounded-lg mb-2 overflow-hidden">
                            <Image src={ex.imageUrl} alt={ex.name} fill className="object-cover" />
                          </div>
                        )}
                        {!ex.imageUrl && <div className="h-10 flex items-center justify-center text-2xl mb-1">🎀</div>}
                        <p className="font-bold text-sm text-gray-900 truncate">{ex.name}</p>
                        {ex.description && <p className="text-xs text-gray-400 truncate">{ex.description}</p>}
                        <p className="text-sm font-black text-purple-600 mt-0.5">
                          {ex.price === 0 ? 'Безкоштовно' : `+${sym}${ex.price.toFixed(0)}`}
                        </p>
                        {isSelected && <p className="text-xs text-purple-600 font-bold mt-1">✓ Додано</p>}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Step 4: Instructions */}
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-black">
                  {customExtras.length > 0 ? '4' : '3'}
                </span>
                Побажання
                <span className="text-xs text-gray-400 font-normal">(необов'язково)</span>
              </h2>
              <textarea rows={3} value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-pink-400 bg-gray-50"
                placeholder="Кольорові побажання, текст на листівку, особливі прохання..." />
            </section>
          </div>

          {/* ── RIGHT: Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 sticky top-4">
              <h2 className="text-lg font-black text-gray-900 mb-4">Ваш букет</h2>

              {selectedFlowers.length === 0 ? (
                <p className="text-sm text-gray-400 italic mb-4">Квіти ще не обрані</p>
              ) : (
                <div className="space-y-1.5 mb-4">
                  {selectedFlowers.map(f => (
                    <div key={f.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{f.quantity}× {f.name}</span>
                      <span className="font-bold text-gray-900">{sym}{(f.quantity * f.pricePerStem).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedWrapping && (
                <div className="flex justify-between text-sm mb-2 text-gray-600 border-t border-gray-100 pt-2">
                  <span>🎁 {selectedWrapping.name}</span>
                  <span className="font-bold">{selectedWrapping.price === 0 ? 'Безкоштовно' : `${sym}${selectedWrapping.price.toFixed(2)}`}</span>
                </div>
              )}

              {selectedExtras.length > 0 && (
                <div className="space-y-1 mb-2 border-t border-gray-100 pt-2">
                  {selectedExtras.map(ex => (
                    <div key={ex.id} className="flex justify-between text-sm text-gray-600">
                      <span>🎀 {ex.name}</span>
                      <span className="font-bold">{ex.price === 0 ? 'Безкоштовно' : `${sym}${ex.price.toFixed(0)}`}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="mt-4 pt-3 border-t-2 border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Стебел: {totalStems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Разом:</span>
                  <span className="text-xl font-black text-pink-600">{sym}{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => { if (canCheckout) setShowCheckout(true) }}
                disabled={!canCheckout}
                className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-black text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md">
                {canCheckout ? 'Оформити замовлення →' : 'Оберіть квіти'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Оформити замовлення</h2>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Замовлення прийнято!</h3>
                <p className="text-gray-500 text-sm">Переходимо назад до магазину...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Delivery */}
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Спосіб отримання</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['pickup', 'delivery'] as const).map(m => (
                      <button key={m} onClick={() => setDeliveryMethod(m)}
                        className={`p-3 border-2 rounded-xl text-sm font-bold transition-all ${deliveryMethod === m ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600'}`}>
                        {m === 'pickup' ? '🏪 Самовивіз' : '🚚 Доставка'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact */}
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

                {/* Delivery address */}
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

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm">
                  <p className="font-bold text-gray-700 mb-2">Підсумок</p>
                  <div className="flex justify-between font-black text-base">
                    <span>Разом:</span>
                    <span className="text-green-700">{sym}{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button onClick={submitOrder} disabled={submitStatus === 'loading'}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3.5 rounded-xl font-black text-sm hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-md">
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
