import { Kysely } from 'kysely'
import { Database } from '../database'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('images')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('uid', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('url', 'varchar(500)', (col) => col.notNull())
    .addColumn('thumb_url', 'varchar(500)')
    .addColumn('width', 'integer')
    .addColumn('height', 'integer')
    .addColumn('type', 'varchar(50)', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull())
    .addColumn('updated_at', 'datetime', (col) => col.notNull())
    .execute()

  // Add index for type for better query performance
  await db.schema
    .createIndex('images_type_index')
    .on('images')
    .column('type')
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('images_type_index').ifExists().execute()
  await db.schema.dropTable('images').ifExists().execute()
}
