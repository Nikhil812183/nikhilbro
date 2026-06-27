import { db } from '../config/db';

const sqliteDDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    contact TEXT,
    email TEXT UNIQUE NOT NULL,
    address TEXT,
    type TEXT NOT NULL,
    purchase_frequency TEXT NOT NULL,
    last_order_date TEXT,
    next_reminder_date TEXT,
    status TEXT NOT NULL,
    assigned_staff_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    warehouse TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    total_amount REAL NOT NULL,
    order_date TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`,
  `CREATE TABLE IF NOT EXISTS reminder_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_category TEXT UNIQUE NOT NULL,
    default_cycle_days INTEGER NOT NULL,
    consumption_rate_multiplier REAL DEFAULT 1.0
  )`,
  `CREATE TABLE IF NOT EXISTS reminder_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    reminder_date TEXT NOT NULL,
    cycle_type TEXT NOT NULL,
    status TEXT NOT NULL,
    response_log TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    template_name TEXT NOT NULL,
    content_preview TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_role TEXT NOT NULL,
    event TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`
];

const postgresDDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    contact VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(500),
    type VARCHAR(50) NOT NULL,
    purchase_frequency VARCHAR(50) NOT NULL,
    last_order_date VARCHAR(50),
    next_reminder_date VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    assigned_staff_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL,
    warehouse VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    total_amount DECIMAL(10,2) NOT NULL,
    order_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id),
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reminder_rules (
    id SERIAL PRIMARY KEY,
    product_category VARCHAR(100) UNIQUE NOT NULL,
    default_cycle_days INTEGER NOT NULL,
    consumption_rate_multiplier DECIMAL(5,2) DEFAULT 1.0
  )`,
  `CREATE TABLE IF NOT EXISTS reminder_history (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    reminder_date VARCHAR(50) NOT NULL,
    cycle_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    channel VARCHAR(50) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    content_preview TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_role VARCHAR(50) NOT NULL,
    event TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`
];

export async function initializeDatabase() {
  const isPostgres = !!process.env.DATABASE_URL;
  const statements = isPostgres ? postgresDDL : sqliteDDL;

  console.log(`Running migrations... Database type: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);

  for (const sql of statements) {
    try {
      await db.query(sql);
    } catch (err: any) {
      console.error(`Migration Error executing statement: ${sql.substring(0, 50)}...`, err.message);
      throw err;
    }
  }

  console.log('Migrations completed successfully.');
}
