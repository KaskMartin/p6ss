import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Check if group exists
    const group = await db
      .selectFrom('groups')
      .select('id')
      .where('id', '=', groupId)
      .executeTakeFirst()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await db
      .selectFrom('group_members')
      .select('id')
      .where('user_id', '=', userId)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 })
    }

    // Add user to group
    const now = new Date()
    await db
      .insertInto('group_members')
      .values({
        user_id: userId,
        group_id: groupId,
        joined_at: now,
        need_admin_approve: false, // Direct addition doesn't need approval
        created_at: now,
        updated_at: now,
      })
      .execute()

    // Get member role and assign it
    const memberRole = await db
      .selectFrom('group_roles')
      .select('id')
      .where('name', '=', 'member')
      .executeTakeFirst()

    if (memberRole) {
      await db
        .insertInto('user_group_roles')
        .values({
          user_id: userId,
          group_id: groupId,
          role_id: Number(memberRole.id),
          assigned_by: userId, // Self-assigned for joining
          assigned_at: now,
          created_at: now,
          updated_at: now,
        })
        .execute()
    }

    return NextResponse.json({ message: 'Successfully joined group' })
  } catch (error) {
    console.error('Error joining group:', error)
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
    const groupId = parseInt(id)
    const userId = parseInt(session.user.id)

    // Check if user is a member
    const membership = await db
      .selectFrom('group_members')
      .select('id')
      .where('user_id', '=', userId)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 400 })
    }

    // Remove user from group
    await db
      .deleteFrom('group_members')
      .where('user_id', '=', userId)
      .where('group_id', '=', groupId)
      .execute()

    // Remove all roles for this user in this group
    await db
      .deleteFrom('user_group_roles')
      .where('user_id', '=', userId)
      .where('group_id', '=', groupId)
      .execute()

    return NextResponse.json({ message: 'Successfully left group' })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
