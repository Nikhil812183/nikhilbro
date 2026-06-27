import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getCustomers(req: AuthenticatedRequest, res: Response) {
  const { 
    search = '', 
    status, 
    type, 
    priority, 
    sortBy = 'name', 
    sortOrder = 'asc', 
    page = '1', 
    limit = '10' 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  try {
    let queryText = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      queryText += ` AND (name LIKE $${paramIndex} OR company LIKE $${paramIndex} OR email LIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Status filter
    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Type filter
    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Sort column validation
    const allowedSortColumns = ['name', 'company', 'last_order_date', 'next_reminder_date', 'status'];
    const validSortBy = allowedSortColumns.includes(sortBy as string) ? sortBy : 'name';
    const validSortOrder = (sortOrder as string).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    queryText += ` ORDER BY ${validSortBy} ${validSortOrder}`;

    // Pagination
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await db.query(queryText, params);

    // Get count for pagination
    let countQueryText = 'SELECT COUNT(*) as count FROM customers WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQueryText += ` AND (name LIKE $${countParamIndex} OR company LIKE $${countParamIndex} OR email LIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (status) {
      countQueryText += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (type) {
      countQueryText += ` AND type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    const countRes = await db.query(countQueryText, countParams);
    const totalItems = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      customers: result.rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerRes.rowCount === 0) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    // Fetch related order history
    const ordersRes = await db.query(
      `SELECT o.id, o.total_amount, o.order_date, o.status 
       FROM orders o 
       WHERE o.customer_id = $1 
       ORDER BY o.order_date DESC`, 
      [id]
    );

    // Fetch related reminder history logs
    const remindersRes = await db.query(
      `SELECT r.id, p.name as product_name, r.reminder_date, r.cycle_type, r.status, r.response_log 
       FROM reminder_history r 
       JOIN products p ON r.product_id = p.id
       WHERE r.customer_id = $1 
       ORDER BY r.reminder_date DESC`,
      [id]
    );

    res.json({
      customer: customerRes.rows[0],
      orders: ordersRes.rows,
      reminders: remindersRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response) {
  const { 
    id, name, company, contact, email, address, type, 
    purchaseFrequency, primaryCategory = 'Industrial Chemicals', assignedStaffId 
  } = req.body;

  if (!id || !name || !email || !type || !purchaseFrequency) {
    return res.status(400).json({ error: 'ID, Name, Email, Type, and Purchase Frequency are required' });
  }

  try {
    // Check duplication
    const checkCust = await db.query('SELECT name FROM customers WHERE id = $1 OR email = $2', [id, email]);
    if (checkCust.rowCount > 0) {
      return res.status(409).json({ error: 'Customer ID or Email already exists' });
    }

    // Calculate initial reminder dates based on frequency
    const lastOrderDate = new Date().toISOString();
    const nextReminder = new Date();
    const cycleDays = purchaseFrequency === 'Weekly' ? 14 : 30; // standard defaults
    nextReminder.setDate(nextReminder.getDate() + cycleDays);
    const nextReminderDate = nextReminder.toISOString();

    await db.query(
      `INSERT INTO customers 
       (id, name, company, contact, email, address, type, purchase_frequency, last_order_date, next_reminder_date, status, assigned_staff_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Stable', $11)`,
      [id, name, company, contact, email, address, type, purchaseFrequency, lastOrderDate, nextReminderDate, assignedStaffId || req.user?.id || 1]
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Coordinator', `Added new B2B customer account: ${name} (${id}).`]
    );

    res.status(201).json({ message: 'Customer account created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { name, company, contact, email, address, type, purchaseFrequency, status, lastOrderDate, nextReminderDate } = req.body;

  try {
    const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerRes.rowCount === 0) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    const current = customerRes.rows[0];

    // Recompute next reminder if frequency or last order changed
    let updatedNextReminder = nextReminderDate || current.next_reminder_date;
    if (purchaseFrequency !== current.purchase_frequency || lastOrderDate !== current.last_order_date) {
      const start = lastOrderDate ? new Date(lastOrderDate) : new Date();
      const cycleDays = purchaseFrequency === 'Weekly' ? 14 : 30;
      start.setDate(start.getDate() + cycleDays);
      updatedNextReminder = start.toISOString();
    }

    await db.query(
      `UPDATE customers 
       SET name = $1, company = $2, contact = $3, email = $4, address = $5, type = $6, 
           purchase_frequency = $7, status = $8, last_order_date = $9, next_reminder_date = $10 
       WHERE id = $11`,
      [
        name || current.name,
        company || current.company,
        contact || current.contact,
        email || current.email,
        address || current.address,
        type || current.type,
        purchaseFrequency || current.purchase_frequency,
        status || current.status,
        lastOrderDate || current.last_order_date,
        updatedNextReminder,
        id
      ]
    );

    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Coordinator', `Updated customer account metrics for ${name || current.name} (${id}).`]
    );

    res.json({ message: 'Customer account updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const customerRes = await db.query('SELECT name FROM customers WHERE id = $1', [id]);
    if (customerRes.rowCount === 0) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    const name = customerRes.rows[0].name;

    // Delete cascading items if needed or just remove customer
    await db.query('DELETE FROM notifications WHERE customer_id = $1', [id]);
    await db.query('DELETE FROM reminder_history WHERE customer_id = $1', [id]);
    await db.query('DELETE FROM customers WHERE id = $1', [id]);

    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Admin', `Deleted customer account and purged reminders: ${name} (${id}).`]
    );

    res.json({ message: 'Customer account deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
