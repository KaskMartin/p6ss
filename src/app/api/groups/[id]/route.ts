import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Get group details
    const group = await db
      .selectFrom('groups')
      .selectAll()
      .where('id', '=', groupId)
      .executeTakeFirst()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is a member of this group or is a global admin
    const membership = await db
      .selectFrom('group_members')
      .select('id')
      .where('user_id', '=', userId)
      .where('group_id', '=', groupId)
      .executeTakeFirst()

    // Get user's admin status
    const user = await db
      .selectFrom('users')
      .select('is_admin')
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!membership && !user?.is_admin) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    // Get all group members with their roles
    const members = await db
      .selectFrom('group_members')
      .leftJoin('users', 'group_members.user_id', 'users.id')
      .leftJoin('user_group_roles', (join) =>
        join
          .onRef('user_group_roles.user_id', '=', 'group_members.user_id')
          .onRef('user_group_roles.group_id', '=', 'group_members.group_id')
      )
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select([
        'users.id',
        'users.email',
        'users.name',
        'users.is_admin',
        'group_members.joined_at',
        'group_roles.name as role_name',
        'group_roles.permissions'
      ])
      .where('group_members.group_id', '=', groupId)
      .execute()

    // Get user's role in this group
    let userRole = await db
      .selectFrom('user_group_roles')
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select(['group_roles.name as role_name', 'group_roles.permissions'])
      .where('user_group_roles.user_id', '=', userId)
      .where('user_group_roles.group_id', '=', groupId)
      .executeTakeFirst()

    // If user is global admin but not a member, give them admin role
    if (!userRole && user?.is_admin) {
      userRole = {
        role_name: 'admin',
        permissions: '["all"]'
      }
    }

    // Convert BigInt IDs to numbers for JSON serialization
    const serializableGroup = {
      id: Number(group.id),
      name: group.name,
      description: group.description,
      created_by: Number(group.created_by),
      created_at: group.created_at,
      updated_at: group.updated_at
    }

    const serializableMembers = members.map(member => ({
      id: Number(member.id),
      email: member.email,
      name: member.name,
      is_admin: member.is_admin,
      joined_at: member.joined_at,
      role_name: member.role_name,
      permissions: member.permissions
    }))

    return NextResponse.json({
      group: serializableGroup,
      members: serializableMembers,
      userRole: userRole ? {
        role_name: userRole.role_name,
        permissions: userRole.permissions
      } : null
    })
  } catch (error) {
    console.error('Error fetching group details:', error)
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
    const groupId = parseInt(id)
    const userId = parseInt(session.user.id)

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Get group details to check permissions
    const group = await db
      .selectFrom('groups')
      .selectAll()
      .where('id', '=', groupId)
      .executeTakeFirst()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
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

    // Check if user has admin role in this group
    const userRole = await db
      .selectFrom('user_group_roles')
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select(['group_roles.name as role_name'])
      .where('user_group_roles.user_id', '=', userId)
      .where('user_group_roles.group_id', '=', groupId)
      .executeTakeFirst()

    // Only group creator or admin can edit
    if (group.created_by !== userId && userRole?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Only group admins can edit group details' }, { status: 403 })
    }

    // Update the group
    await db
      .updateTable('groups')
      .set({
        name,
        description: description || null,
        updated_at: new Date(),
      })
      .where('id', '=', groupId)
      .execute()

    return NextResponse.json({ message: 'Group updated successfully' })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
