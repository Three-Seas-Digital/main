import { Pool as PgPool, QueryResult } from 'pg';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ─── Normalised query result ──────────────────────────────────────────────────
// Both drivers are wrapped so every call site can use:
//   const [rows] = await pool.query(sql, values)
//   const [rows] = await pool.query(sql)          // values optional
//
// For SELECT:  rows is any[]  (the result rows)
// For INSERT/UPDATE/DELETE: rows is the raw driver result object, cast to any
//   so callers can do (rows as any).affectedRows or (rows as any).insertId

// A minimal connection handle returned by transaction() — mirrors what
// route code that calls pool.getConnection() / conn.query() / conn.commit()
// expects.
export interface DbConnection {
  query(sql: string, values?: any[]): Promise<[any, any]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

export interface DbPool {
  query(sql: string, values?: any[]): Promise<[any, any]>;
  getConnection(): Promise<DbConnection>;
}

// ─── PostgreSQL adapter ───────────────────────────────────────────────────────
// pg.Pool.query() returns QueryResult, not a tuple.
// We wrap it to produce [rows, fields] so destructuring works identically.
// Placeholder conversion: MySQL uses ?, Postgres uses $1 $2 …
function convertPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function normalizePgResult(sql: string, result: QueryResult): [any, any] {
  const trimmed = sql.trimStart().toUpperCase();
  const isWrite =
    trimmed.startsWith('INSERT') ||
    trimmed.startsWith('UPDATE') ||
    trimmed.startsWith('DELETE');

  if (isWrite) {
    const meta = {
      affectedRows: result.rowCount ?? 0,
      insertId: result.rows[0]?.id ?? null,
      rowCount: result.rowCount ?? 0,
    };
    return [meta, result.fields];
  }
  return [result.rows, result.fields];
}

function makePgPool(pgPool: PgPool): DbPool {
  return {
    async query(sql: string, values?: any[]): Promise<[any, any]> {
      const pgSql = convertPlaceholders(sql);
      const result: QueryResult = await pgPool.query(pgSql, values);
      return normalizePgResult(sql, result);
    },

    async getConnection(): Promise<DbConnection> {
      const client = await pgPool.connect();
      return {
        async query(sql: string, values?: any[]): Promise<[any, any]> {
          const pgSql = convertPlaceholders(sql);
          const result: QueryResult = await client.query(pgSql, values);
          return normalizePgResult(sql, result);
        },
        async beginTransaction(): Promise<void> {
          await client.query('BEGIN');
        },
        async commit(): Promise<void> {
          await client.query('COMMIT');
        },
        async rollback(): Promise<void> {
          await client.query('ROLLBACK');
        },
        release(): void {
          client.release();
        },
      };
    },
  };
}

// ─── MySQL adapter ────────────────────────────────────────────────────────────
// mysql2/promise Pool.query() already returns [rows, fields] — we just need
// to conform to the DbPool interface with the explicit signature.
function makeMysqlPool(mysqlPool: mysql.Pool): DbPool {
  return {
    async query(sql: string, values?: any[]): Promise<[any, any]> {
      const [rows, fields] = await mysqlPool.query(sql, values);
      return [rows, fields];
    },

    async getConnection(): Promise<DbConnection> {
      const conn = await mysqlPool.getConnection();
      return {
        async query(sql: string, values?: any[]): Promise<[any, any]> {
          const [rows, fields] = await conn.query(sql, values);
          return [rows, fields];
        },
        async beginTransaction(): Promise<void> {
          await conn.beginTransaction();
        },
        async commit(): Promise<void> {
          await conn.commit();
        },
        async rollback(): Promise<void> {
          await conn.rollback();
        },
        release(): void {
          conn.release();
        },
      };
    },
  };
}

// ─── Pool construction ────────────────────────────────────────────────────────
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

let pool: DbPool;

if (USE_POSTGRES) {
  const pgPool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'threeseas',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.DATABASE_URL?.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  pgPool.on('error', (err) => {
    console.error('[db] Idle PG client error:', err.message);
  });

  pool = makePgPool(pgPool);
  console.log('[db] PostgreSQL pool created');
} else {
  const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'threeseas',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  pool = makeMysqlPool(mysqlPool);
  console.log('[db] MySQL pool created');
}

// ─── Exports ──────────────────────────────────────────────────────────────────
// Default export (used by most routes as `import pool from '../config/db.js'`)
export default pool;

// Named export (used by appointments.ts and clients.ts as `import { db }`)
export { pool as db };
