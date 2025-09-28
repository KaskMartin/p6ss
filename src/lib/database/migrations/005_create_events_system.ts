import { Kysely } from 'kysely'
import { Database } from '../database'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('events')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('group_id', 'integer', (col) => col.notNull())
    .addColumn('created_by', 'integer', (col) => col.notNull())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('subtitle', 'varchar(255)')
    .addColumn('description', 'text')
    .addColumn('start_datetime', 'datetime', (col) => col.notNull())
    .addColumn('end_datetime', 'datetime', (col) => col.notNull())
    .addColumn('address', 'varchar(500)')
    .addColumn('location_lat', 'decimal(10, 8)')
    .addColumn('location_lng', 'decimal(11, 8)')
    .addColumn('list_item_picture', 'varchar(500)')
    .addColumn('header_picture', 'varchar(500)')
    .addColumn('background_picture', 'varchar(500)')
    .addColumn('invite_paper_image', 'varchar(500)')
    .addColumn('created_at', 'datetime', (col) => col.notNull())
    .addColumn('updated_at', 'datetime', (col) => col.notNull())
    .execute()

  // Add foreign key constraints
  await db.schema
    .alterTable('events')
    .addForeignKeyConstraint('events_group_id_fk', ['group_id'], 'groups', ['id'], (cb) =>
      cb.onDelete('cascade')
    )
    .execute()

  await db.schema
    .alterTable('events')
    .addForeignKeyConstraint('events_created_by_fk', ['created_by'], 'users', ['id'], (cb) =>
      cb.onDelete('cascade')
    )
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('events').ifExists().execute()
}
