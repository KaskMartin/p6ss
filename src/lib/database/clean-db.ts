import { db } from '../database'

async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning database...')

    // Drop all tables in reverse dependency order
    const tables = [
      'verification_tokens',
      'accounts', 
      'sessions',
      'users',
      'migrations'
    ]

    for (const table of tables) {
      try {
        await db.schema.dropTable(table).ifExists().execute()
        console.log(`✅ Dropped table: ${table}`)
      } catch (error) {
        console.log(`⚠️  Table ${table} may not exist: ${error}`)
      }
    }

    console.log('🎉 Database cleaned successfully!')
    console.log('💡 Run "yarn migrate" to recreate the schema')
  } catch (error) {
    console.error('❌ Failed to clean database:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  cleanDatabase().catch(console.error)
}

export { cleanDatabase }
