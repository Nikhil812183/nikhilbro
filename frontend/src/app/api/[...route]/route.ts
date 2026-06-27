import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../backend/config/db';
import { initializeDatabase, seedDatabaseIfEmpty } from '../../../backend/database/schema';
import { runReminderGenerationCycle } from '../../../backend/services/reminderEngine';
import { getCustomerRecommendations } from '../../../backend/services/aiRecommendation';
import { generateCSVReport, generateExcelReport, generatePDFReport } from '../../../backend/services/reportService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gangamaxx_secret_jwt_key_2026';

// Helper to run database migrations and seedings on first run
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initializeDatabase();
    await seedDatabaseIfEmpty();
    dbInitialized = true;
  }
}

// Authentication check helper
interface AuthUser {
  id: number;
  email: string;
  role: string;
  name: string;
}

function verifyToken(req: NextRequest): AuthUser | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
  } catch (err) {
    return null;
  }
}

function hasPermission(user: AuthUser | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return allowedRoles.includes(user.role);
}

// GET Handler
export async function GET(request: NextRequest, context: any) {
  await ensureDb();
  const { route } = await context.params;
  const path = route.join('/');
  const searchParams = request.nextUrl.searchParams;
  
  // Public check bypass
  const isPublic = path.startsWith('auth/');
  const currentUser = verifyToken(request);
  
  if (!isPublic && !currentUser) {
    return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
  }

  try {
    // --- DASHBOARD API ---
    if (path === 'dashboard/stats') {
      const custCountRes = await db.query('SELECT COUNT(*) as count FROM customers');
      const totalCustomers = parseInt(custCountRes.rows[0].count);

      const dueRemCountRes = await db.query("SELECT COUNT(*) as count FROM reminder_history WHERE status = 'Pending'");
      const dueReminders = parseInt(dueRemCountRes.rows[0].count);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayOrdersRes = await db.query("SELECT COUNT(*) as count, SUM(total_amount) as sum FROM orders WHERE order_date LIKE $1", [`%${todayStr}%`]);
      const ordersToday = parseInt(todayOrdersRes.rows[0].count || '0');
      const todayRevenue = parseFloat(todayOrdersRes.rows[0].sum || '0');

      const revRes = await db.query('SELECT SUM(total_amount) as sum FROM orders');
      const totalRevenue = parseFloat(revRes.rows[0].sum || '0');

      const urgentCountRes = await db.query("SELECT COUNT(*) as count FROM customers WHERE status = 'Urgent'");
      const pendingFollowups = parseInt(urgentCountRes.rows[0].count);

      const compRemCountRes = await db.query("SELECT COUNT(*) as count FROM reminder_history WHERE status = 'Completed'");
      const completedReminders = parseInt(compRemCountRes.rows[0].count);

      const monthlyOrdersRes = await db.query('SELECT order_date, total_amount FROM orders');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyDataMap = new Map<string, { orders: number; revenue: number }>();
      
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
        monthlyDataMap.set(label, { orders: 0, revenue: 0 });
      }

      for (const order of monthlyOrdersRes.rows) {
        if (!order.order_date) continue;
        const orderDate = new Date(order.order_date);
        const label = `${months[orderDate.getMonth()]} ${orderDate.getFullYear().toString().substring(2)}`;
        if (monthlyDataMap.has(label)) {
          const current = monthlyDataMap.get(label)!;
          current.orders += 1;
          current.revenue += parseFloat(order.total_amount);
          monthlyDataMap.set(label, current);
        }
      }

      const monthlyOrders = Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
        month,
        orders: data.orders,
        revenue: data.revenue
      }));

      const catSalesRes = await db.query(`
        SELECT p.category, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.unit_price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.category
      `);
      const productSales = catSalesRes.rows.map(row => ({
        category: row.category,
        units: parseInt(row.quantity),
        revenue: parseFloat(row.revenue)
      }));

      const remStatusRes = await db.query(`
        SELECT status, COUNT(*) as count FROM reminder_history GROUP BY status
      `);
      const reminderRates: { [key: string]: number } = { Pending: 0, Sent: 0, Completed: 0, Failed: 0 };
      for (const row of remStatusRes.rows) {
        reminderRates[row.status] = parseInt(row.count);
      }
      const successRateTotal = reminderRates.Pending + reminderRates.Sent + reminderRates.Completed + reminderRates.Failed;
      const successPercent = successRateTotal > 0 ? Math.round((reminderRates.Completed / successRateTotal) * 100) : 0;

      return NextResponse.json({
        kpis: {
          totalCustomers,
          dueReminders,
          ordersToday,
          revenue: totalRevenue,
          pendingFollowups,
          completedReminders,
          todayRevenue
        },
        charts: {
          monthlyOrders,
          productSales,
          reminderStatusDistribution: [
            { name: 'Pending', value: reminderRates.Pending },
            { name: 'Sent', value: reminderRates.Sent },
            { name: 'Completed', value: reminderRates.Completed },
            { name: 'Failed', value: reminderRates.Failed }
          ],
          reminderSuccessRate: successPercent,
          repeatOrderTrend: [
            { month: 'Jan', rate: 72 },
            { month: 'Feb', rate: 75 },
            { month: 'Mar', rate: 78 },
            { month: 'Apr', rate: 82 },
            { month: 'May', rate: 85 },
            { month: 'Jun', rate: successPercent || 80 }
          ]
        }
      });
    }

    // --- CUSTOMERS API ---
    if (path === 'customers') {
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const type = searchParams.get('type') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      let queryText = 'SELECT * FROM customers WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (search) {
        queryText += ` AND (name LIKE $${idx} OR company LIKE $${idx} OR email LIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }
      if (status) {
        queryText += ` AND status = $${idx}`;
        params.push(status);
        idx++;
      }
      if (type) {
        queryText += ` AND type = $${idx}`;
        params.push(type);
        idx++;
      }

      queryText += ` ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`;
      params.push(limit, offset);

      const result = await db.query(queryText, params);
      
      // Count
      let countQuery = 'SELECT COUNT(*) as count FROM customers WHERE 1=1';
      const countParams: any[] = [];
      let cIdx = 1;
      if (search) {
        countQuery += ` AND (name LIKE $${cIdx} OR company LIKE $${cIdx} OR email LIKE $${cIdx})`;
        countParams.push(`%${search}%`);
        cIdx++;
      }
      if (status) {
        countQuery += ` AND status = $${cIdx}`;
        countParams.push(status);
        cIdx++;
      }
      if (type) {
        countQuery += ` AND type = $${cIdx}`;
        countParams.push(type);
        cIdx++;
      }
      const countRes = await db.query(countQuery, countParams);
      const totalItems = parseInt(countRes.rows[0].count);

      return NextResponse.json({
        customers: result.rows,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          limit
        }
      });
    }

    if (path.startsWith('customers/')) {
      const id = path.split('/')[1];
      const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
      if (customerRes.rowCount === 0) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      const ordersRes = await db.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_date DESC', [id]);
      const remindersRes = await db.query(
        `SELECT r.id, p.name as product_name, r.reminder_date, r.cycle_type, r.status, r.response_log 
         FROM reminder_history r 
         JOIN products p ON r.product_id = p.id
         WHERE r.customer_id = $1 ORDER BY r.reminder_date DESC`,
        [id]
      );
      return NextResponse.json({
        customer: customerRes.rows[0],
        orders: ordersRes.rows,
        reminders: remindersRes.rows
      });
    }

    // --- PRODUCTS API ---
    if (path === 'products') {
      const search = searchParams.get('search') || '';
      const category = searchParams.get('category') || '';
      const warehouse = searchParams.get('warehouse') || '';

      let queryText = 'SELECT * FROM products WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (search) {
        queryText += ` AND (name LIKE $${idx} OR sku LIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }
      if (category) {
        queryText += ` AND category = $${idx}`;
        params.push(category);
        idx++;
      }
      if (warehouse) {
        queryText += ` AND warehouse = $${idx}`;
        params.push(warehouse);
        idx++;
      }
      queryText += ' ORDER BY category, name';

      const result = await db.query(queryText, params);
      return NextResponse.json({ products: result.rows });
    }

    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rowCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json({ product: result.rows[0] });
    }

    // --- REMINDERS API ---
    if (path === 'reminders') {
      const status = searchParams.get('status') || '';
      const priority = searchParams.get('priority') || '';
      const customerId = searchParams.get('customerId') || '';
      const search = searchParams.get('search') || '';

      let queryText = `
        SELECT r.id, r.customer_id, c.name as customer_name, c.company as customer_company, 
               c.status as customer_priority, r.product_id, p.name as product_name, p.category as product_category, 
               r.reminder_date, r.cycle_type, r.status, r.response_log, c.assigned_staff_id, u.name as staff_name
        FROM reminder_history r
        JOIN customers c ON r.customer_id = c.id
        JOIN products p ON r.product_id = p.id
        LEFT JOIN users u ON c.assigned_staff_id = u.id
        WHERE 1=1`;
        
      const params: any[] = [];
      let idx = 1;

      if (search) {
        queryText += ` AND (c.name LIKE $${idx} OR p.name LIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }
      if (status) {
        queryText += ` AND r.status = $${idx}`;
        params.push(status);
        idx++;
      }
      if (priority) {
        queryText += ` AND c.status = $${idx}`;
        params.push(priority);
        idx++;
      }
      if (customerId) {
        queryText += ` AND r.customer_id = $${idx}`;
        params.push(customerId);
        idx++;
      }

      queryText += ' ORDER BY r.reminder_date DESC';
      const result = await db.query(queryText, params);
      return NextResponse.json({ reminders: result.rows });
    }

    // --- NOTIFICATIONS API ---
    if (path === 'notifications') {
      const customerId = searchParams.get('customerId') || '';
      let queryText = `
        SELECT n.id, n.customer_id, c.name as customer_name, c.company as customer_company, 
               n.channel, n.template_name, n.content_preview, n.status, n.sent_at 
        FROM notifications n
        JOIN customers c ON n.customer_id = c.id
        WHERE 1=1`;
      const params: any[] = [];
      if (customerId) {
        queryText += ' AND n.customer_id = $1';
        params.push(customerId);
      }
      queryText += ' ORDER BY n.sent_at DESC';
      const result = await db.query(queryText, params);
      return NextResponse.json({ notifications: result.rows });
    }

    if (path === 'notifications/previews') {
      const customerId = searchParams.get('customerId');
      if (!customerId) return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });

      const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
      if (customerRes.rowCount === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      const customer = customerRes.rows[0];

      const productRes = await db.query('SELECT name FROM products WHERE category = $1 LIMIT 1', [customer.primary_product_category || 'Industrial Chemicals']);
      const productName = productRes.rows[0]?.name || 'Industrial Chemicals Supply';

      const settingsRes = await db.query('SELECT * FROM settings');
      const settingsMap = new Map(settingsRes.rows.map(s => [s.key, s.value]));

      const variables = {
        customerName: customer.name,
        customerId: customer.id,
        category: customer.primary_product_category,
        productName: productName,
        lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'N/A'
      };

      const replaceVars = (tmpl: string) => {
        if (!tmpl) return '';
        return tmpl
          .replace(/\{\{customerName\}\}/g, variables.customerName)
          .replace(/\{\{customerId\}\}/g, variables.customerId)
          .replace(/\{\{category\}\}/g, variables.category)
          .replace(/\{\{productName\}\}/g, variables.productName)
          .replace(/\{\{lastOrderDate\}\}/g, variables.lastOrderDate);
      };

      return NextResponse.json({
        previews: [
          { channel: 'Email', templateName: 'Default B2B Email', subject: `Ganga Maxx Replenishment: ${customer.name}`, body: replaceVars(settingsMap.get('emailTemplate') || '') },
          { channel: 'WhatsApp', templateName: 'WhatsApp Reorder', body: replaceVars(settingsMap.get('whatsappTemplate') || '') },
          { channel: 'SMS', templateName: 'SMS Urgent Restock', body: replaceVars(settingsMap.get('smsTemplate') || '') }
        ]
      });
    }

    // --- AI RECS API ---
    if (path.startsWith('ai/recommendations/')) {
      const custId = path.split('/')[2];
      const payload = await getCustomerRecommendations(custId);
      return NextResponse.json(payload);
    }

    // --- REPORTS DOWNLOAD API ---
    if (path === 'reports/download') {
      const type = searchParams.get('type') || '';
      const format = searchParams.get('format') || '';
      
      // Token validation bypass for direct browser query parameters links downloads
      const queryToken = searchParams.get('token');
      if (!currentUser && queryToken) {
        try {
          jwt.verify(queryToken, JWT_SECRET);
        } catch (err) {
          return NextResponse.json({ error: 'Direct download session expired' }, { status: 403 });
        }
      }

      if (format === 'csv') {
        const csv = await generateCSVReport(type);
        return new NextResponse(csv, {
          headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=${type}_report_${Date.now()}.csv` }
        });
      } 
      else if (format === 'xlsx') {
        const xlsx = await generateExcelReport(type);
        return new NextResponse(xlsx as any, {
          headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename=${type}_report_${Date.now()}.xlsx` }
        });
      } 
      else if (format === 'pdf') {
        const pdf = await generatePDFReport(type);
        return new NextResponse(pdf as any, {
          headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=${type}_report_${Date.now()}.pdf` }
        });
      }
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // --- ADMIN CONTROLS API ---
    if (path === 'admin/settings') {
      if (!hasPermission(currentUser, ['Admin'])) return NextResponse.json({ error: 'Restricted access' }, { status: 403 });
      const result = await db.query('SELECT * FROM settings');
      return NextResponse.json({ settings: result.rows });
    }

    if (path === 'admin/users') {
      if (!hasPermission(currentUser, ['Admin'])) return NextResponse.json({ error: 'Restricted access' }, { status: 403 });
      const result = await db.query('SELECT id, email, role, name, status, created_at FROM users ORDER BY name');
      return NextResponse.json({ users: result.rows });
    }

    if (path === 'admin/audit-logs') {
      if (!hasPermission(currentUser, ['Admin'])) return NextResponse.json({ error: 'Restricted access' }, { status: 403 });
      const result = await db.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
      return NextResponse.json({ logs: result.rows });
    }

    return NextResponse.json({ error: `Path /api/${path} not found` }, { status: 404 });
  } catch (err: any) {
    console.error(`Next.js API GET error: ${path}`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST Handler
export async function POST(request: NextRequest, context: any) {
  await ensureDb();
  const { route } = await context.params;
  const path = route.join('/');
  
  const isPublic = path.startsWith('auth/');
  const currentUser = verifyToken(request);
  
  if (!isPublic && !currentUser) {
    return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    // --- AUTH CONTROLLERS ---
    if (path === 'auth/register') {
      const { email, password, role, name } = body;
      if (!email || !password || !role || !name) return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      const checkEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (checkEmail.rowCount > 0) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

      const hash = bcrypt.hashSync(password, 10);
      await db.query('INSERT INTO users (email, password_hash, role, name, status) VALUES ($1, $2, $3, $4, $5)', [email, hash, role, name, 'Active']);
      await db.query("INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)", ['System Decider', `New account registered: ${name} as role ${role}.`]);
      return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
    }

    if (path === 'auth/login') {
      const { email, password } = body;
      if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userRes.rowCount === 0) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

      const user = userRes.rows[0];
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      if (user.status !== 'Active') return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [user.id, user.role, `User ${user.name} logged in successfully.`]);

      return NextResponse.json({
        message: 'Login successful. OTP required.',
        token,
        requireOtp: true,
        user: { id: user.id, email: user.email, role: user.role, name: user.name }
      });
    }

    if (path === 'auth/verify-otp') {
      const { otp } = body;
      if (otp === '123456') return NextResponse.json({ message: 'OTP verified' });
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    if (path === 'auth/reset-password') {
      const { email, newPassword } = body;
      const userRes = await db.query('SELECT id, name, role FROM users WHERE email = $1', [email]);
      if (userRes.rowCount === 0) return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      const user = userRes.rows[0];
      const hash = bcrypt.hashSync(newPassword, 10);
      await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [user.id, user.role, `Password reset processed for ${user.name}.`]);
      return NextResponse.json({ message: 'Password reset successful' });
    }

    // --- CUSTOMERS CRUD CREATE ---
    if (path === 'customers') {
      if (!hasPermission(currentUser, ['Coordinator', 'Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const { id, name, company, contact, email, address, type, purchaseFrequency, assignedStaffId } = body;
      const checkCust = await db.query('SELECT name FROM customers WHERE id = $1 OR email = $2', [id, email]);
      if (checkCust.rowCount > 0) return NextResponse.json({ error: 'ID or email exists' }, { status: 409 });

      const lastOrderDate = new Date().toISOString();
      const nextReminder = new Date();
      nextReminder.setDate(nextReminder.getDate() + (purchaseFrequency === 'Weekly' ? 14 : 30));

      await db.query(
        `INSERT INTO customers (id, name, company, contact, email, address, type, purchase_frequency, last_order_date, next_reminder_date, status, assigned_staff_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Stable', $11)`,
        [id, name, company, contact, email, address, type, purchaseFrequency, lastOrderDate, nextReminder.toISOString(), assignedStaffId || currentUser?.id || 1]
      );
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'System Decider', `Added B2B customer account: ${name} (${id}).`]);
      return NextResponse.json({ message: 'Customer account created' }, { status: 201 });
    }

    // --- PRODUCTS CRUD CREATE ---
    if (path === 'products') {
      if (!hasPermission(currentUser, ['Coordinator', 'Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const { id, sku, name, category, price, stock, warehouse } = body;
      const checkSku = await db.query('SELECT id FROM products WHERE id = $1 OR sku = $2', [id, sku]);
      if (checkSku.rowCount > 0) return NextResponse.json({ error: 'ID or SKU exists' }, { status: 409 });

      await db.query('INSERT INTO products (id, sku, name, category, price, stock, warehouse) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, sku, name, category, price, stock, warehouse]);
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'System Decider', `Added product SKU: ${sku} (${name}).`]);
      return NextResponse.json({ message: 'Product catalog entry created' }, { status: 201 });
    }

    // --- REMINDERS ACTIONS ---
    if (path === 'reminders/trigger-check') {
      const count = await runReminderGenerationCycle();
      return NextResponse.json({ message: `Automated cycle triggered. ${count} new reminders generated.` });
    }

    if (path.startsWith('reminders/') && path.endsWith('/snooze')) {
      const id = parseInt(path.split('/')[1]);
      const { days = 3 } = body;

      const reminderRes = await db.query('SELECT * FROM reminder_history WHERE id = $1', [id]);
      if (reminderRes.rowCount === 0) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
      const reminder = reminderRes.rows[0];

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + days);

      await db.query('UPDATE customers SET next_reminder_date = $1, status = $2 WHERE id = $3', [nextDate.toISOString(), 'Stable', reminder.customer_id]);
      await db.query("UPDATE reminder_history SET status = 'Sent', response_log = $1 WHERE id = $2", [`Snoozed for ${days} days.`, id]);
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'Coordinator', `Snoozed reminder for ${reminder.customer_id} by ${days} days.`]);
      return NextResponse.json({ message: `Reminder snoozed for ${days} days.` });
    }

    // --- NOTIFICATIONS DISPATCH ---
    if (path.startsWith('notifications/') && path.endsWith('/send')) {
      const id = parseInt(path.split('/')[1]);
      const notifRes = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
      if (notifRes.rowCount === 0) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      const notif = notifRes.rows[0];

      await db.query("UPDATE notifications SET status = 'Sent', sent_at = $1 WHERE id = $2", [new Date().toISOString(), id]);
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'Coordinator', `Dispatched simulated notification over ${notif.channel} to customer: ${notif.customer_id}.`]);
      return NextResponse.json({ message: `Simulated notification sent via ${notif.channel}.` });
    }

    return NextResponse.json({ error: `Route POST /api/${path} not found` }, { status: 404 });
  } catch (err: any) {
    console.error(`Next.js API POST error: ${path}`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT Handler
export async function PUT(request: NextRequest, context: any) {
  await ensureDb();
  const { route } = await context.params;
  const path = route.join('/');
  
  const currentUser = verifyToken(request);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));

    // --- CUSTOMERS UPDATE ---
    if (path.startsWith('customers/')) {
      if (!hasPermission(currentUser, ['Coordinator', 'Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const id = path.split('/')[1];
      const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
      if (customerRes.rowCount === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      const current = customerRes.rows[0];

      const { name, company, contact, email, address, type, purchaseFrequency, status, lastOrderDate, nextReminderDate } = body;

      let updatedNextReminder = nextReminderDate || current.next_reminder_date;
      if (purchaseFrequency !== current.purchase_frequency || lastOrderDate !== current.last_order_date) {
        const start = lastOrderDate ? new Date(lastOrderDate) : new Date();
        start.setDate(start.getDate() + (purchaseFrequency === 'Weekly' ? 14 : 30));
        updatedNextReminder = start.toISOString();
      }

      await db.query(
        `UPDATE customers 
         SET name = $1, company = $2, contact = $3, email = $4, address = $5, type = $6, 
             purchase_frequency = $7, status = $8, last_order_date = $9, next_reminder_date = $10 
         WHERE id = $11`,
        [name || current.name, company || current.company, contact || current.contact, email || current.email, address || current.address, type || current.type, purchaseFrequency || current.purchase_frequency, status || current.status, lastOrderDate || current.last_order_date, updatedNextReminder, id]
      );
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'Coordinator', `Updated B2B contract metrics for ${name || current.name} (${id}).`]);
      return NextResponse.json({ message: 'Customer account updated' });
    }

    // --- PRODUCTS UPDATE ---
    if (path.startsWith('products/')) {
      if (!hasPermission(currentUser, ['Coordinator', 'Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const id = path.split('/')[1];
      const checkProd = await db.query('SELECT * FROM products WHERE id = $1', [id]);
      if (checkProd.rowCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      const current = checkProd.rows[0];

      const { sku, name, category, price, stock, warehouse } = body;
      await db.query(
        'UPDATE products SET sku = $1, name = $2, category = $3, price = $4, stock = $5, warehouse = $6 WHERE id = $7',
        [sku || current.sku, name || current.name, category || current.category, price !== undefined ? price : current.price, stock !== undefined ? stock : current.stock, warehouse || current.warehouse, id]
      );

      const finalStock = stock !== undefined ? stock : current.stock;
      if (finalStock < 15) {
        await db.query('INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)', ['System Decider', `INVENTORY ALERT: Product ${name || current.name} (${sku || current.sku}) is running low in stock (${finalStock} remaining).`]);
      }
      return NextResponse.json({ message: 'Product specifications updated' });
    }

    // --- REMINDER STATUS UPDATE (COMPLETED / RESTOCK) ---
    if (path.startsWith('reminders/') && path.endsWith('/status')) {
      const id = parseInt(path.split('/')[1]);
      const { status, log } = body;

      const reminderRes = await db.query('SELECT * FROM reminder_history WHERE id = $1', [id]);
      if (reminderRes.rowCount === 0) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
      const reminder = reminderRes.rows[0];

      await db.query('UPDATE reminder_history SET status = $1, response_log = $2 WHERE id = $3', [status, log || reminder.response_log, id]);

      if (status === 'Completed') {
        const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [reminder.customer_id]);
        const productRes = await db.query('SELECT * FROM products WHERE id = $1', [reminder.product_id]);
        
        if (customerRes.rowCount > 0 && productRes.rowCount > 0) {
          const customer = customerRes.rows[0];
          const product = productRes.rows[0];
          const orderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
          const totalAmount = Number(product.price);
          const nowString = new Date().toISOString();

          await db.query("INSERT INTO orders (id, customer_id, total_amount, order_date, status) VALUES ($1, $2, $3, $4, 'Dispatched')", [orderId, customer.id, totalAmount, nowString]);
          await db.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, 1, $3)', [orderId, product.id, product.price]);
          await db.query('UPDATE products SET stock = $1 WHERE id = $2', [Math.max(0, product.stock - 1), product.id]);

          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + (customer.purchase_frequency === 'Weekly' ? 14 : 30));

          await db.query('UPDATE customers SET last_order_date = $1, next_reminder_date = $2, status = $3 WHERE id = $4', [nowString, nextDate.toISOString(), 'Stable', customer.id]);
          await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'System Decider', `Ordered ${product.name} (${orderId}) for ${customer.name} via cycle validation.`]);
        }
      }
      return NextResponse.json({ message: `Reminder status updated to ${status}.` });
    }

    // --- ADMIN SAVE SETTINGS ---
    if (path === 'admin/settings') {
      if (!hasPermission(currentUser, ['Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const { settings } = body;
      for (const item of settings) {
        await db.query(
          'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
          [item.key, item.value]
        );
      }
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'Admin', 'Updated system configurations and B2B templates.']);
      return NextResponse.json({ message: 'Settings saved' });
    }

    // --- ADMIN USER PERMISSIONS ---
    if (path.startsWith('admin/users/')) {
      if (!hasPermission(currentUser, ['Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const id = parseInt(path.split('/')[2]);
      const checkUser = await db.query('SELECT name, role, status FROM users WHERE id = $1', [id]);
      if (checkUser.rowCount === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const current = checkUser.rows[0];

      const { role, status } = body;
      await db.query('UPDATE users SET role = $1, status = $2 WHERE id = $3', [role || current.role, status || current.status, id]);
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'Admin', `Modified privileges for staff: ${current.name} (Role: ${role || current.role}).`]);
      return NextResponse.json({ message: 'User role updated' });
    }

    return NextResponse.json({ error: `Route PUT /api/${path} not found` }, { status: 404 });
  } catch (err: any) {
    console.error(`Next.js API PUT error: ${path}`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE Handler
export async function DELETE(request: NextRequest, context: any) {
  await ensureDb();
  const { route } = await context.params;
  const path = route.join('/');
  
  const currentUser = verifyToken(request);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // --- CUSTOMERS DELETE ---
    if (path.startsWith('customers/')) {
      if (!hasPermission(currentUser, ['Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const id = path.split('/')[1];
      const customerRes = await db.query('SELECT name FROM customers WHERE id = $1', [id]);
      if (customerRes.rowCount === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      
      const name = customerRes.rows[0].name;
      await db.query('DELETE FROM notifications WHERE customer_id = $1', [id]);
      await db.query('DELETE FROM reminder_history WHERE customer_id = $1', [id]);
      await db.query('DELETE FROM customers WHERE id = $1', [id]);

      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'Admin', `Deleted customer contract: ${name} (${id}).`]);
      return NextResponse.json({ message: 'Customer account deleted' });
    }

    // --- PRODUCTS DELETE ---
    if (path.startsWith('products/')) {
      if (!hasPermission(currentUser, ['Admin'])) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      const id = path.split('/')[1];
      const checkProd = await db.query('SELECT name, sku FROM products WHERE id = $1', [id]);
      if (checkProd.rowCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      
      const product = checkProd.rows[0];
      await db.query('DELETE FROM products WHERE id = $1', [id]);
      await db.query('INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)', [currentUser?.id || null, currentUser?.role || 'Admin', `Purged product SKU: ${product.sku} (${product.name}).`]);
      return NextResponse.json({ message: 'Product catalog entry deleted' });
    }

    return NextResponse.json({ error: `Route DELETE /api/${path} not found` }, { status: 404 });
  } catch (err: any) {
    console.error(`Next.js API DELETE error: ${path}`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
