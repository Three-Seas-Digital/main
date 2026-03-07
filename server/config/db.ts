import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

// Declare as any to avoid query() type conflicts between Pool and mysql.Connection
let db: any;

if (USE_POSTGRES) {
  db = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'threeseas',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  console.log('PostgreSQL pool created');
} else {
  db = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'threeseas',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log('MySQL connection created');
}

export default db;