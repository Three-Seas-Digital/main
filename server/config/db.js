import dotenv from 'dotenv';
dotenv.config();

const DB_PROVIDER = process.env.DB_PROVIDER || 'mysql'; // 'mysql' or 'supabase'

let pool;

if (DB_PROVIDER === 'supabase') {
  // Supabase mode: use pg (node-postgres) with Supabase connection string
  const pg = await import('pg');
  const Pool = pg.default.Pool || pg.Pool;

  pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: process.env.SUPABASE_DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  // Wrap pg's pool.query to return mysql2-compatible [rows, fields] tuple
  const originalQuery = pool.query.bind(pool);
  pool.query = async (sql, params) => {
    // Convert mysql2 ? placeholders to pg $1, $2, ...
    let paramIndex = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

    // Convert MySQL-specific syntax to PostgreSQL
    const convertedSql = convertMySQLToPostgres(pgSql);

    const result = await originalQuery(convertedSql, params);
    // mysql2 returns [rows, fields]; pg returns { rows, fields, rowCount }
    // For INSERT/UPDATE/DELETE, mysql2 returns [ResultSetHeader, undefined]
    // Simulate that behavior
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(convertedSql)) {
      return [{ affectedRows: result.rowCount, insertId: 0 }, undefined];
    }
    return [result.rows, result.fields];
  };

  // Handle idle connection drops from Neon scale-to-zero (prevents crash)
  pool.on('error', (err) => {
    console.warn('[db] Idle client error (Neon reconnect):', err.message);
  });

  // Test connection
  try {
    const client = await pool.connect();
    console.log('Supabase PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('Supabase PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
} else {
  // MySQL mode (original)
  const mysql = await import('mysql2/promise');
  const createPool = mysql.default.createPool || mysql.createPool;

  pool = createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  // Test connection on startup
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }
}

/**
 * Convert common MySQL-specific SQL syntax to PostgreSQL equivalents.
 * This handles the most frequent patterns found in the route files.
 */
function convertMySQLToPostgres(sql) {
  let converted = sql;

  // INSERT IGNORE → INSERT ... ON CONFLICT DO NOTHING
  converted = converted.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  if (/INSERT\s+INTO\s+client_tags/i.test(sql) && /IGNORE/i.test(sql)) {
    converted = converted.replace(/\)\s*$/m, ') ON CONFLICT DO NOTHING');
  }
  if (/INSERT\s+INTO\s+project_developers/i.test(sql) && /IGNORE/i.test(sql)) {
    converted = converted.replace(/\)\s*$/m, ') ON CONFLICT DO NOTHING');
  }

  // NOW() is valid in both MySQL and PG, no conversion needed
  // CURDATE() → CURRENT_DATE
  converted = converted.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');

  // IFNULL → COALESCE (already used in most routes)
  converted = converted.replace(/IFNULL\s*\(/gi, 'COALESCE(');

  // Boolean TRUE/FALSE — PG uses true/false (same as MySQL in modern versions)

  // ON DUPLICATE KEY UPDATE → ON CONFLICT DO UPDATE SET ...
  // Detect the conflict column from the INSERT's table — default to 'id' (our PK convention)
  const dupKeyMatch = converted.match(/ON\s+DUPLICATE\s+KEY\s+UPDATE\s+(.+)$/is);
  if (dupKeyMatch) {
    const updateClause = dupKeyMatch[1].trim().replace(/;?\s*$/, '');
    // Convert VALUES(col) → EXCLUDED.col
    const pgUpdateClause = updateClause.replace(/VALUES\s*\(\s*(\w+)\s*\)/gi, 'EXCLUDED.$1');
    // Detect conflict column: use lookup_key for market_research, otherwise id
    const tableMatch = converted.match(/INSERT\s+INTO\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : '';
    const conflictCol = table === 'market_research' ? 'lookup_key' : 'id';
    converted = converted.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE\s+.+$/is, `ON CONFLICT (${conflictCol}) DO UPDATE SET ${pgUpdateClause}`);
  }

  return converted;
}

export default pool;
