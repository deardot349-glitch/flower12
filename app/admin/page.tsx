'use client'

import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = () => {
    if (secret) {
      setAuthenticated(true)
      fetchPayments()
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payments?secret=${secret}`)
      const data = await res.json()
      
      if (res.ok) {
        setPayments(data.payments || [])
      } else {
        setMessage(data.error || 'Failed to fetch payments')
        setAuthenticated(false)
      }
    } catch (err) {
      setMessage('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (paymentId: string, action: 'approve' | 'reject', notes?: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          paymentId,
          action,
          notes
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(data.message)
        fetchPayments()
      } else {
        setMessage(data.error || 'Action failed')
      }
    } catch (err) {
      setMessage('Failed to process action')
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Secret Key
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter admin secret"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700"
            >
              Login
            </button>
            {message && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage pending payments and subscriptions</p>
          </div>
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop / Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No pending payments
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.subscription.shop.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.subscription.shop.owner.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.subscription.plan.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.subscription.plan.durationDays} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${payment.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.cardHolderName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.cardType} •••• {payment.cardLast4}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(payment.id, 'approve')}
                            disabled={loading}
                            className="bg-green-600 text-white px-3 py-1 rounded font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(payment.id, 'reject', 'Payment verification failed')}
                            disabled={loading}
                            className="bg-red-600 text-white px-3 py-1 rounded font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
