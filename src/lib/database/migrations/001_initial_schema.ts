import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
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

  // Create verification_tokens table for NextAuth
  await db.schema
    .createTable('verification_tokens')
    .ifNotExists()
    .addColumn('identifier', 'varchar(255)', (col) => col.notNull())
    .addColumn('token', 'varchar(255)', (col) => col.notNull())
    .addColumn('expires', 'datetime', (col) => col.notNull())
    .execute()

  // Create migrations table to track applied migrations
  await db.schema
    .createTable('migrations')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('applied_at', 'datetime', (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order
  await db.schema.dropTable('verification_tokens').ifExists().execute()
  await db.schema.dropTable('accounts').ifExists().execute()
  await db.schema.dropTable('sessions').ifExists().execute()
  await db.schema.dropTable('users').ifExists().execute()
  await db.schema.dropTable('migrations').ifExists().execute()
}
