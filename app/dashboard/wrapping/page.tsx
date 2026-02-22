'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function WrappingPage() {
  const [options, setOptions] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrl: ''
  })

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    const res = await fetch('/api/dashboard/wrapping')
    const data = await res.json()
    setOptions(data.options || [])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'wrapping')

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
      const res = await fetch('/api/dashboard/wrapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      if (res.ok) {
        setFormData({ name: '', price: '', imageUrl: '' })
        setShowAddForm(false)
        fetchOptions()
        alert('Wrapping option added!')
      }
    } catch (err) {
      alert('Failed to add')
    }
  }

  const toggleAvailability = async (id: string, available: boolean) => {
    try {
      await fetch('/api/dashboard/wrapping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, available: !available })
      })
      fetchOptions()
    } catch (err) {
      alert('Failed to update')
    }
  }

  const deleteOption = async (id: string) => {
    if (!confirm('Delete this wrapping option?')) return

    try {
      await fetch('/api/dashboard/wrapping', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      fetchOptions()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wrapping Options</h1>
          <p className="text-gray-600">Manage wrapping choices for custom bouquets</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700"
        >
          {showAddForm ? 'Cancel' : '+ Add Wrapping'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add Wrapping Option</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Kraft Paper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="5.00"
              />
              <p className="text-xs text-gray-500 mt-1">Enter 0 for free wrapping</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image (optional)</label>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500">
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
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              Add Wrapping Option
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option: any) => (
          <div key={option.id} className="bg-white rounded-xl shadow-sm p-4">
            {option.imageUrl && (
              <div className="relative h-32 rounded-lg overflow-hidden mb-3">
                <Image src={option.imageUrl} alt={option.name} fill className="object-cover" />
              </div>
            )}
            <h3 className="font-bold text-lg text-gray-900">{option.name}</h3>
            <p className="text-lg font-bold text-primary-600 mt-2">
              {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => toggleAvailability(option.id, option.available)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  option.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {option.available ? 'Available' : 'Unavailable'}
              </button>
              <button
                onClick={() => deleteOption(option.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {options.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">No wrapping options yet. Add some!</p>
        </div>
      )}
    </div>
  )
}
