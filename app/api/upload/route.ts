import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { uploadToCloudinary } from '@/lib/cloudinary'

const MAX_FILE_SIZE  = 5 * 1024 * 1024  // 5 MB
const ALLOWED_TYPES  = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_UPLOAD_TYPES = new Set(['cover', 'flower', 'logo', 'general'])

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file     = formData.get('file') as File | null
    const type     = String(formData.get('type') || 'general').toLowerCase()

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ── Validate upload type ──────────────────────────────────────────────────
    if (!ALLOWED_UPLOAD_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    // ── Validate MIME type ────────────────────────────────────────────────────
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.' },
        { status: 400 }
      )
    }

    // ── Validate file size ────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5 MB.' },
        { status: 400 }
      )
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ── Double-check size after reading (file.size can be spoofed in some clients)
    if (buffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large.' }, { status: 400 })
    }

    // ── Generate a safe filename ──────────────────────────────────────────────
    const ext      = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
    const rand     = Math.random().toString(36).slice(2, 8)
    const filename = `${type}-${Date.now()}-${rand}.${ext}`
    const folder   = type

    const url = await uploadToCloudinary(buffer, filename, folder)

    logger.info('upload', 'File uploaded', {
      shopId:   session.user.shopId,
      filename,
      type,
      sizeKb:   Math.round(buffer.byteLength / 1024),
    })

    return NextResponse.json({ success: true, url, filename, size: buffer.byteLength })
  } catch (error: unknown) {
    logger.error('upload', 'Upload failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
