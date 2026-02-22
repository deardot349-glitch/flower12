'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PLANS, getPlanConfig } from '@/lib/plans'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [planSlug, setPlanSlug] = useState<string>('free')
  const [account, setAccount] = useState({ email: '', password: '' })
  const [shop, setShop] = useState({
    shopName: '',
    location: '',
    about: '',
    workingHours: '',
  })

  const plan = getPlanConfig(planSlug)

  const goNext = () => {
    setError('')
    setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev))
  }

  const goBack = () => {
    setError('')
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev))
  }

  const handleSubmitFinal = async (e: React.FormEvent) => {
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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8">
        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Set up your flower shop
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              A calm, guided onboarding. You&apos;ll be ready to share your link in a few minutes.
            </p>
          </div>
          <div className="text-xs font-medium text-gray-500">
            Step {step} of 4
          </div>
        </div>

        <div className="relative mb-6 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary-500 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="mb-6">
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                1. Choose your plan
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                You can change plans later. All plans include a shop page, bouquet catalog,
                and basic orders.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {PLANS.map((p) => {
                  const selected = p.slug === planSlug
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => setPlanSlug(p.slug)}
                      className={`flex flex-col rounded-xl border p-4 text-left text-sm ${
                        selected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="font-semibold text-gray-900 mb-1">
                        {p.name}
                      </span>
                      <span className="text-xs text-gray-500 mb-2">
                        {p.priceLabel}
                      </span>
                      <p className="text-xs text-gray-600 mb-3">{p.tagline}</p>
                      <p className="mt-auto text-[11px] text-gray-500">
                        Up to {p.maxBouquets} bouquets ·{' '}
                        {p.allowProfileDetails ? 'Full profile' : 'Basic profile'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                2. Create your account
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Use an email your customers already know. You&apos;ll use this to sign in
                to your dashboard.
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={account.email}
                    onChange={(e) =>
                      setAccount((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="you@flower-shop.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={account.password}
                    onChange={(e) =>
                      setAccount((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                3. Name your shop
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                This will appear at the top of your public shop page and in your link.
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="shopName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Shop name
                  </label>
                  <input
                    id="shopName"
                    type="text"
                    required
                    value={shop.shopName}
                    onChange={(e) =>
                      setShop((prev) => ({ ...prev, shopName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Rosy Corner Florist"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmitFinal}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                4. Optional: shop details
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                These details help customers trust your shop.{' '}
                {plan.allowProfileDetails
                  ? 'They will be shown on your public shop page.'
                  : 'Upgrade later to show a richer profile on your public page.'}
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Location (optional)
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={shop.location}
                    onChange={(e) =>
                      setShop((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Downtown Lisbon, Rua das Flores 12"
                  />
                </div>

                <div>
                  <label
                    htmlFor="workingHours"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Working hours (optional)
                  </label>
                  <input
                    id="workingHours"
                    type="text"
                    value={shop.workingHours}
                    onChange={(e) =>
                      setShop((prev) => ({ ...prev, workingHours: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Mon–Sat 9:00–19:00"
                  />
                </div>

                <div>
                  <label
                    htmlFor="about"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    About your shop (optional)
                  </label>
                  <textarea
                    id="about"
                    rows={3}
                    value={shop.about}
                    onChange={(e) =>
                      setShop((prev) => ({ ...prev, about: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Tell customers who you are, what you specialize in, and why they’ll love ordering from you."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creating your shop…' : 'Finish and create my shop'}
              </button>
            </form>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Back
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Continue
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
