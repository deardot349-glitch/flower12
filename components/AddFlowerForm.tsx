'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AddFlowerForm({ shopId }: { shopId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrl: '',
    availability: 'in_stock',
    description: '',
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
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

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      setImagePreview(data.url)
    } catch (err: any) {
      alert(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          ...formData,
          price: parseFloat(formData.price),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create flower')
      }

      router.refresh()
      setFormData({
        name: '',
        price: '',
        imageUrl: '',
        availability: 'in_stock',
        description: '',
      })
      setImagePreview(null)
      alert('Flower added successfully!')
    } catch (error) {
      alert('Failed to add flower. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Flower Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Red Roses"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
          Price ($) *
        </label>
        <input
          id="price"
          type="number"
          step="0.01"
          min="0"
          required
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="29.99"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Flower Image
        </label>
        
        {/* Preview */}
        {imagePreview && (
          <div className="mb-3 relative h-40 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={imagePreview}
              alt="Flower preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImagePreview(null)
                setFormData(prev => ({ ...prev, imageUrl: '' }))
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Button */}
        <label className="cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-1"></div>
                <p className="text-xs text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs font-medium text-gray-700">
                  Click to upload
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
          Availability *
        </label>
        <select
          id="availability"
          required
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="in_stock">In Stock</option>
          <option value="limited">Limited</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={3}
          placeholder="Beautiful red roses perfect for..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding...' : 'Add Flower'}
      </button>
    </form>
  )
}
