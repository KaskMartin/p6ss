import { db } from '../database'
import { readdir } from 'fs/promises'
import { join } from 'path'

interface Migration {
  name: string
  up: (db: any) => Promise<void>
  down: (db: any) => Promise<void>
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(__dirname, 'migrations')
  const files = await readdir(migrationsDir)
  const migrationFiles = files
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .sort()

  const migrations: Migration[] = []

  for (const file of migrationFiles) {
    const migration = await import(join(migrationsDir, file))
    migrations.push({
      name: file.replace('.ts', ''),
      up: migration.up,
      down: migration.down
    })
  }

  return migrations
}

async function getAppliedMigrations(): Promise<string[]> {
  try {
    const applied = await db
      .selectFrom('migrations')
      .select('name')
      .execute()
    return applied.map(m => m.name)
  } catch (error) {
    // If migrations table doesn't exist, return empty array
    return []
  }
}

async function markMigrationAsApplied(migrationName: string): Promise<void> {
  await db
    .insertInto('migrations')
    .values({
      name: migrationName,
      applied_at: new Date()
    })
    .execute()
}

async function markMigrationAsRolledBack(migrationName: string): Promise<void> {
  await db
    .deleteFrom('migrations')
    .where('name', '=', migrationName)
    .execute()
}

export async function runMigrations(direction: 'up' | 'down' = 'up'): Promise<void> {
  try {
    console.log(`Starting migration ${direction}...`)

    const migrations = await loadMigrations()
    const appliedMigrations = await getAppliedMigrations()

    if (direction === 'up') {
      // Run pending migrations
      const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.name))
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations')
        return
      }

      for (const migration of pendingMigrations) {
        console.log(`Running migration: ${migration.name}`)
        await migration.up(db)
        await markMigrationAsApplied(migration.name)
        console.log(`✅ Applied migration: ${migration.name}`)
      }

      console.log(`🎉 Successfully applied ${pendingMigrations.length} migrations`)
    } else {
      // Rollback migrations in reverse order
      const migrationsToRollback = migrations
        .filter(m => appliedMigrations.includes(m.name))
        .reverse()

      if (migrationsToRollback.length === 0) {
        console.log('✅ No migrations to rollback')
        return
      }

      for (const migration of migrationsToRollback) {
        console.log(`Rolling back migration: ${migration.name}`)
        await migration.down(db)
        await markMigrationAsRolledBack(migration.name)
        console.log(`✅ Rolled back migration: ${migration.name}`)
      }

      console.log(`🎉 Successfully rolled back ${migrationsToRollback.length} migrations`)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const direction = process.argv[2] as 'up' | 'down' || 'up'
  runMigrations(direction).catch(console.error)
}