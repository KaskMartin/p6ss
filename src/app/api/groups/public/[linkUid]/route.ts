import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkUid: string }> }
) {
  try {
    const { linkUid } = await params

    // Get group with public link enabled
    const group = await db
      .selectFrom('groups')
      .leftJoin('users', 'users.id', 'groups.created_by')
      .select([
        'groups.id',
        'groups.name',
        'groups.description',
        'groups.created_by',
        'groups.public_link',
        'groups.link_uid',
        'groups.created_at',
        'groups.updated_at',
        'users.name as creator_name'
      ])
      .where('groups.link_uid', '=', linkUid)
      .where('groups.public_link', '=', true)
      .executeTakeFirst()

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or not publicly accessible' },
        { status: 404 }
      )
    }

    // Get public events for this group
    const events = await db
      .selectFrom('events')
      .select([
        'id',
        'title',
        'subtitle',
        'description',
        'start_datetime',
        'end_datetime',
        'address',
        'list_item_picture',
        'public_link',
        'link_uid',
        'messenger_link'
      ])
      .where('group_id', '=', group.id)
      .where('public_link', '=', true)
      .orderBy('start_datetime', 'asc')
      .execute()

    return NextResponse.json({
      group,
      events
    })
  } catch (error) {
    console.error('Error fetching public group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
