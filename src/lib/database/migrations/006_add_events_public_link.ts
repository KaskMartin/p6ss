import { Kysely } from 'kysely'
import { Database } from '../database'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('events')
    .addColumn('public_link', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute()

  await db.schema
    .alterTable('events')
    .addColumn('link_uid', 'varchar(255)')
    .execute()

  // Add unique constraint for link_uid
  await db.schema
    .alterTable('events')
    .addUniqueConstraint('events_link_uid_unique', ['link_uid'])
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('events')
    .dropConstraint('events_link_uid_unique')
    .execute()

  await db.schema
    .alterTable('events')
    .dropColumn('link_uid')
    .execute()

  await db.schema
    .alterTable('events')
    .dropColumn('public_link')
    .execute()
}
