import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imageId = parseInt(id)

    const image = await db
      .selectFrom('images')
      .selectAll()
      .where('id', '=', imageId)
      .executeTakeFirst()

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const serializableImage = {
      ...image,
      id: Number(image.id),
    }

    return NextResponse.json({ image: serializableImage })
  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const imageId = parseInt(id)

    // Check if image exists
    const image = await db
      .selectFrom('images')
      .select('id')
      .where('id', '=', imageId)
      .executeTakeFirst()

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete the image
    await db
      .deleteFrom('images')
      .where('id', '=', imageId)
      .execute()

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const imageId = parseInt(id)
    const { url, thumb_url, type, width, height } = await request.json()

    if (!url || !type) {
      return NextResponse.json({ error: 'URL and type are required' }, { status: 400 })
    }

    if (!['list_item', 'header', 'background', 'invite_paper'].includes(type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    // Check if image exists
    const existingImage = await db
      .selectFrom('images')
      .select('id')
      .where('id', '=', imageId)
      .executeTakeFirst()

    if (!existingImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Update the image
    await db
      .updateTable('images')
      .set({
        url,
        thumb_url: thumb_url || null,
        width: width || null,
        height: height || null,
        type,
        updated_at: new Date(),
      })
      .where('id', '=', imageId)
      .execute()

    return NextResponse.json({ message: 'Image updated successfully' })
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
