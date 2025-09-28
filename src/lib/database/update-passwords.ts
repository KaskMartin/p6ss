import { db } from '../database'
import bcrypt from 'bcryptjs'

async function updateAllPasswords() {
  try {
    console.log('Updating all user passwords to "qwerty098"...')

    // Hash the new password
    const hashedPassword = await bcrypt.hash('qwerty098', 12)

    // Get all users first to see what we're updating
    const users = await db
      .selectFrom('users')
      .select(['id', 'email', 'name'])
      .execute()

    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name || 'No name'})`)
    })

    // Update all users' passwords
    const result = await db
      .updateTable('users')
      .set({ 
        password: hashedPassword,
        updated_at: new Date()
      })
      .execute()

    console.log(`✅ Updated passwords for ${result.length} users`)
    console.log('All users can now sign in with password: qwerty098')
  } catch (error) {
    console.error('❌ Failed to update passwords:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  updateAllPasswords().catch(console.error)
}

export { updateAllPasswords }
