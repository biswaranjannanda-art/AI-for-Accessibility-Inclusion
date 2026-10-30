import pg from 'pg';

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let isPostgresAvailable = false;

export async function initPostgres(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('localhost') && !process.env.FORCE_PG) {
    console.log('ℹ️ DATABASE_URL not set to active external host. Using integrated vector repository.');
    return false;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully.');

    // Attempt to enable pgvector extension and create schema
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'researcher',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create workspaces table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          domain VARCHAR(100) DEFAULT 'General Science',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create documents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          authors VARCHAR(500),
          publication_date DATE,
          file_name VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          file_type VARCHAR(50) NOT NULL,
          file_size_bytes BIGINT NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          summary TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create document_chunks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          token_count INTEGER NOT NULL,
          embedding vector(768),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create extractions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS extractions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          methodology VARCHAR(255),
          sample_size VARCHAR(100),
          key_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
          limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
          extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create synthesis_sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS synthesis_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create chat_messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL REFERENCES synthesis_sessions(id) ON DELETE CASCADE,
          sender VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          citations JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('PostgreSQL schema and pgvector tables verified.');
    } catch (schemaErr: any) {
      console.warn('PostgreSQL extension/table notice:', schemaErr.message);
    } finally {
      client.release();
    }

    isPostgresAvailable = true;
    return true;
  } catch (err: any) {
    console.warn('Could not establish PostgreSQL connection:', err.message);
    isPostgresAvailable = false;
    return false;
  }
}
