'use client'

import { useState, useEffect } from 'react'
import { PLANS } from '@/lib/plans'
import { useRouter } from 'next/navigation'

export default function SubscriptionPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardHolderName: ''
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions')
      const data = await res.json()
      if (data.subscriptions) {
        setSubscriptions(data.subscriptions)
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target

    // Format card number with spaces
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      if (value.length > 19) return
    }

    // Format expiry as MM/YY
    if (name === 'cardExpiry') {
      value = value.replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4)
      }
      if (value.length > 5) return
    }

    // Format CVC
    if (name === 'cardCvc') {
      value = value.replace(/\D/g, '').slice(0, 4)
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: selectedPlan,
          ...formData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment')
      }

      setSuccess(data.message)
      setFormData({
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
        cardHolderName: ''
      })
      setSelectedPlan('')
      
      // Refresh subscriptions
      setTimeout(() => {
        fetchSubscriptions()
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const paidPlans = PLANS.filter(p => p.price > 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Plans
        </h1>
        <p className="text-gray-600">
          Upgrade your plan to unlock more features
        </p>
      </div>

      {/* Current Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.plan.name}</h3>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`font-medium ${
                        sub.status === 'active' ? 'text-green-600' : 
                        sub.status === 'pending' ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`}>{sub.status}</span>
                    </p>
                    {sub.expiryDate && (
                      <p className="text-sm text-gray-600">
                        Expires: {new Date(sub.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {sub.payment && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {sub.payment.cardType} •••• {sub.payment.cardLast4}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${sub.payment.amount}
                      </p>
                    </div>
                  )}
                </div>
                {sub.status === 'pending' && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
                    Your payment is being verified. You'll receive an email once approved.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Plan Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Choose a Plan</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {paidPlans.map((plan) => (
            <button
              key={plan.slug}
              type="button"
              onClick={() => setSelectedPlan(plan.slug)}
              className={`text-left border-2 rounded-xl p-6 transition-all ${
                selectedPlan === plan.slug
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${plan.price}</div>
                  <div className="text-sm text-gray-600">
                    {plan.durationDays === 365 ? '/year' : '/month'}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{plan.tagline}</p>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Form */}
      {selectedPlan && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter your card details below. Your payment will be verified manually before activation.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Holder Name
              </label>
              <input
                type="text"
                name="cardHolderName"
                required
                value={formData.cardHolderName}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-primary-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                required
                value={formData.cardNumber}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-primary-500"
                placeholder="1234 5678 9012 3456"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="cardExpiry"
                  required
                  value={formData.cardExpiry}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="MM/YY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  name="cardCvc"
                  required
                  value={formData.cardCvc}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="123"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <p className="font-medium mb-1">🔒 Secure Payment Process</p>
              <p>Your payment details will be securely stored and verified manually. You'll receive an email notification once your subscription is activated.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : `Submit Payment`}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
