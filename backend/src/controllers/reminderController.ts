import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { runReminderGenerationCycle } from '../services/reminderEngine';

export async function getReminders(req: AuthenticatedRequest, res: Response) {
  const { status, priority, customerId, search = '' } = req.query;

  try {
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
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (c.name LIKE $${paramIndex} OR p.name LIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      queryText += ` AND c.status = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (customerId) {
      queryText += ` AND r.customer_id = $${paramIndex}`;
      params.push(customerId);
      paramIndex++;
    }

    queryText += ' ORDER BY r.reminder_date DESC';

    const result = await db.query(queryText, params);
    res.json({ reminders: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function triggerManualCheck(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await runReminderGenerationCycle();
    res.json({ message: `Automated cycle triggered. ${count} new reminders generated.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateReminderStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { status, log } = req.body; // Status can be Sent, Completed, Failed

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    // 1. Fetch current reminder
    const reminderRes = await db.query('SELECT * FROM reminder_history WHERE id = $1', [id]);
    if (reminderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Reminder record not found' });
    }
    const reminder = reminderRes.rows[0];

    // Update reminder status
    await db.query(
      'UPDATE reminder_history SET status = $1, response_log = $2 WHERE id = $3',
      [status, log || reminder.response_log, id]
    );

    // 2. If status is Completed, process a restock order!
    if (status === 'Completed') {
      const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [reminder.customer_id]);
      const productRes = await db.query('SELECT * FROM products WHERE id = $1', [reminder.product_id]);
      
      if (customerRes.rowCount > 0 && productRes.rowCount > 0) {
        const customer = customerRes.rows[0];
        const product = productRes.rows[0];

        // Generate Order ID
        const orderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
        const totalAmount = Number(product.price);
        const nowString = new Date().toISOString();

        // 2a. Insert Order
        await db.query(
          "INSERT INTO orders (id, customer_id, total_amount, order_date, status) VALUES ($1, $2, $3, $4, 'Dispatched')",
          [orderId, customer.id, totalAmount, nowString]
        );

        // 2b. Insert Order Item
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, 1, $3)',
          [orderId, product.id, product.price]
        );

        // 2c. Decrement Product Stock
        const newStock = Math.max(0, product.stock - 1);
        await db.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, product.id]);

        // 2d. Recalculate customer order dates
        const cycleDays = customer.purchase_frequency === 'Weekly' ? 14 : 30;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + cycleDays);

        await db.query(
          'UPDATE customers SET last_order_date = $1, next_reminder_date = $2, status = $3 WHERE id = $4',
          [nowString, nextDate.toISOString(), 'Stable', customer.id]
        );

        // 2e. Audit log
        await db.query(
          'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
          [req.user?.id || null, req.user?.role || 'System Decider', `Auto-ordered ${product.name} (${orderId}) for ${customer.name} via reminder validation.`]
        );
      }
    }

    res.json({ message: `Reminder status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function snoozeReminder(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { days = 3 } = req.body;

  try {
    const reminderRes = await db.query('SELECT * FROM reminder_history WHERE id = $1', [id]);
    if (reminderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Reminder record not found' });
    }
    const reminder = reminderRes.rows[0];

    // Snooze next reminder date for customer by pushing it forward
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);

    await db.query('UPDATE customers SET next_reminder_date = $1, status = $2 WHERE id = $3', [
      nextDate.toISOString(),
      'Stable',
      reminder.customer_id
    ]);

    // Archive this reminder as Sent or Snoozed (update status to Sent, since we contacted/interacted)
    await db.query(
      "UPDATE reminder_history SET status = 'Sent', response_log = $1 WHERE id = $2",
      [`Snoozed for ${days} days. New predicted restock pushed.`, id]
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Coordinator', `Snoozed replenishment reminders for Customer: ${reminder.customer_id} by ${days} days.`]
    );

    res.json({ message: `Reminder successfully snoozed for ${days} days.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
