'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PLANS, getPlanConfig } from '@/lib/plans'

function validatePasswordLive(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
  return checks
}

function validateEmailLive(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [planSlug, setPlanSlug] = useState<string>('free')
  const [account, setAccount] = useState({ email: '', password: '' })
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [shop, setShop] = useState({ shopName: '', location: '', about: '', workingHours: '' })
  const [payment, setPayment] = useState({ cardNumber: '', cardExpiry: '', cardCvc: '', cardHolderName: '' })

  const plan = getPlanConfig(planSlug)
  const isPaid = plan.price > 0
  const totalSteps = isPaid ? 5 : 4

  const pwChecks = validatePasswordLive(account.password)
  const pwAllGood = Object.values(pwChecks).every(Boolean)
  const emailValid = validateEmailLive(account.email)

  const goNext = () => { setError(''); setStep(prev => (prev < totalSteps ? (prev + 1) as any : prev)) }
  const goBack = () => { setError(''); setStep(prev => (prev > 1 ? (prev - 1) as any : prev)) }

  const handlePaymentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      if (value.length > 19) return
    }
    if (name === 'cardExpiry') {
      value = value.replace(/\D/g, '')
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4)
      if (value.length > 5) return
    }
    if (name === 'cardCvc') value = value.replace(/\D/g, '').slice(0, 4)
    setPayment(prev => ({ ...prev, [name]: value }))
  }

  const handleContinue = () => {
    setError('')
    if (step === 2) {
      if (!account.email || !emailValid) { setError('Please enter a valid email address'); return }
      if (!account.password || !pwAllGood) { setError('Please fix your password before continuing'); return }
    }
    if (step === 3 && !shop.shopName.trim()) { setError('Please enter your shop name'); return }
    if (step === 4 && isPaid) {
      if (!payment.cardHolderName || !payment.cardNumber || !payment.cardExpiry || !payment.cardCvc) {
        setError('Please fill in all card details')
        return
      }
    }
    goNext()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shop.shopName,
          email: account.email,
          password: account.password,
          planSlug,
          location: shop.location || null,
          about: shop.about || null,
          workingHours: shop.workingHours || null,
          ...(isPaid ? {
            cardNumber: payment.cardNumber,
            cardExpiry: payment.cardExpiry,
            cardCvc: payment.cardCvc,
            cardHolderName: payment.cardHolderName,
          } : {})
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Signup failed')
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Set up your flower shop</h1>
            <p className="text-sm text-gray-400 mt-1">Step {step} of {totalSteps}</p>
          </div>
          {isPaid && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Selected plan</div>
              <div className="font-bold text-pink-600">{plan.name} — ${plan.price}</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative mb-6 h-2 w-full rounded-full bg-gray-100">
          <div className="absolute inset-y-0 left-0 rounded-full bg-pink-500 transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        {/* Step 1 — Choose Plan */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Choose your plan</h2>
            <p className="text-sm text-gray-400 mb-4">You can upgrade anytime from your dashboard.</p>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <button key={p.slug} type="button" onClick={() => setPlanSlug(p.slug)}
                  className={`flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                    p.slug === planSlug ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  {p.highlight && <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full self-start mb-2">Most Popular</span>}
                  <span className="font-bold text-gray-900 mb-1">{p.name}</span>
                  <span className="text-sm font-semibold text-pink-600 mb-1">{p.priceLabel}</span>
                  <p className="text-xs text-gray-500 mb-3">{p.tagline}</p>
                  <p className="mt-auto text-xs text-gray-400">Up to {p.maxBouquets} bouquets</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Account with live validation */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Create your account</h2>
            <p className="text-sm text-gray-400 mb-4">You'll use this email to sign in to your dashboard.</p>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={account.email}
                onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                onBlur={() => setEmailTouched(true)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  emailTouched && account.email
                    ? emailValid ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                    : 'border-gray-200 focus:border-pink-400'
                }`}
                placeholder="you@flower-shop.com" />
              {emailTouched && account.email && !emailValid && (
                <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
              )}
              {emailTouched && account.email && emailValid && (
                <p className="text-xs text-green-600 mt-1">✓ Looks good!</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required value={account.password}
                onChange={e => { setAccount(p => ({ ...p, password: e.target.value })); setPasswordTouched(true) }}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  passwordTouched && account.password
                    ? pwAllGood ? 'border-green-400 bg-green-50' : 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 focus:border-pink-400'
                }`}
                placeholder="Create a strong password" />

              {/* Live password requirements */}
              {passwordTouched && (
                <div className="mt-2 space-y-1">
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
                    { key: 'lowercase', label: 'One lowercase letter (a-z)' },
                    { key: 'number', label: 'One number (0-9)' },
                    { key: 'special', label: 'One special character (!@#$...)' },
                  ].map(({ key, label }) => (
                    <div key={key} className={`flex items-center gap-2 text-xs ${pwChecks[key as keyof typeof pwChecks] ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{pwChecks[key as keyof typeof pwChecks] ? '✓' : '○'}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Shop Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Name your shop</h2>
            <p className="text-sm text-gray-400 mb-4">This appears at the top of your public shop page.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop name <span className="text-red-400">*</span></label>
              <input type="text" required value={shop.shopName}
                onChange={e => setShop(p => ({ ...p, shopName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
                placeholder="Rosy Corner Florist" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-gray-400">(optional)</span></label>
              <input type="text" value={shop.location}
                onChange={e => setShop(p => ({ ...p, location: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
                placeholder="123 Rose Street, Kyiv" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About your shop <span className="text-gray-400">(optional)</span></label>
              <textarea rows={3} value={shop.about}
                onChange={e => setShop(p => ({ ...p, about: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none resize-none"
                placeholder="Tell customers about your shop..." />
            </div>
          </div>
        )}

        {/* Step 4 — Payment (paid plans only) */}
        {step === 4 && isPaid && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">💳 Payment Details</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">{plan.name} Plan — ${plan.price}</p>
              <p>Your payment will be verified manually within 24 hours. You'll get an email once your plan is activated.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
              <input type="text" name="cardHolderName" required value={payment.cardHolderName}
                onChange={handlePaymentInput}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
                placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" name="cardNumber" required value={payment.cardNumber}
                onChange={handlePaymentInput}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono tracking-wider"
                placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input type="text" name="cardExpiry" required value={payment.cardExpiry}
                  onChange={handlePaymentInput}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono"
                  placeholder="MM/YY" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input type="text" name="cardCvc" required value={payment.cardCvc}
                  onChange={handlePaymentInput}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono"
                  placeholder="123" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex items-start gap-2">
              <span>🔒</span>
              <span>Your card details are stored securely and only used for manual verification. We never charge automatically.</span>
            </div>
          </div>
        )}

        {/* Final step — Confirm */}
        {((step === 4 && !isPaid) || (step === 5 && isPaid)) && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">✅ Confirm & Create Shop</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm mb-6 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-gray-900">{plan.name} {isPaid ? `— $${plan.price}` : '(Free)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-800">{account.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shop name</span>
                <span className="font-semibold text-gray-900">{shop.shopName}</span>
              </div>
              {shop.location && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-800">{shop.location}</span>
                </div>
              )}
              {isPaid && payment.cardNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Card</span>
                  <span className="text-gray-800">•••• {payment.cardNumber.replace(/\s/g, '').slice(-4)}</span>
                </div>
              )}
            </div>
            {isPaid && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800 mb-4">
                ⏳ After signup your account will be on the free plan until your payment is verified (usually within 24h).
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-pink-600 text-white py-3 rounded-xl font-semibold hover:bg-pink-700 disabled:opacity-50 transition-colors text-sm">
              {loading ? 'Creating your shop...' : '🌸 Create My Shop'}
            </button>
          </form>
        )}

        {/* Navigation */}
        {step < totalSteps && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
            <button type="button" onClick={goBack} disabled={step === 1}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">
              ← Back
            </button>
            <button type="button" onClick={handleContinue}
              className="bg-pink-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-pink-700 transition-colors">
              Continue →
            </button>
          </div>
        )}
        {step > 1 && step === totalSteps && (
          <div className="flex items-center justify-start border-t border-gray-100 pt-4 mt-4">
            <button type="button" onClick={goBack}
              className="text-sm text-gray-400 hover:text-gray-600">
              ← Back
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-pink-600 hover:text-pink-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div></div>}>
      <SignupForm />
    </Suspense>
  )
}
