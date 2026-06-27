import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const usePostgres = !!process.env.DATABASE_URL;

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (usePostgres) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  // Store sqlite db at process.cwd() (the root of the running Next.js project)
  const dbPath = path.resolve(process.cwd(), 'database.sqlite');
  
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite in Next.js:', err.message);
    } else {
      console.log(`SQLite database successfully connected at: ${dbPath}`);
    }
  });
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
