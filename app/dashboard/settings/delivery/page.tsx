'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface DeliveryZone {
  id: string
  name: string
  fee: number
  estimatedMinHours: number
  estimatedMaxHours: number
  sameDayAvailable: boolean
  minimumOrder: number
  active: boolean
}

export default function DeliverySettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    fee: 0,
    estimatedMinHours: 2,
    estimatedMaxHours: 4,
    sameDayAvailable: true,
    minimumOrder: 0,
    active: true,
  })

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/delivery-zones')
      const data = await res.json()
      if (data.zones) {
        setZones(data.zones)
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingZone
        ? `/api/delivery-zones/${editingZone.id}`
        : '/api/delivery-zones'
      
      const res = await fetch(url, {
        method: editingZone ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await fetchZones()
        setShowAddModal(false)
        setEditingZone(null)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save zone:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      fee: zone.fee,
      estimatedMinHours: zone.estimatedMinHours,
      estimatedMaxHours: zone.estimatedMaxHours,
      sameDayAvailable: zone.sameDayAvailable,
      minimumOrder: zone.minimumOrder,
      active: zone.active,
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery zone?')) return

    try {
      const res = await fetch(`/api/delivery-zones/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchZones()
      }
    } catch (error) {
      console.error('Failed to delete zone:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      fee: 0,
      estimatedMinHours: 2,
      estimatedMaxHours: 4,
      sameDayAvailable: true,
      minimumOrder: 0,
      active: true,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Zones</h1>
          <p className="text-sm text-gray-600 mt-1">Manage delivery areas and fees</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingZone(null)
            setShowAddModal(true)
          }}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-semibold"
        >
          + Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{zone.name}</h3>
                <p className="text-2xl font-bold text-pink-600 mt-1">${zone.fee}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(zone)}
                  className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Time:</span>
                <span className="font-medium">{zone.estimatedMinHours}-{zone.estimatedMaxHours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Minimum Order:</span>
                <span className="font-medium">${zone.minimumOrder}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {zone.sameDayAvailable && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    ⚡ Same Day
                  </span>
                )}
                {zone.active ? (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                    Active
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-semibold">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No delivery zones yet</h3>
          <p className="text-gray-600 mb-4">Add your first delivery zone to start accepting deliveries</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-semibold"
          >
            Add Zone
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                  placeholder="e.g., Manhattan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Hours *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.estimatedMinHours}
                    onChange={(e) => setFormData({ ...formData, estimatedMinHours: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Hours *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.estimatedMaxHours}
                    onChange={(e) => setFormData({ ...formData, estimatedMaxHours: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameDayAvailable"
                  checked={formData.sameDayAvailable}
                  onChange={(e) => setFormData({ ...formData, sameDayAvailable: e.target.checked })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="sameDayAvailable" className="text-sm text-gray-700">
                  Same-day delivery available
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Zone is active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingZone(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingZone ? 'Update' : 'Add Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
