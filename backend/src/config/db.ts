import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = !!process.env.DATABASE_URL;

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (usePostgres) {
  console.log('DB Config: Using PostgreSQL database connection.');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('DB Config: DATABASE_URL not found. Initializing local SQLite database...');
  const dbPath = path.resolve(__dirname, '../../database.sqlite');
  
  // Ensure the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite:', err.message);
    } else {
      console.log(`SQLite database successfully connected at: ${dbPath}`);
    }
  });
}

// Helper to run SQLite queries wrapped in promises
function sqliteQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      return reject(new Error('SQLite database is not initialized'));
    }

    // Convert PG style placeholders ($1, $2, ...) to SQLite style (?, ?, ...)
    const sqliteText = text.replace(/\$\d+/g, '?');
    const isInsertOrUpdate = /^\s*(insert|update|delete|create|drop|alter)/i.test(sqliteText);

    if (isInsertOrUpdate) {
      sqliteDb.run(sqliteText, params, function (err) {
        if (err) {
          console.error(`SQLite Exec Error: ${sqliteText}`, err);
          return reject(err);
        }
        
        // Return a mock result for write operations. If RETURNING is simulated or supported:
        // Try to fetch last inserted ID or changes if needed.
        resolve({
          rows: [{ id: this.lastID, changes: this.changes }],
          rowCount: this.changes
        });
      });
    } else {
      sqliteDb.all(sqliteText, params, (err, rows) => {
        if (err) {
          console.error(`SQLite Query Error: ${sqliteText}`, err);
          return reject(err);
        }
        resolve({
          rows: rows || [],
          rowCount: (rows || []).length
        });
      });
    }
  });
}

export const db = {
  async query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    if (usePostgres && pgPool) {
      const start = Date.now();
      try {
        const res = await pgPool.query(text, params);
        const duration = Date.now() - start;
        return {
          rows: res.rows,
          rowCount: res.rowCount ?? res.rows.length
        };
      } catch (err) {
        console.error('PostgreSQL query execution error:', err);
        throw err;
      }
    } else {
      return sqliteQuery(text, params);
    }
  },
  
  // Close connection pool when app shutdowns
  async close() {
    if (pgPool) {
      await pgPool.end();
    }
    if (sqliteDb) {
      await new Promise<void>((resolve) => {
        sqliteDb!.close(() => resolve());
      });
    }
  }
};
