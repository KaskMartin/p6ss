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
}

// Create Kysely instance
export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool,
  }),
})

// Export the pool for direct access if needed
export { pool }
