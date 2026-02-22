import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { uploadToCloudinary } from '@/lib/cloudinary'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'cover' | 'flower' | 'logo'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const ext = file.type.split('/')[1]
    const filename = `${type || 'image'}-${timestamp}-${randomString}.${ext === 'jpeg' ? 'jpg' : ext}`
    
    // Upload to Cloudinary
    const folder = type || 'general'
    const url = await uploadToCloudinary(buffer, filename, folder)

    logger.info('File uploaded to Cloudinary', {
      userId: session.user.id,
      shopId: session.user.shopId,
      filename,
      type,
      size: buffer.length,
      url
    })

    return NextResponse.json({ 
      success: true, 
      url,
      filename,
      size: buffer.length
    })
  } catch (error: any) {
    logger.error('Upload error', { error: error.message }, error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
