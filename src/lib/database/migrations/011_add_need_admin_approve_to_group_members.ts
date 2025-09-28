import { Kysely } from 'kysely'
import { Database } from '../database'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('group_members')
    .addColumn('need_admin_approve', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('group_members')
    .dropColumn('need_admin_approve')
    .execute()
}
