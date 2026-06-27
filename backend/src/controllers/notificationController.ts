import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  const { customerId } = req.query;

  try {
    let queryText = `
      SELECT n.id, n.customer_id, c.name as customer_name, c.company as customer_company, 
             n.channel, n.template_name, n.content_preview, n.status, n.sent_at 
      FROM notifications n
      JOIN customers c ON n.customer_id = c.id
      WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (customerId) {
      queryText += ` AND n.customer_id = $${paramIndex}`;
      params.push(customerId);
      paramIndex++;
    }

    queryText += ' ORDER BY n.sent_at DESC';

    const result = await db.query(queryText, params);
    res.json({ notifications: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getNotificationPreviews(req: AuthenticatedRequest, res: Response) {
  const { customerId } = req.query;
  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    // Fetch customer details
    const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (customerRes.rowCount === 0) {
      return res.status(404).json({ error: 'Customer account not found' });
    }
    const customer = customerRes.rows[0];

    // Fetch products
    const productRes = await db.query(
      'SELECT name FROM products WHERE category = $1 LIMIT 1',
      [customer.primary_product_category || 'Industrial Chemicals']
    );
    const productName = productRes.rows[0]?.name || 'Industrial Chemicals Supply';

    // Fetch settings templates
    const settingsRes = await db.query('SELECT * FROM settings');
    const settingsMap = new Map(settingsRes.rows.map(s => [s.key, s.value]));

    const variables = {
      customerName: customer.name,
      customerId: customer.id,
      category: customer.primary_product_category,
      productName: productName,
      lastOrderDate: customer.last_order_date 
        ? new Date(customer.last_order_date).toLocaleDateString()
        : 'N/A'
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

    const emailTmpl = settingsMap.get('emailTemplate') || '';
    const whatsappTmpl = settingsMap.get('whatsappTemplate') || '';
    const smsTmpl = settingsMap.get('smsTemplate') || '';

    res.json({
      customerId: customer.id,
      customerName: customer.name,
      previews: [
        {
          channel: 'Email',
          templateName: 'Default B2B Email Reminder',
          subject: `Ganga Maxx Replenishment Notification: ${customer.name}`,
          body: replaceVars(emailTmpl)
        },
        {
          channel: 'WhatsApp',
          templateName: 'WhatsApp Reorder Blast',
          body: replaceVars(whatsappTmpl)
        },
        {
          channel: 'SMS',
          templateName: 'SMS Urgent Restock Alert',
          body: replaceVars(smsTmpl)
        }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function sendSimulatedNotification(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const notifRes = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (notifRes.rowCount === 0) {
      return res.status(404).json({ error: 'Notification preview log not found' });
    }
    const notif = notifRes.rows[0];

    // Simulate sending by updating DB status to 'Sent' and set sent time
    await db.query(
      "UPDATE notifications SET status = 'Sent', sent_at = $1 WHERE id = $2",
      [new Date().toISOString(), id]
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Coordinator', `Dispatched simulated notification over ${notif.channel} to customer id: ${notif.customer_id}.`]
    );

    res.json({ message: `Simulated notification sent successfully via ${notif.channel}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
