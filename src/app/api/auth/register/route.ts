import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const now = new Date()
    const newUser = await db
      .insertInto('users')
      .values({
        email,
        password: hashedPassword,
        name: name || null,
        created_at: now,
        updated_at: now,
      })
      .returning(['id', 'email', 'name'])
      .executeTakeFirst()

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: {
          id: Number(newUser.id),
          email: newUser.email,
          name: newUser.name
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
