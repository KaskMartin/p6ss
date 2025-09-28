import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ linkUid: string }> }
) {
  try {
    const { linkUid } = await params

    // Get the public event by link UID
    const event = await db
      .selectFrom('events')
      .innerJoin('users', 'users.id', 'events.created_by')
      .innerJoin('groups', 'groups.id', 'events.group_id')
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
        'users.email as created_by_email',
        'groups.name as group_name'
      ])
      .where('events.link_uid', '=', linkUid)
      .where('events.public_link', '=', true)
      .executeTakeFirst()

    if (!event) {
      return NextResponse.json({ error: 'Event not found or not public' }, { status: 404 })
    }

    const serializableEvent = {
      ...event,
      id: Number(event.id),
      group_id: Number(event.group_id),
      created_by: Number(event.created_by),
    }

    return NextResponse.json({ event: serializableEvent })
  } catch (error) {
    console.error('Error fetching public event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
