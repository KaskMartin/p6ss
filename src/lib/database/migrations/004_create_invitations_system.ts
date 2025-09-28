import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create invitations table
  await db.schema
    .createTable('invitations')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('group_id', 'integer', (col) => col.notNull())
    .addColumn('invited_email', 'varchar(255)', (col) => col.notNull())
    .addColumn('invited_by', 'integer', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('pending'))
    .addColumn('accepted_at', 'datetime')
    .addColumn('declined_at', 'datetime')
    .addColumn('created_at', 'datetime', (col) => col.notNull())
    .addColumn('updated_at', 'datetime', (col) => col.notNull())
    .execute()

  // Add unique constraint to prevent duplicate invitations
  await db.schema
    .alterTable('invitations')
    .addUniqueConstraint('unique_group_email_pending', ['group_id', 'invited_email', 'status'])
    .execute()

  // Add index for better performance
  await db.schema
    .createIndex('idx_invitations_email')
    .on('invitations')
    .column('invited_email')
    .execute()

  await db.schema
    .createIndex('idx_invitations_status')
    .on('invitations')
    .column('status')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema.dropIndex('idx_invitations_status').ifExists().execute()
  await db.schema.dropIndex('idx_invitations_email').ifExists().execute()
  
  // Drop table
  await db.schema.dropTable('invitations').ifExists().execute()
}
