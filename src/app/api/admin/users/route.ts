import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get all users (excluding password)
    const users = await db
      .selectFrom('users')
      .select(['id', 'email', 'name', 'is_admin', 'created_at', 'updated_at'])
      .orderBy('created_at', 'desc')
      .execute()

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { userId, isAdmin } = await request.json()

    if (typeof userId !== 'number' || typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Update user admin status
    const updatedUser = await db
      .updateTable('users')
      .set({ 
        is_admin: isAdmin,
        updated_at: new Date()
      })
      .where('id', '=', userId)
      .returning(['id', 'email', 'name', 'is_admin'])
      .executeTakeFirst()

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: 'User admin status updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
