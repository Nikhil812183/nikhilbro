import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { initializeDatabase } from './schema';

const SEED_USERS = [
  {
    email: 'admin@gangamaxx.com',
    password: 'adminpassword',
    role: 'Admin',
    name: 'Ganga Maxx Admin',
    status: 'Active'
  },
  {
    email: 'sales@gangamaxx.com',
    password: 'salespassword',
    role: 'Salesperson',
    name: 'Priya Nair',
    status: 'Active'
  },
  {
    email: 'coordinator@gangamaxx.com',
    password: 'coordinatorpassword',
    role: 'Coordinator',
    name: 'Rohan Sharma',
    status: 'Active'
  },
  {
    email: 'dispatcher@gangamaxx.com',
    password: 'dispatcherpassword',
    role: 'Dispatcher',
    name: 'Ramesh Kumar',
    status: 'Active'
  }
];

const SEED_CUSTOMERS = [
  {
    id: 'CUST-01',
    name: 'Novotel Hyderabad Convention Centre',
    company: 'Novotel India',
    contact: '+91 98765 43210',
    email: 'purchase@novotelhyderabad.com',
    address: 'Near Hitec City, Kondapur, Hyderabad, Telangana 500084',
    type: 'Hotel',
    purchase_frequency: 'Weekly',
    last_order_date: '2026-06-20T10:00:00.000Z',
    next_reminder_date: '2026-06-27T10:00:00.000Z',
    status: 'Urgent',
    assigned_staff_id: 2
  },
  {
    id: 'CUST-02',
    name: 'Apollo Hospitals, Jubilee Hills',
    company: 'Apollo Health Group',
    contact: '+91 98480 22338',
    email: 'procurement@apollohyderabad.com',
    address: 'Road No. 72, Jubilee Hills, Hyderabad, Telangana 500033',
    type: 'Clinic',
    purchase_frequency: 'Weekly',
    last_order_date: '2026-06-18T09:00:00.000Z',
    next_reminder_date: '2026-06-25T09:00:00.000Z', // Overdue Reminder!
    status: 'Urgent',
    assigned_staff_id: 4
  },
  {
    id: 'CUST-03',
    name: 'Wipro Campus Gachibowli',
    company: 'Wipro Technologies',
    contact: '+91 80088 12345',
    email: 'facilities.gachibowli@wipro.com',
    address: 'Survey No. 203, Gachibowli, Hyderabad, Telangana 500032',
    type: 'Office',
    purchase_frequency: 'Monthly',
    last_order_date: '2026-05-28T11:00:00.000Z',
    next_reminder_date: '2026-06-28T11:00:00.000Z',
    status: 'Predicted',
    assigned_staff_id: 2
  },
  {
    id: 'CUST-04',
    name: 'Taj Falaknuma Palace',
    company: 'Taj Hotels Group',
    contact: '+91 91234 56789',
    email: 'gm.falaknuma@tajhotels.com',
    address: 'Engine Bowli, Falaknuma, Hyderabad, Telangana 500053',
    type: 'Hotel',
    purchase_frequency: 'Weekly',
    last_order_date: '2026-06-15T15:30:00.000Z',
    next_reminder_date: '2026-06-22T15:30:00.000Z', // Overdue
    status: 'Urgent',
    assigned_staff_id: 2
  },
  {
    id: 'CUST-05',
    name: "Rainbow Children's Hospital Secunderabad",
    company: 'Rainbow Hospitals Group',
    contact: '+91 99887 76655',
    email: 'admin.secunderabad@rainbowhospitals.in',
    address: 'Vikrampuri Colony, Secunderabad, Telangana 500009',
    type: 'Clinic',
    purchase_frequency: 'Weekly',
    last_order_date: '2026-06-25T08:00:00.000Z',
    next_reminder_date: '2026-07-02T08:00:00.000Z',
    status: 'Stable',
    assigned_staff_id: 3
  },
  {
    id: 'CUST-06',
    name: 'Google Signature Towers',
    company: 'Google India Pvt Ltd',
    contact: '+91 98888 77777',
    email: 'facilities-hyd@google.com',
    address: 'Kondapur, Hyderabad, Telangana 500084',
    type: 'Office',
    purchase_frequency: 'Monthly',
    last_order_date: '2026-06-02T14:00:00.000Z',
    next_reminder_date: '2026-06-30T14:00:00.000Z',
    status: 'Stable',
    assigned_staff_id: 2
  }
];

const SEED_PRODUCTS = [
  {
    id: 'PROD-01',
    sku: 'MC-FD-20L',
    name: 'Maxx-Clean Floor Detergent 20L',
    category: 'Industrial Chemicals',
    price: 2450.00,
    stock: 85,
    warehouse: 'Jeedimetla IDC'
  },
  {
    id: 'PROD-02',
    sku: 'HD-FS-01',
    name: 'Heavy Duty Floor Squeegee',
    category: 'Sanitation Tooling',
    price: 850.00,
    stock: 40,
    warehouse: 'Gachibowli WH'
  },
  {
    id: 'PROD-03',
    sku: 'GP-SHT-12',
    name: 'Ganga Premium Soft Hand Towels (12pk)',
    category: 'Washroom Essentials',
    price: 650.00,
    stock: 150,
    warehouse: 'Jeedimetla IDC'
  },
  {
    id: 'PROD-04',
    sku: 'GM-MFM-01',
    name: 'Ganga Maxx Pro Microfiber Flat Mop',
    category: 'Hospitality Mops',
    price: 1200.00,
    stock: 65,
    warehouse: 'Gachibowli WH'
  },
  {
    id: 'PROD-05',
    sku: 'GS-C-5L',
    name: 'Ganga Sanitizer Concentrate 5L',
    category: 'Industrial Chemicals',
    price: 1350.00,
    stock: 12, // Low stock warning!
    warehouse: 'Jeedimetla IDC'
  }
];

const SEED_REMINDER_RULES = [
  { product_category: 'Industrial Chemicals', default_cycle_days: 14, consumption_rate_multiplier: 1.2 },
  { product_category: 'Sanitation Tooling', default_cycle_days: 90, consumption_rate_multiplier: 0.8 },
  { product_category: 'Washroom Essentials', default_cycle_days: 30, consumption_rate_multiplier: 1.0 },
  { product_category: 'Hospitality Mops', default_cycle_days: 60, consumption_rate_multiplier: 0.9 }
];

const SEED_SETTINGS = [
  { key: 'urgentThresholdDays', value: '3' },
  { key: 'criticalAlarmLatencyMs', value: '150' },
  { key: 'enableAutoDispatch', value: 'true' },
  { key: 'emailTemplate', value: 'Hi {{customerName}},\n\nThis is a reminder from Ganga Maxx Marketplace. Your supply of {{category}} is predicted to run low based on your purchase frequency (Last purchase: {{lastOrderDate}}).\n\nWould you like to process a restock order for {{productName}} today?\n\nRegards,\nGanga Maxx Team' },
  { key: 'whatsappTemplate', value: 'Hello *{{customerName}}*! 🚚\n\nYour supply of *{{category}}* (specifically *{{productName}}*) is due for replenishing.\nLast order date: {{lastOrderDate}}.\n\nReply with *YES* to immediately place a reorder, or click the link to manage: https://gangamaxx.in/reorder/{{customerId}}' },
  { key: 'smsTemplate', value: 'Ganga Maxx: Hello {{customerName}}, your B2B supply of {{productName}} is due for restock. Reply YES to confirm order or call your manager.' }
];

async function seed() {
  try {
    // Run schema setup first
    await initializeDatabase();

    console.log('Seeding database tables...');

    // 1. Seed Users
    const userCount = await db.query('SELECT count(*) as count FROM users');
    const hasUsers = parseInt(userCount.rows[0].count) > 0;
    if (!hasUsers) {
      console.log('Inserting seed users...');
      for (const u of SEED_USERS) {
        const hash = bcrypt.hashSync(u.password, 10);
        await db.query(
          'INSERT INTO users (email, password_hash, role, name, status) VALUES ($1, $2, $3, $4, $5)',
          [u.email, hash, u.role, u.name, u.status]
        );
      }
    }

    // 2. Seed Customers
    const custCount = await db.query('SELECT count(*) as count FROM customers');
    if (parseInt(custCount.rows[0].count) === 0) {
      console.log('Inserting seed customers...');
      for (const c of SEED_CUSTOMERS) {
        await db.query(
          `INSERT INTO customers (id, name, company, contact, email, address, type, purchase_frequency, last_order_date, next_reminder_date, status, assigned_staff_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [c.id, c.name, c.company, c.contact, c.email, c.address, c.type, c.purchase_frequency, c.last_order_date, c.next_reminder_date, c.status, c.assigned_staff_id]
        );
      }
    }

    // 3. Seed Products
    const prodCount = await db.query('SELECT count(*) as count FROM products');
    if (parseInt(prodCount.rows[0].count) === 0) {
      console.log('Inserting seed products...');
      for (const p of SEED_PRODUCTS) {
        await db.query(
          'INSERT INTO products (id, sku, name, category, price, stock, warehouse) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [p.id, p.sku, p.name, p.category, p.price, p.stock, p.warehouse]
        );
      }
    }

    // 4. Seed Reminder Rules
    const ruleCount = await db.query('SELECT count(*) as count FROM reminder_rules');
    if (parseInt(ruleCount.rows[0].count) === 0) {
      console.log('Inserting seed reminder rules...');
      for (const r of SEED_REMINDER_RULES) {
        await db.query(
          'INSERT INTO reminder_rules (product_category, default_cycle_days, consumption_rate_multiplier) VALUES ($1, $2, $3)',
          [r.product_category, r.default_cycle_days, r.consumption_rate_multiplier]
        );
      }
    }

    // 5. Seed Settings
    const settingCount = await db.query('SELECT count(*) as count FROM settings');
    if (parseInt(settingCount.rows[0].count) === 0) {
      console.log('Inserting seed settings...');
      for (const s of SEED_SETTINGS) {
        await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
      }
    }

    // 6. Seed some orders and order items to generate data for charts
    const orderCount = await db.query('SELECT count(*) as count FROM orders');
    if (parseInt(orderCount.rows[0].count) === 0) {
      console.log('Inserting seed orders...');
      const seedOrders = [
        { id: 'ORD-001', customer_id: 'CUST-01', total_amount: 4900.00, order_date: '2026-06-20T10:00:00.000Z', status: 'Delivered', product_id: 'PROD-01', qty: 2 },
        { id: 'ORD-002', customer_id: 'CUST-02', total_amount: 850.00, order_date: '2026-06-18T09:00:00.000Z', status: 'Delivered', product_id: 'PROD-02', qty: 1 },
        { id: 'ORD-003', customer_id: 'CUST-03', total_amount: 1950.00, order_date: '2026-05-28T11:00:00.000Z', status: 'Delivered', product_id: 'PROD-03', qty: 3 },
        { id: 'ORD-004', customer_id: 'CUST-04', total_amount: 2400.00, order_date: '2026-06-15T15:30:00.000Z', status: 'Delivered', product_id: 'PROD-04', qty: 2 },
        { id: 'ORD-005', customer_id: 'CUST-05', total_amount: 850.00, order_date: '2026-06-25T08:00:00.000Z', status: 'In Transit', product_id: 'PROD-02', qty: 1 }
      ];

      for (const o of seedOrders) {
        await db.query(
          'INSERT INTO orders (id, customer_id, total_amount, order_date, status) VALUES ($1, $2, $3, $4, $5)',
          [o.id, o.customer_id, o.total_amount, o.order_date, o.status]
        );
        
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [o.id, o.product_id, o.qty, o.total_amount / o.qty]
        );
      }
    }

    // 7. Seed Reminder History
    const remCount = await db.query('SELECT count(*) as count FROM reminder_history');
    if (parseInt(remCount.rows[0].count) === 0) {
      console.log('Inserting seed reminder history logs...');
      const seedReminders = [
        { customer_id: 'CUST-01', product_id: 'PROD-01', date: '2026-06-27T10:00:00.000Z', cycle: 'Weekly', status: 'Pending' },
        { customer_id: 'CUST-02', product_id: 'PROD-02', date: '2026-06-25T09:00:00.000Z', cycle: 'Weekly', status: 'Sent' },
        { customer_id: 'CUST-03', product_id: 'PROD-03', date: '2026-06-28T11:00:00.000Z', cycle: 'Monthly', status: 'Pending' },
        { customer_id: 'CUST-04', product_id: 'PROD-04', date: '2026-06-22T15:30:00.000Z', cycle: 'Weekly', status: 'Failed', log: 'SMS Gateway response code 503' },
        { customer_id: 'CUST-01', product_id: 'PROD-01', date: '2026-06-13T10:00:00.000Z', cycle: 'Weekly', status: 'Completed', log: 'Reorder placed via WhatsApp link click.' }
      ];

      for (const rem of seedReminders) {
        await db.query(
          'INSERT INTO reminder_history (customer_id, product_id, reminder_date, cycle_type, status, response_log) VALUES ($1, $2, $3, $4, $5, $6)',
          [rem.customer_id, rem.product_id, rem.date, rem.cycle, rem.status, rem.log || null]
        );
      }
    }

    // 8. Seed Audit Logs
    const logCount = await db.query('SELECT count(*) as count FROM audit_logs');
    if (parseInt(logCount.rows[0].count) === 0) {
      console.log('Inserting seed audit logs...');
      const seedAuditLogs = [
        { user_id: 1, role: 'Admin', event: 'System initialized and default B2B parameters configured.' },
        { user_id: 2, role: 'Salesperson', event: 'Assigned as primary accounts manager for Novotel Hyderabad Convention Centre.' },
        { user_id: null, role: 'System Decider', event: 'Automated Rule engine recalculated replenishment intervals. Flagged CUST-02 as Urgent.' },
        { user_id: 4, role: 'Dispatcher', event: 'Marked Order ORD-005 for Rainbow Childrens Hospital as In Transit.' }
      ];

      for (const log of seedAuditLogs) {
        await db.query(
          'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
          [log.user_id, log.role, log.event]
        );
      }
    }

    console.log('Database successfully seeded!');
  } catch (err: any) {
    console.error('Error during database seed:', err.message);
  } finally {
    await db.close();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed();
}
