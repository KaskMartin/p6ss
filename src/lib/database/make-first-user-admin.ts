import { db } from '../database'

async function makeFirstUserAdmin() {
  try {
    console.log('Making first user an admin...')

    // Get the first user
    const firstUser = await db
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at', 'asc')
      .executeTakeFirst()

    if (!firstUser) {
      console.log('No users found in database')
      return
    }

    // Update the first user to be admin
    await db
      .updateTable('users')
      .set({ 
        is_admin: true,
        updated_at: new Date()
      })
      .where('id', '=', firstUser.id)
      .execute()

    console.log(`✅ User ${firstUser.email} is now an admin`)
  } catch (error) {
    console.error('❌ Failed to make first user admin:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  makeFirstUserAdmin().catch(console.error)
}

export { makeFirstUserAdmin }
