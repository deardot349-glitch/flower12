import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload image to Cloudinary
 * @param buffer - Image buffer
 * @param filename - Original filename
 * @param folder - Cloudinary folder (e.g., 'flowers', 'covers', 'logos')
 * @returns Secure URL of uploaded image
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'flower-shop'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `flower-shop/${folder}`,
        public_id: filename.split('.')[0], // Remove extension
        resource_type: 'auto',
        transformation: [
          { width: 2000, height: 2000, crop: 'limit' }, // Max dimensions
          { quality: 'auto:good' }, // Auto quality optimization
          { fetch_format: 'auto' } // Auto format (WebP for modern browsers)
        ],
        // Additional optimizations
        flags: 'progressive', // Progressive JPEG loading
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else {
          console.log('Cloudinary upload success:', result?.secure_url)
          resolve(result!.secure_url)
        }
      }
    )

    uploadStream.end(buffer)
  })
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image (extracted from URL)
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
    console.log('Cloudinary delete success:', publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw error
  }
}

/**
 * Extract public ID from Cloudinary URL
 * Example: https://res.cloudinary.com/dwnxg9wnz/image/upload/v123/flower-shop/flowers/image.jpg
 * Returns: flower-shop/flowers/image
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const matches = cloudinaryUrl.match(/\/flower-shop\/[^/]+\/[^.]+/)
    return matches ? matches[0].substring(1) : null // Remove leading /
  } catch {
    return null
  }
}

export { cloudinary }
