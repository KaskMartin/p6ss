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

    // Get group details to check if user is admin
    const group = await db
      .selectFrom('groups')
      .selectAll()
      .where('id', '=', groupId)
      .executeTakeFirst()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user has admin role in this group
    const userRole = await db
      .selectFrom('user_group_roles')
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select(['group_roles.name as role_name'])
      .where('user_group_roles.user_id', '=', userId)
      .where('user_group_roles.group_id', '=', groupId)
      .executeTakeFirst()

    // Only group creator or admin can view invitations
    if (group.created_by !== userId && userRole?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Only group admins can view invitations' }, { status: 403 })
    }

    // Get all invitations for this group
    const invitations = await db
      .selectFrom('invitations')
      .leftJoin('users', 'invitations.invited_by', 'users.id')
      .select([
        'invitations.id',
        'invitations.invited_email',
        'invitations.description',
        'invitations.status',
        'invitations.accepted_at',
        'invitations.declined_at',
        'invitations.created_at',
        'users.name as invited_by_name',
        'users.email as invited_by_email'
      ])
      .where('invitations.group_id', '=', groupId)
      .orderBy('invitations.created_at', 'desc')
      .execute()

    // Convert BigInt IDs to numbers for JSON serialization
    const serializableInvitations = invitations.map(invitation => ({
      id: Number(invitation.id),
      invited_email: invitation.invited_email,
      description: invitation.description,
      status: invitation.status,
      accepted_at: invitation.accepted_at,
      declined_at: invitation.declined_at,
      created_at: invitation.created_at,
      invited_by_name: invitation.invited_by_name,
      invited_by_email: invitation.invited_by_email
    }))

    return NextResponse.json({ invitations: serializableInvitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
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

    const { invited_email, description } = await request.json()

    if (!invited_email) {
      return NextResponse.json({ error: 'Invited email is required' }, { status: 400 })
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

    // Check if user has admin role in this group
    const userRole = await db
      .selectFrom('user_group_roles')
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select(['group_roles.name as role_name'])
      .where('user_group_roles.user_id', '=', userId)
      .where('user_group_roles.group_id', '=', groupId)
      .executeTakeFirst()

    // Only group creator or admin can create invitations
    if (group.created_by !== userId && userRole?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Only group admins can create invitations' }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = await db
      .selectFrom('users')
      .leftJoin('group_members', 'users.id', 'group_members.user_id')
      .select('users.id')
      .where('users.email', '=', invited_email)
      .where('group_members.group_id', '=', groupId)
      .executeTakeFirst()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db
      .selectFrom('invitations')
      .select('id')
      .where('group_id', '=', groupId)
      .where('invited_email', '=', invited_email)
      .where('status', '=', 'pending')
      .executeTakeFirst()

    if (existingInvitation) {
      return NextResponse.json({ error: 'A pending invitation already exists for this email' }, { status: 400 })
    }

    // Create the invitation
    const now = new Date()
    const insertResult = await db
      .insertInto('invitations')
      .values({
        group_id: groupId,
        invited_email,
        invited_by: userId,
        description: description || null,
        status: 'pending',
        created_at: now,
        updated_at: now,
      })
      .execute()

    const invitationId = Number(insertResult[0].insertId)

    return NextResponse.json(
      { 
        message: 'Invitation created successfully', 
        invitation: {
          id: invitationId,
          group_id: groupId,
          invited_email,
          description,
          status: 'pending'
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
