import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkUid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { linkUid } = await params
    const userId = parseInt(session.user.id)

    // Get group with public link enabled
    const group = await db
      .selectFrom('groups')
      .select(['id', 'name'])
      .where('link_uid', '=', linkUid)
      .where('public_link', '=', true)
      .executeTakeFirst()

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or not publicly accessible' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await db
      .selectFrom('group_members')
      .select('id')
      .where('user_id', '=', userId)
      .where('group_id', '=', group.id)
      .executeTakeFirst()

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // Add user to group with need_admin_approve = true
    const now = new Date()
    await db
      .insertInto('group_members')
      .values({
        user_id: userId,
        group_id: group.id,
        joined_at: now,
        need_admin_approve: true, // Set to true for public page invitations
        created_at: now,
        updated_at: now,
      })
      .execute()

    return NextResponse.json({
      message: 'Successfully joined the group. Your membership is pending admin approval.',
      group: {
        id: group.id,
        name: group.name
      }
    })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
