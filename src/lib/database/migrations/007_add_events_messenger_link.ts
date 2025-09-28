import { Kysely } from 'kysely'
import { Database } from '../database'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('events')
    .addColumn('messenger_link', 'varchar(500)')
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('events')
    .dropColumn('messenger_link')
    .execute()
}
