import { Kysely, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'

// Database connection configuration from docker-compose.yml
const dbConfig = {
  host: 'localhost',
  port: 3344, // Mapped port from docker-compose
  user: 'user', // MYSQL_USER from docker-compose
  password: 'secret', // MYSQL_PASSWORD from docker-compose
  database: 'p6ss', // MYSQL_DATABASE from docker-compose
}

// Create connection pool
const pool = createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 10,
})

// Database interface - define your tables here
export interface Database {
  users: {
    id: number
    email: string
    name: string | null
    password: string
    is_admin: boolean
    created_at: Date
    updated_at: Date
  }
  sessions: {
    id: string
    session_token: string
    user_id: number
    expires: Date
    created_at: Date
    updated_at: Date
  }
  accounts: {
    id: string
    user_id: number
    type: string
    provider: string
    provider_account_id: string
    refresh_token: string | null
    access_token: string | null
    expires_at: number | null
    token_type: string | null
    scope: string | null
    id_token: string | null
    session_state: string | null
    created_at: Date
    updated_at: Date
  }
  verification_tokens: {
    identifier: string
    token: string
    expires: Date
  }
  groups: {
    id: number
    name: string
    description: string | null
    created_by: number
    created_at: Date
    updated_at: Date
  }
  group_members: {
    id: number
    user_id: number
    group_id: number
    joined_at: Date
    created_at: Date
    updated_at: Date
  }
  group_roles: {
    id: number
    name: string
    description: string | null
    permissions: string | null
    created_at: Date
    updated_at: Date
  }
  user_group_roles: {
    id: number
    user_id: number
    group_id: number
    role_id: number
    assigned_by: number
    assigned_at: Date
    created_at: Date
    updated_at: Date
  }
  invitations: {
    id: number
    group_id: number
    invited_email: string
    invited_by: number
    description: string | null
    status: 'pending' | 'accepted' | 'declined'
    accepted_at: Date | null
    declined_at: Date | null
    created_at: Date
    updated_at: Date
  }
  events: {
    id: number
    group_id: number
    created_by: number
    title: string
    subtitle: string | null
    description: string | null
    start_datetime: Date
    end_datetime: Date
    address: string | null
    location_lat: number | null
    location_lng: number | null
    list_item_picture: string | null
    header_picture: string | null
    background_picture: string | null
    invite_paper_image: string | null
    public_link: boolean
    link_uid: string | null
    created_at: Date
    updated_at: Date
  }
}

// Create Kysely instance
export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool,
  }),
})

// Export the pool for direct access if needed
export { pool }
