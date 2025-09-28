import { Kysely } from 'kysely'
import { Database } from '../database'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('groups')
    .addColumn('public_link', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute()

  await db.schema
    .alterTable('groups')
    .addColumn('link_uid', 'varchar(255)')
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('groups')
    .dropColumn('public_link')
    .execute()

  await db.schema
    .alterTable('groups')
    .dropColumn('link_uid')
    .execute()
}
