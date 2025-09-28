#!/usr/bin/env tsx

import { migrate } from '../src/lib/database/migrate'

async function setupDatabase() {
  console.log('🚀 Setting up database...')
  
  try {
    await migrate()
    console.log('✅ Database setup completed successfully!')
    console.log('')
    console.log('You can now:')
    console.log('1. Start the database: yarn docker:start:db')
    console.log('2. Run migrations: yarn migrate')
    console.log('3. Start the app: yarn dev')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()
