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

    // Get groups where user is a member
    const userGroups = await db
      .selectFrom('groups')
      .leftJoin('group_members', 'groups.id', 'group_members.group_id')
      .leftJoin('user_group_roles', (join) =>
        join
          .onRef('user_group_roles.user_id', '=', 'group_members.user_id')
          .onRef('user_group_roles.group_id', '=', 'groups.id')
      )
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select([
        'groups.id',
        'groups.name',
        'groups.description',
        'groups.created_by',
        'groups.created_at',
        'group_members.joined_at',
        'group_roles.name as role_name',
        'group_roles.permissions'
      ])
      .where('group_members.user_id', '=', userId)
      .execute()

    // Get all groups (for browsing/joining)
    const allGroups = await db
      .selectFrom('groups')
      .selectAll()
      .execute()

    // Convert BigInt IDs to numbers for JSON serialization
    const serializableUserGroups = userGroups.map(group => ({
      ...group,
      id: Number(group.id),
      created_by: Number(group.created_by),
    }))

    const serializableAllGroups = allGroups.map(group => ({
      ...group,
      id: Number(group.id),
      created_by: Number(group.created_by),
    }))

    return NextResponse.json({
      userGroups: serializableUserGroups,
      allGroups: serializableAllGroups
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session in groups POST:', session)

    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Not authenticated. Please sign in.' }, { status: 401 })
    }

    if (!session.user?.id) {
      console.log('No user ID in session')
      return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 })
    }

    const { name, description } = await request.json()
    const userId = parseInt(session.user.id)
    console.log('Creating group for user ID:', userId, 'with name:', name)

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Create the group
    const now = new Date()
    console.log('Creating group with values:', { name, description, created_by: userId })
    
    const insertResult = await db
      .insertInto('groups')
      .values({
        name,
        description: description || null,
        created_by: userId,
        created_at: now,
        updated_at: now,
      })
      .execute()

    console.log('Group creation result:', insertResult)

    // Get the inserted group ID from the result (insertResult is an array)
    const result = insertResult[0]
    const groupId = Number(result.insertId)
    console.log('Group ID from insertId:', groupId, 'Raw insertId:', result.insertId)

    if (!groupId || isNaN(groupId)) {
      throw new Error('Failed to create group - no valid ID returned')
    }
    
    await db
      .insertInto('group_members')
      .values({
        user_id: userId,
        group_id: groupId,
        joined_at: now,
        created_at: now,
        updated_at: now,
      })
      .execute()

    // Get admin role
    const adminRole = await db
      .selectFrom('group_roles')
      .select('id')
      .where('name', '=', 'admin')
      .executeTakeFirst()

    if (adminRole) {
      // Assign admin role to creator
      const roleId = typeof adminRole.id === 'bigint' ? Number(adminRole.id) : adminRole.id
      console.log('Role ID for assignment:', roleId, 'Type:', typeof adminRole.id)
      
      await db
        .insertInto('user_group_roles')
        .values({
          user_id: userId,
          group_id: groupId,
          role_id: roleId,
          assigned_by: userId,
          assigned_at: now,
          created_at: now,
          updated_at: now,
        })
        .execute()
    }

    return NextResponse.json(
      { 
        message: 'Group created successfully', 
        group: {
          id: groupId,
          name: name,
          description: description,
          created_by: userId
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
