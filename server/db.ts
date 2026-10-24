import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// We use a pool if DATABASE_URL is configured
let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
}

export function getPool(): Pool {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      return pool;
    }
    throw new Error('DATABASE_URL is not configured. CampusConnect requires a PostgreSQL database (e.g. Neon).');
  }
  return pool;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
}

/**
 * Initializes required tables if they don't exist.
 * Completely stateless & idempotent.
 */
export async function initDb(): Promise<void> {
  if (!isDbConfigured()) {
    console.warn('DATABASE_URL not set. Database initialization deferred until DATABASE_URL is provided.');
    return;
  }

  const p = getPool();
  const client = await p.connect();

  try {
    await client.query('BEGIN');

    // Enable pgcrypto extension for gen_random_uuid()
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // 1. Campuses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campuses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        address TEXT,
        contact_email VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Users table
    // Roles: 'user', 'worker', 'co_admin', 'admin', 'founder'
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        department VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_campus_email UNIQUE (campus_id, email)
      );
    `);

    // Ensure founder unique constraint on email where campus_id IS NULL
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_email ON users (email) WHERE campus_id IS NULL;
    `);

    // 3. Issues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        photo_url TEXT,
        status VARCHAR(50) DEFAULT 'open',
        urgency VARCHAR(50) DEFAULT 'medium',
        ai_analysis JSONB,
        ai_flagged BOOLEAN DEFAULT FALSE,
        ai_flag_reason TEXT,
        resolution_notes TEXT,
        resolution_photo_url TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Issue Upvotes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS issue_upvotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_issue_upvote UNIQUE (issue_id, user_id)
      );
    `);

    // 5. Issue Comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS issue_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Activity Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('PostgreSQL database schema initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}
