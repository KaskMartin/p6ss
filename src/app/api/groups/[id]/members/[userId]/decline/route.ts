import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, userId } = await params
    const groupId = parseInt(id)
    const targetUserId = parseInt(userId)
    const currentUserId = parseInt(session.user.id)

    // Check if current user is group admin or owner
    const group = await db
      .selectFrom('groups')
      .select(['created_by'])
      .where('id', '=', groupId)
      .executeTakeFirst()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is group creator
    const isGroupOwner = group.created_by === currentUserId

    // Check if user has admin role in the group
    const userRole = await db
      .selectFrom('user_group_roles')
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select(['group_roles.name as role_name'])
      .where('user_group_roles.user_id', '=', currentUserId)
      .where('user_group_roles.group_id', '=', groupId)
      .executeTakeFirst()

    // Check if user is global admin
    const user = await db
      .selectFrom('users')
      .select('is_admin')
      .where('id', '=', currentUserId)
      .executeTakeFirst()

    const isGlobalAdmin = user?.is_admin || false
    const isGroupAdmin = userRole?.role_name === 'admin'

    if (!isGroupOwner && !isGroupAdmin && !isGlobalAdmin) {
      return NextResponse.json({ error: 'Only group admins can decline members' }, { status: 403 })
    }

    // Check if the target user exists and needs approval
    const targetMember = await db
      .selectFrom('group_members')
      .select(['id', 'need_admin_approve'])
      .where('user_id', '=', targetUserId)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    if (!targetMember) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 })
    }

    if (!targetMember.need_admin_approve) {
      return NextResponse.json({ error: 'User does not need approval' }, { status: 400 })
    }

    // Remove the user from the group
    await db
      .deleteFrom('group_members')
      .where('id', '=', targetMember.id)
      .execute()

    return NextResponse.json({ message: 'User declined and removed from group' })
  } catch (error) {
    console.error('Error declining user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
