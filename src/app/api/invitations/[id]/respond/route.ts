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
    const invitationId = parseInt(id)
    const userId = parseInt(session.user.id)

    const { action } = await request.json() // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "decline"' }, { status: 400 })
    }

    // Get invitation details
    const invitation = await db
      .selectFrom('invitations')
      .selectAll()
      .where('id', '=', invitationId)
      .executeTakeFirst()

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation has already been responded to' }, { status: 400 })
    }

    // Get user details to verify email matches
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user || user.email !== invitation.invited_email) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 })
    }

    const now = new Date()

    if (action === 'accept') {
      // Update invitation status
      await db
        .updateTable('invitations')
        .set({
          status: 'accepted',
          accepted_at: now,
          updated_at: now,
        })
        .where('id', '=', invitationId)
        .execute()

      // Add user to group
      await db
        .insertInto('group_members')
        .values({
          user_id: userId,
          group_id: invitation.group_id,
          joined_at: now,
          need_admin_approve: false, // Invitation acceptance doesn't need approval
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
            group_id: invitation.group_id,
            role_id: Number(memberRole.id),
            assigned_by: invitation.invited_by,
            assigned_at: now,
            created_at: now,
            updated_at: now,
          })
          .execute()
      }

      return NextResponse.json({ message: 'Invitation accepted successfully' })
    } else {
      // Decline invitation
      await db
        .updateTable('invitations')
        .set({
          status: 'declined',
          declined_at: now,
          updated_at: now,
        })
        .where('id', '=', invitationId)
        .execute()

      return NextResponse.json({ message: 'Invitation declined successfully' })
    }
  } catch (error) {
    console.error('Error responding to invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
