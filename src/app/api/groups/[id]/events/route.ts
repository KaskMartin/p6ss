import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateLinkUID } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const groupId = parseInt(id)
    const userId = parseInt(session.user.id)

    // Check if user is a member of this group
    const membership = await db
      .selectFrom('group_members')
      .select('id')
      .where('user_id', '=', userId)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    // Get all events for this group
    const events = await db
      .selectFrom('events')
      .innerJoin('users', 'users.id', 'events.created_by')
      .select([
        'events.id',
        'events.group_id',
        'events.created_by',
        'events.title',
        'events.subtitle',
        'events.description',
        'events.start_datetime',
        'events.end_datetime',
        'events.address',
        'events.location_lat',
        'events.location_lng',
        'events.list_item_picture',
        'events.header_picture',
        'events.background_picture',
        'events.invite_paper_image',
        'events.public_link',
        'events.link_uid',
        'events.created_at',
        'events.updated_at',
        'users.name as created_by_name',
        'users.email as created_by_email'
      ])
      .where('events.group_id', '=', groupId)
      .orderBy('events.start_datetime', 'asc')
      .execute()

    const serializableEvents = events.map(event => ({
      ...event,
      id: Number(event.id),
      group_id: Number(event.group_id),
      created_by: Number(event.created_by),
    }))

    return NextResponse.json({ events: serializableEvents })
  } catch (error) {
    console.error('Error fetching group events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const groupId = parseInt(id)
    const userId = parseInt(session.user.id)

    const {
      title,
      subtitle,
      description,
      start_datetime,
      end_datetime,
      address,
      location_lat,
      location_lng,
      list_item_picture,
      header_picture,
      background_picture,
      invite_paper_image,
      public_link
    } = await request.json()

    if (!title || !start_datetime || !end_datetime) {
      return NextResponse.json({ error: 'Title, start datetime, and end datetime are required' }, { status: 400 })
    }

    // Check if user is a member of this group
    const membership = await db
      .selectFrom('group_members')
      .select('id')
      .where('user_id', '=', userId)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    const now = new Date()
    const linkUid = public_link ? generateLinkUID() : null
    
    const insertResult = await db
      .insertInto('events')
      .values({
        group_id: groupId,
        created_by: userId,
        title,
        subtitle: subtitle || null,
        description: description || null,
        start_datetime: new Date(start_datetime),
        end_datetime: new Date(end_datetime),
        address: address || null,
        location_lat: location_lat ? parseFloat(location_lat) : null,
        location_lng: location_lng ? parseFloat(location_lng) : null,
        list_item_picture: list_item_picture || null,
        header_picture: header_picture || null,
        background_picture: background_picture || null,
        invite_paper_image: invite_paper_image || null,
        public_link: public_link || false,
        link_uid: linkUid,
        created_at: now,
        updated_at: now,
      })
      .execute()

    const eventId = Number(insertResult[0].insertId)

    return NextResponse.json({ 
      message: 'Event created successfully',
      eventId 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
