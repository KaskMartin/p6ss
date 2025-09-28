import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create groups table
  await db.schema
    .createTable('groups')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_by', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull())
    .addColumn('updated_at', 'datetime', (col) => col.notNull())
    .execute()

  // Create group_members table (many-to-many between users and groups)
  await db.schema
    .createTable('group_members')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('group_id', 'integer', (col) => col.notNull())
    .addColumn('joined_at', 'datetime', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull())
    .addColumn('updated_at', 'datetime', (col) => col.notNull())
    .execute()

  // Create group_roles table (defines available roles)
  await db.schema
    .createTable('group_roles')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('permissions', 'json')
    .addColumn('created_at', 'datetime', (col) => col.notNull())
    .addColumn('updated_at', 'datetime', (col) => col.notNull())
    .execute()

  // Create user_group_roles table (assigns roles to users within groups)
  await db.schema
    .createTable('user_group_roles')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('group_id', 'integer', (col) => col.notNull())
    .addColumn('role_id', 'integer', (col) => col.notNull())
    .addColumn('assigned_by', 'integer', (col) => col.notNull())
    .addColumn('assigned_at', 'datetime', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull())
    .addColumn('updated_at', 'datetime', (col) => col.notNull())
    .execute()

  // Note: Foreign key constraints will be added later if needed
  // For now, we'll rely on application-level referential integrity

  // Add unique constraints
  await db.schema
    .alterTable('group_members')
    .addUniqueConstraint('unique_user_group', ['user_id', 'group_id'])
    .execute()

  await db.schema
    .alterTable('user_group_roles')
    .addUniqueConstraint('unique_user_group_role', ['user_id', 'group_id', 'role_id'])
    .execute()

  // Insert default roles
  await db
    .insertInto('group_roles')
    .values([
      {
        name: 'admin',
        description: 'Group administrator with full permissions',
        permissions: JSON.stringify(['manage_group', 'manage_members', 'manage_roles', 'delete_group']),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'moderator',
        description: 'Group moderator with limited administrative permissions',
        permissions: JSON.stringify(['manage_members', 'moderate_content']),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'member',
        description: 'Regular group member with basic permissions',
        permissions: JSON.stringify(['view_group', 'participate']),
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order
  await db.schema.dropTable('user_group_roles').ifExists().execute()
  await db.schema.dropTable('group_roles').ifExists().execute()
  await db.schema.dropTable('group_members').ifExists().execute()
  await db.schema.dropTable('groups').ifExists().execute()
}
