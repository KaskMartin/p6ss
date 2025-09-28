import { db } from '../database'

async function migrate() {
  try {
    console.log('Starting database migration...')

    // Create users table
    await db.schema
      .createTable('users')
      .ifNotExists()
      .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
      .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
      .addColumn('name', 'varchar(255)')
      .addColumn('password', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_at', 'datetime', (col) => col.notNull())
      .addColumn('updated_at', 'datetime', (col) => col.notNull())
      .execute()

    console.log('✅ Users table created successfully')

    // Create sessions table for NextAuth
    await db.schema
      .createTable('sessions')
      .ifNotExists()
      .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
      .addColumn('session_token', 'varchar(255)', (col) => col.notNull().unique())
      .addColumn('user_id', 'integer', (col) => col.notNull())
      .addColumn('expires', 'datetime', (col) => col.notNull())
      .addColumn('created_at', 'datetime', (col) => col.notNull())
      .addColumn('updated_at', 'datetime', (col) => col.notNull())
      .execute()

    console.log('✅ Sessions table created successfully')

    // Create accounts table for NextAuth
    await db.schema
      .createTable('accounts')
      .ifNotExists()
      .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
      .addColumn('user_id', 'integer', (col) => col.notNull())
      .addColumn('type', 'varchar(255)', (col) => col.notNull())
      .addColumn('provider', 'varchar(255)', (col) => col.notNull())
      .addColumn('provider_account_id', 'varchar(255)', (col) => col.notNull())
      .addColumn('refresh_token', 'text')
      .addColumn('access_token', 'text')
      .addColumn('expires_at', 'integer')
      .addColumn('token_type', 'varchar(255)')
      .addColumn('scope', 'varchar(255)')
      .addColumn('id_token', 'text')
      .addColumn('session_state', 'varchar(255)')
      .addColumn('created_at', 'datetime', (col) => col.notNull())
      .addColumn('updated_at', 'datetime', (col) => col.notNull())
      .execute()

    console.log('✅ Accounts table created successfully')

    // Create verification_tokens table for NextAuth
    await db.schema
      .createTable('verification_tokens')
      .ifNotExists()
      .addColumn('identifier', 'varchar(255)', (col) => col.notNull())
      .addColumn('token', 'varchar(255)', (col) => col.notNull())
      .addColumn('expires', 'datetime', (col) => col.notNull())
      .execute()

    console.log('✅ Verification tokens table created successfully')

    console.log('🎉 Database migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate().catch(console.error)
}

export { migrate }