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

  console.log(`Running Next.js schema migrations... DB: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);

  for (const sql of statements) {
    try {
      await db.query(sql);
    } catch (err: any) {
      console.error(`Next.js DDL Migration Error: ${sql.substring(0, 45)}...`, err.message);
      throw err;
    }
  }
}
export async function seedDatabaseIfEmpty() {
  try {
    const userCheck = await db.query('SELECT count(*) as count FROM users');
    const userCount = parseInt(userCheck.rows[0].count);
    
    if (userCount === 0) {
      console.log('Next.js Database empty! Triggering automatic seed sequence...');
      const bcrypt = require('bcryptjs');
      
      const users = [
        { email: 'admin@gangamaxx.com', password: 'adminpassword', role: 'Admin', name: 'Ganga Maxx Admin' },
        { email: 'sales@gangamaxx.com', password: 'salespassword', role: 'Salesperson', name: 'Priya Nair' },
        { email: 'coordinator@gangamaxx.com', password: 'coordinatorpassword', role: 'Coordinator', name: 'Rohan Sharma' }
      ];
      for (const u of users) {
        const hash = bcrypt.hashSync(u.password, 10);
        await db.query('INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)', [u.email, hash, u.role, u.name]);
      }
      
      const products = [
        { id: 'PROD-01', sku: 'MC-FD-20L', name: 'Maxx-Clean Floor Detergent 20L', category: 'Industrial Chemicals', price: 2450.00, stock: 85, warehouse: 'Jeedimetla IDC' },
        { id: 'PROD-02', sku: 'HD-FS-01', name: 'Heavy Duty Floor Squeegee', category: 'Sanitation Tooling', price: 850.00, stock: 40, warehouse: 'Gachibowli WH' },
        { id: 'PROD-03', sku: 'GP-SHT-12', name: 'Ganga Premium Soft Hand Towels (12pk)', category: 'Washroom Essentials', price: 650.00, stock: 150, warehouse: 'Jeedimetla IDC' },
        { id: 'PROD-04', sku: 'GM-MFM-01', name: 'Ganga Maxx Pro Microfiber Flat Mop', category: 'Hospitality Mops', price: 1200.00, stock: 65, warehouse: 'Gachibowli WH' },
        { id: 'PROD-05', sku: 'GS-C-5L', name: 'Ganga Sanitizer Concentrate 5L', category: 'Industrial Chemicals', price: 1350.00, stock: 12, warehouse: 'Jeedimetla IDC' }
      ];
      for (const p of products) {
        await db.query('INSERT INTO products (id, sku, name, category, price, stock, warehouse) VALUES ($1, $2, $3, $4, $5, $6, $7)', [p.id, p.sku, p.name, p.category, p.price, p.stock, p.warehouse]);
      }

      const customers = [
        { id: 'CUST-01', name: 'Novotel Hyderabad Convention Centre', company: 'Novotel India', contact: '+91 98765 43210', email: 'purchase@novotelhyderabad.com', address: 'Near Hitec City, Kondapur, Hyderabad, Telangana 500084', type: 'Hotel', freq: 'Weekly', status: 'Urgent', last: '2026-06-20T10:00:00.000Z', next: '2026-06-27T10:00:00.000Z', staff: 2 },
        { id: 'CUST-02', name: 'Apollo Hospitals, Jubilee Hills', company: 'Apollo Health Group', contact: '+91 98480 22338', email: 'procurement@apollohyderabad.com', address: 'Road No. 72, Jubilee Hills, Hyderabad, Telangana 500033', type: 'Clinic', freq: 'Weekly', status: 'Urgent', last: '2026-06-18T09:00:00.000Z', next: '2026-06-25T09:00:00.000Z', staff: 2 },
        { id: 'CUST-03', name: 'Wipro Campus Gachibowli', company: 'Wipro Technologies', contact: '+91 80088 12345', email: 'facilities.gachibowli@wipro.com', address: 'Survey No. 203, Gachibowli, Hyderabad, Telangana 500032', type: 'Office', freq: 'Monthly', status: 'Predicted', last: '2026-05-28T11:00:00.000Z', next: '2026-06-28T11:00:00.000Z', staff: 2 },
        { id: 'CUST-04', name: 'Taj Falaknuma Palace', company: 'Taj Hotels Group', contact: '+91 91234 56789', email: 'gm.falaknuma@tajhotels.com', address: 'Engine Bowli, Falaknuma, Hyderabad, Telangana 500053', type: 'Hotel', freq: 'Weekly', status: 'Urgent', last: '2026-06-15T15:30:00.000Z', next: '2026-06-22T15:30:00.000Z', staff: 2 },
        { id: 'CUST-05', name: 'Rainbow Children\'s Hospital Secunderabad', company: 'Rainbow Hospitals Group', contact: '+91 99887 76655', email: 'admin.secunderabad@rainbowhospitals.in', address: 'Vikrampuri Colony, Secunderabad, Telangana 500009', type: 'Clinic', freq: 'Weekly', status: 'Stable', last: '2026-06-25T08:00:00.000Z', next: '2026-07-02T08:00:00.000Z', staff: 3 },
        { id: 'CUST-06', name: 'Google Signature Towers', company: 'Google India Pvt Ltd', contact: '+91 98888 77777', email: 'facilities-hyd@google.com', address: 'Kondapur, Hyderabad, Telangana 500084', type: 'Office', freq: 'Monthly', status: 'Stable', last: '2026-06-02T14:00:00.000Z', next: '2026-06-30T14:00:00.000Z', staff: 2 }
      ];
      for (const c of customers) {
        await db.query(
          `INSERT INTO customers (id, name, company, contact, email, address, type, purchase_frequency, last_order_date, next_reminder_date, status, assigned_staff_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [c.id, c.name, c.company, c.contact, c.email, c.address, c.type, c.freq, c.last, c.next, c.status, c.staff]
        );
      }

      const rules = [
        { product_category: 'Industrial Chemicals', default_cycle_days: 14, consumption_rate_multiplier: 1.2 },
        { product_category: 'Sanitation Tooling', default_cycle_days: 90, consumption_rate_multiplier: 0.8 },
        { product_category: 'Washroom Essentials', default_cycle_days: 30, consumption_rate_multiplier: 1.0 },
        { product_category: 'Hospitality Mops', default_cycle_days: 60, consumption_rate_multiplier: 0.9 }
      ];
      for (const r of rules) {
        await db.query('INSERT INTO reminder_rules (product_category, default_cycle_days, consumption_rate_multiplier) VALUES ($1, $2, $3)', [r.product_category, r.default_cycle_days, r.consumption_rate_multiplier]);
      }

      const settings = [
        { key: 'urgentThresholdDays', value: '3' },
        { key: 'criticalAlarmLatencyMs', value: '150' },
        { key: 'enableAutoDispatch', value: 'true' },
        { key: 'emailTemplate', value: 'Hi {{customerName}},\n\nThis is a reminder from Ganga Maxx Marketplace. Your supply of {{category}} is predicted to run low based on your purchase frequency (Last purchase: {{lastOrderDate}}).\n\nWould you like to process a restock order for {{productName}} today?\n\nRegards,\nGanga Maxx Team' },
        { key: 'whatsappTemplate', value: 'Hello *{{customerName}}*! 🚚\n\nYour supply of *{{category}}* (specifically *{{productName}}*) is due for replenishing.\nLast order date: {{lastOrderDate}}.\n\nReply with *YES* to immediately place a reorder, or click the link to manage: https://gangamaxx.in/reorder/{{customerId}}' },
        { key: 'smsTemplate', value: 'Ganga Maxx: Hello {{customerName}}, your B2B supply of {{productName}} is due for restock. Reply YES to confirm order or call your manager.' }
      ];
      for (const s of settings) {
        await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
      }

      const orders = [
        { id: 'ORD-001', customer_id: 'CUST-01', total_amount: 4900.00, order_date: '2026-06-20T10:00:00.000Z', status: 'Delivered', product_id: 'PROD-01', qty: 2 },
        { id: 'ORD-002', customer_id: 'CUST-02', total_amount: 850.00, order_date: '2026-06-18T09:00:00.000Z', status: 'Delivered', product_id: 'PROD-02', qty: 1 },
        { id: 'ORD-003', customer_id: 'CUST-03', total_amount: 1950.00, order_date: '2026-05-28T11:00:00.000Z', status: 'Delivered', product_id: 'PROD-03', qty: 3 },
        { id: 'ORD-004', customer_id: 'CUST-04', total_amount: 2400.00, order_date: '2026-06-15T15:30:00.000Z', status: 'Delivered', product_id: 'PROD-04', qty: 2 },
        { id: 'ORD-005', customer_id: 'CUST-05', total_amount: 850.00, order_date: '2026-06-25T08:00:00.000Z', status: 'In Transit', product_id: 'PROD-02', qty: 1 }
      ];
      for (const o of orders) {
        await db.query('INSERT INTO orders (id, customer_id, total_amount, order_date, status) VALUES ($1, $2, $3, $4, $5)', [o.id, o.customer_id, o.total_amount, o.order_date, o.status]);
        await db.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)', [o.id, o.product_id, o.qty, o.total_amount / o.qty]);
      }

      const reminders = [
        { customer_id: 'CUST-01', product_id: 'PROD-01', date: '2026-06-27T10:00:00.000Z', cycle: 'Weekly', status: 'Pending' },
        { customer_id: 'CUST-02', product_id: 'PROD-02', date: '2026-06-25T09:00:00.000Z', cycle: 'Weekly', status: 'Sent' },
        { customer_id: 'CUST-03', product_id: 'PROD-03', date: '2026-06-28T11:00:00.000Z', cycle: 'Monthly', status: 'Pending' },
        { customer_id: 'CUST-04', product_id: 'PROD-04', date: '2026-06-22T15:30:00.000Z', cycle: 'Weekly', status: 'Failed', log: 'SMS Gateway response code 503' },
        { customer_id: 'CUST-01', product_id: 'PROD-01', date: '2026-06-13T10:00:00.000Z', cycle: 'Weekly', status: 'Completed', log: 'Reorder placed via WhatsApp link click.' }
      ];
      for (const rem of reminders) {
        await db.query('INSERT INTO reminder_history (customer_id, product_id, reminder_date, cycle_type, status, response_log) VALUES ($1, $2, $3, $4, $5, $6)', [rem.customer_id, rem.product_id, rem.date, rem.cycle, rem.status, rem.log || null]);
      }

      const logs = [
        { role: 'Admin', event: 'System initialized and default B2B parameters configured.' },
        { role: 'Salesperson', event: 'Assigned as primary accounts manager for Novotel Hyderabad Convention Centre.' },
        { role: 'System Decider', event: 'Automated Rule engine recalculated replenishment intervals. Flagged CUST-02 as Urgent.' }
      ];
      for (const log of logs) {
        await db.query('INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)', [log.role, log.event]);
      }

      console.log('Next.js database seeded successfully!');
    }
  } catch (err: any) {
    console.error('Error during Next.js database seed:', err.message);
  }
}
