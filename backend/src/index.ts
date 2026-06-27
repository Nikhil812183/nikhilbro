import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api';
import { db } from './config/db';
import { initializeDatabase } from './database/schema';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express limits and parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter middleware to secure endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Bind routing map
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Global Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Auto initialize and seed database on startup
async function startServer() {
  try {
    // 1. Run migrations
    await initializeDatabase();
    
    // 2. Check if seeding is required (if user count is 0)
    const userCheck = await db.query('SELECT count(*) as count FROM users');
    const userCount = parseInt(userCheck.rows[0].count);
    
    if (userCount === 0) {
      console.log('Database empty! Triggering automatic seed sequence...');
      // To avoid circular dependency or import leaks, we can execute the seed inline or import it
      const bcrypt = require('bcryptjs');
      
      // Insert Seed Users
      const users = [
        { email: 'admin@gangamaxx.com', password: 'adminpassword', role: 'Admin', name: 'Ganga Maxx Admin' },
        { email: 'sales@gangamaxx.com', password: 'salespassword', role: 'Salesperson', name: 'Priya Nair' },
        { email: 'coordinator@gangamaxx.com', password: 'coordinatorpassword', role: 'Coordinator', name: 'Rohan Sharma' }
      ];
      for (const u of users) {
        const hash = bcrypt.hashSync(u.password, 10);
        await db.query('INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)', [u.email, hash, u.role, u.name]);
      }
      
      // Insert Seed Products
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

      // Insert Seed Customers
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

      // Insert Seed Reminder Rules
      const rules = [
        { product_category: 'Industrial Chemicals', default_cycle_days: 14, consumption_rate_multiplier: 1.2 },
        { product_category: 'Sanitation Tooling', default_cycle_days: 90, consumption_rate_multiplier: 0.8 },
        { product_category: 'Washroom Essentials', default_cycle_days: 30, consumption_rate_multiplier: 1.0 },
        { product_category: 'Hospitality Mops', default_cycle_days: 60, consumption_rate_multiplier: 0.9 }
      ];
      for (const r of rules) {
        await db.query('INSERT INTO reminder_rules (product_category, default_cycle_days, consumption_rate_multiplier) VALUES ($1, $2, $3)', [r.product_category, r.default_cycle_days, r.consumption_rate_multiplier]);
      }

      // Insert Seed Settings
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

      // Insert Seed Orders
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

      // Insert Seed Reminders
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

      // Insert Seed Audit Logs
      const logs = [
        { role: 'Admin', event: 'System initialized and default B2B parameters configured.' },
        { role: 'Salesperson', event: 'Assigned as primary accounts manager for Novotel Hyderabad Convention Centre.' },
        { role: 'System Decider', event: 'Automated Rule engine recalculated replenishment intervals. Flagged CUST-02 as Urgent.' }
      ];
      for (const log of logs) {
        await db.query('INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)', [log.role, log.event]);
      }

      console.log('Database successfully seeded during server start!');
    }
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Backend Server listening at: http://localhost:${PORT}`);
    });
  } catch (err: any) {
    console.error('Fatal initialization error:', err.message);
    process.exit(1);
  }
}

startServer();
