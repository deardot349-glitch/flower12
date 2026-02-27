'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function StockFlowersPage() {
  const [flowers, setFlowers] = useState([])
  const [currency, setCurrency] = useState('USD')
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    pricePerStem: '',
    stockCount: '',
    imageUrl: ''
  })

  useEffect(() => {
    fetchFlowers()
  }, [])

  const fetchFlowers = async () => {
    const res = await fetch('/api/dashboard/stock-flowers')
    const data = await res.json()
    setFlowers(data.flowers || [])
    if (data.currency) setCurrency(data.currency)
  }

  const currencySymbol = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.')
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'flower')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await res.json()
      if (res.ok) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
      }
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/dashboard/stock-flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pricePerStem: parseFloat(formData.pricePerStem),
          stockCount: parseInt(formData.stockCount)
        })
      })

      if (res.ok) {
        setFormData({ name: '', color: '', pricePerStem: '', stockCount: '', imageUrl: '' })
        setShowAddForm(false)
        fetchFlowers()
        alert('Flower added successfully!')
      }
    } catch (err) {
      alert('Failed to add flower')
    }
  }

  const updateStock = async (id: string, change: number) => {
    try {
      await fetch('/api/dashboard/stock-flowers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stockChange: change })
      })
      fetchFlowers()
    } catch (err) {
      alert('Failed to update stock')
    }
  }

  const deleteFlower = async (id: string) => {
    if (!confirm('Delete this flower?')) return

    try {
      await fetch('/api/dashboard/stock-flowers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      fetchFlowers()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Flowers</h1>
          <p className="text-gray-600">Manage flowers for custom bouquets</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-700"
        >
          {showAddForm ? 'Cancel' : '+ Add Flower'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add New Stock Flower</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flower Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Rose"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                <input
                  type="text"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Red"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Stem ({currencySymbol}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.pricePerStem}
                  onChange={(e) => setFormData({ ...formData, pricePerStem: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="2.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Count *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stockCount}
                  onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-500">
                  {uploading ? (
                    <p>Uploading...</p>
                  ) : formData.imageUrl ? (
                    <div className="relative h-32">
                      <Image src={formData.imageUrl} alt="Preview" fill className="object-contain" />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Click to upload image</p>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50"
            >
              Add Flower to Stock
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {flowers.map((flower: any) => (
          <div key={flower.id} className="bg-white rounded-xl shadow-sm p-4">
            {flower.imageUrl && (
              <div className="relative h-40 rounded-lg overflow-hidden mb-3">
                <Image src={flower.imageUrl} alt={flower.name} fill className="object-cover" />
              </div>
            )}
            <h3 className="font-bold text-lg text-gray-900">{flower.name}</h3>
            <p className="text-sm text-gray-600">{flower.color}</p>
            <div className="mt-2">
              <span className="text-lg font-bold text-pink-600">{currencySymbol}{flower.pricePerStem}/stem</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStock(flower.id, -1)}
                  disabled={flower.stockCount === 0}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  -
                </button>
                <span className="text-sm font-medium w-16 text-center">
                  {flower.stockCount} stock
                </span>
                <button
                  onClick={() => updateStock(flower.id, 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => deleteFlower(flower.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {flowers.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">No stock flowers yet. Add some to enable custom bouquets!</p>
        </div>
      )}
    </div>
  )
}
