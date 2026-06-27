import { db } from '../config/db';

export async function runReminderGenerationCycle() {
  const now = new Date();
  try {
    const customersRes = await db.query('SELECT * FROM customers');
    const customers = customersRes.rows;
    
    const settingsRes = await db.query('SELECT * FROM settings');
    const settingsMap = new Map(settingsRes.rows.map(s => [s.key, s.value]));
    
    let count = 0;
    
    for (const customer of customers) {
      if (!customer.next_reminder_date) continue;
      
      const nextReminder = new Date(customer.next_reminder_date);
      const daysDiff = Math.ceil((nextReminder.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let newStatus = 'Stable';
      if (daysDiff <= 3) {
        newStatus = 'Urgent';
      } else if (daysDiff <= 7) {
        newStatus = 'Predicted';
      }
      
      if (newStatus !== customer.status) {
        await db.query('UPDATE customers SET status = $1 WHERE id = $2', [newStatus, customer.id]);
        await db.query('INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)', ['System Decider', `Customer ${customer.name} status recalculated to: ${newStatus} (${daysDiff} days remaining).`]);
      }
      
      if (daysDiff <= 0) {
        const pendingRemRes = await db.query("SELECT id FROM reminder_history WHERE customer_id = $1 AND status = 'Pending'", [customer.id]);
        
        if (pendingRemRes.rowCount === 0) {
          const productRes = await db.query('SELECT id, name FROM products WHERE category = $1 LIMIT 1', [customer.primary_product_category || 'Industrial Chemicals']);
          const productId = productRes.rows[0]?.id || 'PROD-01';
          const productName = productRes.rows[0]?.name || 'Industrial Chemicals Supply';
          
          await db.query(
            "INSERT INTO reminder_history (customer_id, product_id, reminder_date, cycle_type, status) VALUES ($1, $2, $3, $4, 'Pending')",
            [customer.id, productId, customer.next_reminder_date, customer.purchase_frequency]
          );
          
          const lastOrderDateFormatted = customer.last_order_date 
            ? new Date(customer.last_order_date).toLocaleDateString()
            : 'N/A';
            
          const variables = {
            customerName: customer.name,
            customerId: customer.id,
            category: customer.primary_product_category,
            productName: productName,
            lastOrderDate: lastOrderDateFormatted
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
          
          await db.query("INSERT INTO notifications (customer_id, channel, template_name, content_preview, status) VALUES ($1, 'Email', 'Default B2B Email Reminder', $2, 'Pending')", [customer.id, replaceVars(emailTmpl)]);
          await db.query("INSERT INTO notifications (customer_id, channel, template_name, content_preview, status) VALUES ($1, 'WhatsApp', 'WhatsApp Reorder Blast', $2, 'Pending')", [customer.id, replaceVars(whatsappTmpl)]);
          await db.query("INSERT INTO notifications (customer_id, channel, template_name, content_preview, status) VALUES ($1, 'SMS', 'SMS Urgent Restock Alert', $2, 'Pending')", [customer.id, replaceVars(smsTmpl)]);
          
          await db.query('INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)', ['System Decider', `Auto-generated B2B replenishment reminders & notification previews for customer: ${customer.name}.`]);
          count++;
        }
      }
    }
    return count;
  } catch (err: any) {
    console.error('Reminder Engine Error:', err.message);
    throw err;
  }
}
