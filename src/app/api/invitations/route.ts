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
    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Get all pending invitations for this user's email
    const invitations = await db
      .selectFrom('invitations')
      .leftJoin('groups', 'invitations.group_id', 'groups.id')
      .leftJoin('users', 'invitations.invited_by', 'users.id')
      .select([
        'invitations.id',
        'invitations.group_id',
        'invitations.description',
        'invitations.status',
        'invitations.created_at',
        'groups.name as group_name',
        'groups.description as group_description',
        'users.name as invited_by_name',
        'users.email as invited_by_email'
      ])
      .where('invitations.invited_email', '=', userEmail)
      .where('invitations.status', '=', 'pending')
      .orderBy('invitations.created_at', 'desc')
      .execute()

    // Convert BigInt IDs to numbers for JSON serialization
    const serializableInvitations = invitations.map(invitation => ({
      id: Number(invitation.id),
      group_id: Number(invitation.group_id),
      description: invitation.description,
      status: invitation.status,
      created_at: invitation.created_at,
      group_name: invitation.group_name,
      group_description: invitation.group_description,
      invited_by_name: invitation.invited_by_name,
      invited_by_email: invitation.invited_by_email
    }))

    return NextResponse.json({ invitations: serializableInvitations })
  } catch (error) {
    console.error('Error fetching user invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
