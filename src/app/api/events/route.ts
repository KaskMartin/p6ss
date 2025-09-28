import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Get all events from groups the user is a member of or is a global admin
    let eventsQuery = db
      .selectFrom('events')
      .leftJoin('groups', 'events.group_id', 'groups.id')
      .leftJoin('users as creators', 'events.created_by', 'creators.id')
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
        'events.messenger_link',
        'events.created_at',
        'events.updated_at',
        'groups.name as group_name',
        'creators.name as creator_name'
      ])

    // If user is not a global admin, filter by group membership
    if (!session.user.isAdmin) {
      eventsQuery = eventsQuery
        .leftJoin('group_members', (join) =>
          join
            .onRef('group_members.group_id', '=', 'events.group_id')
            .on('group_members.user_id', '=', userId)
        )
        .where('group_members.user_id', '=', userId)
    }

    const events = await eventsQuery
      .orderBy('events.start_datetime', 'asc')
      .execute()

    // Convert BigInt IDs to numbers for JSON serialization
    const serializableEvents = events.map(event => ({
      id: Number(event.id),
      group_id: Number(event.group_id),
      created_by: Number(event.created_by),
      title: event.title,
      subtitle: event.subtitle,
      description: event.description,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      address: event.address,
      location_lat: event.location_lat,
      location_lng: event.location_lng,
      list_item_picture: event.list_item_picture,
      header_picture: event.header_picture,
      background_picture: event.background_picture,
      invite_paper_image: event.invite_paper_image,
      public_link: event.public_link,
      link_uid: event.link_uid,
      messenger_link: event.messenger_link,
      created_at: event.created_at,
      updated_at: event.updated_at,
      group_name: event.group_name,
      creator_name: event.creator_name
    }))

    return NextResponse.json({ events: serializableEvents })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
