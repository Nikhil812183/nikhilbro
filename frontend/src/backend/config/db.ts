import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';

const usePostgres = !!process.env.DATABASE_URL;
const isVercel = !!process.env.VERCEL;

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (usePostgres) {
  console.log('Next.js DB: Connecting to PostgreSQL Database...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  if (isVercel) {
    console.warn('Next.js DB: Vercel environment detected with no DATABASE_URL. Booting zero-config in-memory SQLite fallback...');
    sqliteDb = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.error('Failed to initialize in-memory SQLite:', err.message);
      } else {
        console.log('In-memory SQLite database successfully connected for Vercel preview.');
      }
    });
  } else {
    const dbPath = path.resolve(process.cwd(), 'database.sqlite');
    console.log(`Next.js DB: Connecting to local persistent SQLite file at: ${dbPath}`);
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to connect to local SQLite:', err.message);
      } else {
        console.log('Local SQLite database successfully connected.');
      }
    });
  }
}

function sqliteQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      return reject(new Error('SQLite database is not initialized'));
    }

    const sqliteText = text.replace(/\$\d+/g, '?');
    const isInsertOrUpdate = /^\s*(insert|update|delete|create|drop|alter)/i.test(sqliteText);

    if (isInsertOrUpdate) {
      sqliteDb.run(sqliteText, params, function (err) {
        if (err) {
          console.error(`SQLite Exec Error: ${sqliteText}`, err);
          return reject(err);
        }
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
      try {
        const res = await pgPool.query(text, params);
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
  }
};
