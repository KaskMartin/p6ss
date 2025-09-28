import { db } from '../database'
import { readdir } from 'fs/promises'
import { join } from 'path'

async function getMigrationStatus() {
  try {
    console.log('📊 Migration Status')
    console.log('==================')

    // Get all migration files
    const migrationsDir = join(__dirname, 'migrations')
    const files = await readdir(migrationsDir)
    const migrationFiles = files
      .filter(file => file.endsWith('.ts') && file !== 'index.ts')
      .sort()

    // Get applied migrations
    let appliedMigrations: string[] = []
    try {
      const applied = await db
        .selectFrom('migrations')
        .select('name')
        .execute()
      appliedMigrations = applied.map(m => m.name)
    } catch (error) {
      console.log('⚠️  Migrations table not found - no migrations have been applied yet')
    }

    console.log(`\nTotal migration files: ${migrationFiles.length}`)
    console.log(`Applied migrations: ${appliedMigrations.length}`)
    console.log(`Pending migrations: ${migrationFiles.length - appliedMigrations.length}`)

    console.log('\n📋 Migration Details:')
    console.log('-------------------')

    for (const file of migrationFiles) {
      const migrationName = file.replace('.ts', '')
      const isApplied = appliedMigrations.includes(migrationName)
      const status = isApplied ? '✅ Applied' : '⏳ Pending'
      console.log(`${status} ${migrationName}`)
    }

    if (appliedMigrations.length === 0) {
      console.log('\n💡 Run "yarn migrate" to apply all migrations')
    } else if (appliedMigrations.length < migrationFiles.length) {
      console.log('\n💡 Run "yarn migrate" to apply pending migrations')
    } else {
      console.log('\n🎉 All migrations are up to date!')
    }

  } catch (error) {
    console.error('❌ Failed to get migration status:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  getMigrationStatus().catch(console.error)
}

export { getMigrationStatus }
