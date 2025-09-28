import { db } from '../database'

async function addAdminFlag() {
  try {
    console.log('Adding admin flag to users table...')

    // Add is_admin column to users table
    await db.schema
      .alterTable('users')
      .addColumn('is_admin', 'boolean', (col) => col.defaultTo(false).notNull())
      .execute()

    console.log('✅ Admin flag added successfully')
  } catch (error) {
    console.error('❌ Failed to add admin flag:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  addAdminFlag().catch(console.error)
}

export { addAdminFlag }
