import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateImageUID, generateImageThumbnailUrl } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, thumb_url, type, width, height } = await request.json()

    if (!url || !type) {
      return NextResponse.json({ error: 'URL and type are required' }, { status: 400 })
    }

    if (!['list_item', 'header', 'background', 'invite_paper'].includes(type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    const uid = generateImageUID()
    const thumbUrl = thumb_url || generateImageThumbnailUrl(url)
    const now = new Date()

    const insertResult = await db
      .insertInto('images')
      .values({
        uid,
        url,
        thumb_url: thumbUrl,
        width: width || null,
        height: height || null,
        type,
        created_at: now,
        updated_at: now,
      })
      .execute()

    const imageId = Number(insertResult[0].insertId)

    return NextResponse.json({
      message: 'Image created successfully',
      image: {
        id: imageId,
        uid,
        url,
        thumb_url: thumbUrl,
        width,
        height,
        type,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let query = db.selectFrom('images').selectAll()

    if (type && ['list_item', 'header', 'background', 'invite_paper'].includes(type)) {
      query = query.where('type', '=', type)
    }

    const images = await query.orderBy('created_at', 'desc').execute()

    const serializableImages = images.map(image => ({
      ...image,
      id: Number(image.id),
    }))

    return NextResponse.json({ images: serializableImages })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
