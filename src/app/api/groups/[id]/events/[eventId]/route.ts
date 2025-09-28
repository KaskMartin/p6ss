import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateLinkUID } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, eventId } = await params
    const groupId = parseInt(id)
    const eventIdNum = parseInt(eventId)
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

    // Get the specific event
    const event = await db
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
      .where('events.id', '=', eventIdNum)
      .where('events.group_id', '=', groupId)
      .executeTakeFirst()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const serializableEvent = {
      ...event,
      id: Number(event.id),
      group_id: Number(event.group_id),
      created_by: Number(event.created_by),
    }

    return NextResponse.json({ event: serializableEvent })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, eventId } = await params
    const groupId = parseInt(id)
    const eventIdNum = parseInt(eventId)
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

    // Get the event to check permissions
    const event = await db
      .selectFrom('events')
      .select(['created_by'])
      .where('id', '=', eventIdNum)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is the event creator or has admin role
    const userRole = await db
      .selectFrom('user_group_roles')
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select(['group_roles.name as role_name'])
      .where('user_group_roles.user_id', '=', userId)
      .where('user_group_roles.group_id', '=', groupId)
      .executeTakeFirst()

    const isEventCreator = event.created_by === userId
    const isGroupAdmin = userRole?.role_name === 'admin'

    if (!isEventCreator && !isGroupAdmin) {
      return NextResponse.json({ error: 'Only event creators or group admins can edit events' }, { status: 403 })
    }

    // Generate new link UID if public_link is being enabled
    let linkUid = null
    if (public_link && !event.link_uid) {
      linkUid = generateLinkUID()
    } else if (!public_link) {
      linkUid = null
    }

    // Update the event
    await db
      .updateTable('events')
      .set({
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
        link_uid: linkUid !== undefined ? linkUid : undefined,
        updated_at: new Date(),
      })
      .where('id', '=', eventIdNum)
      .execute()

    return NextResponse.json({ message: 'Event updated successfully' })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, eventId } = await params
    const groupId = parseInt(id)
    const eventIdNum = parseInt(eventId)
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

    // Get the event to check permissions
    const event = await db
      .selectFrom('events')
      .select(['created_by'])
      .where('id', '=', eventIdNum)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is the event creator or has admin role
    const userRole = await db
      .selectFrom('user_group_roles')
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select(['group_roles.name as role_name'])
      .where('user_group_roles.user_id', '=', userId)
      .where('user_group_roles.group_id', '=', groupId)
      .executeTakeFirst()

    const isEventCreator = event.created_by === userId
    const isGroupAdmin = userRole?.role_name === 'admin'

    if (!isEventCreator && !isGroupAdmin) {
      return NextResponse.json({ error: 'Only event creators or group admins can delete events' }, { status: 403 })
    }

    // Delete the event
    await db
      .deleteFrom('events')
      .where('id', '=', eventIdNum)
      .execute()

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
