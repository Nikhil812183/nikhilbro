import { Pool } from 'pg';
import alasql from 'alasql';

// Set SQLite compatibility mode in alasql
alasql.options.sqlite = true;

const usePostgres = !!process.env.DATABASE_URL;

let pgPool: Pool | null = null;

if (usePostgres) {
  console.log('Next.js DB: Connecting to PostgreSQL Database...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  console.log('Next.js DB: Booting zero-config in-memory alasql engine (Pure JS)...');
}

function alasqlQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  return new Promise((resolve, reject) => {
    try {
      let cleanText = text.replace(/\$\d+/g, '?');

      // Intercept SQLite/Postgre specific "ON CONFLICT" query for settings
      if (cleanText.includes('ON CONFLICT') && cleanText.includes('settings')) {
        const key = params[0];
        const value = params[1];
        
        try {
          const updateResult = alasql('UPDATE settings SET [value] = ? WHERE [key] = ?', [value, key]) as any;
          if (updateResult && updateResult > 0) {
            return resolve({ rows: [{ changes: updateResult }], rowCount: updateResult });
          }
        } catch (e) {
          // Ignore update error, fallback to insert
        }
        
        const insertResult = alasql('INSERT INTO settings ([key], [value]) VALUES (?, ?)', [key, value]);
        return resolve({ rows: [{ id: insertResult }], rowCount: 1 });
      }

      // Execute synchronous query in alasql
      const result = alasql(cleanText, params);

      // alasql returns an array of objects for SELECTs, or a number/object for INSERT/UPDATE
      let rows: any[] = [];
      if (Array.isArray(result)) {
        rows = result;
      } else if (result !== null && result !== undefined) {
        rows = typeof result === 'object' ? [result] : [{ result }];
      }

      resolve({
        rows: rows,
        rowCount: rows.length
      });
    } catch (err: any) {
      console.error(`Alasql Query Error: ${text}`, err.message);
      reject(err);
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
      return alasqlQuery(text, params);
    }
  }
};
