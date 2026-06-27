import { db } from '../config/db';

export async function runReminderGenerationCycle() {
  console.log('Reminder Engine: Starting automated reminder cycle check...');
  const now = new Date();
  
  try {
    // 1. Fetch all customers
    const customersRes = await db.query('SELECT * FROM customers');
    const customers = customersRes.rows;
    
    // Fetch settings for notification templates
    const settingsRes = await db.query('SELECT * FROM settings');
    const settingsMap = new Map(settingsRes.rows.map(s => [s.key, s.value]));
    
    let remindersGeneratedCount = 0;
    
    for (const customer of customers) {
      if (!customer.next_reminder_date) continue;
      
      const nextReminder = new Date(customer.next_reminder_date);
      const daysDiff = Math.ceil((nextReminder.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine new status based on days remaining
      let newStatus = 'Stable';
      if (daysDiff <= 3) {
        newStatus = 'Urgent';
      } else if (daysDiff <= 7) {
        newStatus = 'Predicted';
      }
      
      // Update customer status in DB if changed
      if (newStatus !== customer.status) {
        await db.query(
          'UPDATE customers SET status = $1 WHERE id = $2',
          [newStatus, customer.id]
        );
        
        // Log status change audit
        await db.query(
          'INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)',
          ['System Decider', `Customer ${customer.name} status recalculated to: ${newStatus} (${daysDiff} days remaining).`]
        );
      }
      
      // 2. Generate automatic reminder if due (daysDiff <= 0) and not already generated as pending
      if (daysDiff <= 0) {
        // Find if a pending reminder already exists for this customer
        const pendingRemRes = await db.query(
          "SELECT id FROM reminder_history WHERE customer_id = $1 AND status = 'Pending'",
          [customer.id]
        );
        
        if (pendingRemRes.rowCount === 0) {
          // Find primary product category to assign a product for the reminder
          const productRes = await db.query(
            'SELECT id, name FROM products WHERE category = $1 LIMIT 1',
            [customer.primary_product_category || 'Industrial Chemicals']
          );
          
          const productId = productRes.rows[0]?.id || 'PROD-01';
          const productName = productRes.rows[0]?.name || 'Industrial Chemicals Supply';
          
          // Generate pending reminder in history
          await db.query(
            `INSERT INTO reminder_history (customer_id, product_id, reminder_date, cycle_type, status) 
             VALUES ($1, $2, $3, $4, 'Pending')`,
            [customer.id, productId, customer.next_reminder_date, customer.purchase_frequency]
          );
          
          // Render templates from settings
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
          
          // Create simulated notifications previews
          await db.query(
            `INSERT INTO notifications (customer_id, channel, template_name, content_preview, status) 
             VALUES ($1, 'Email', 'Default B2B Email Reminder', $2, 'Pending')`,
            [customer.id, replaceVars(emailTmpl)]
          );
          
          await db.query(
            `INSERT INTO notifications (customer_id, channel, template_name, content_preview, status) 
             VALUES ($1, 'WhatsApp', 'WhatsApp Reorder Blast', $2, 'Pending')`,
            [customer.id, replaceVars(whatsappTmpl)]
          );
          
          await db.query(
            `INSERT INTO notifications (customer_id, channel, template_name, content_preview, status) 
             VALUES ($1, 'SMS', 'SMS Urgent Restock Alert', $2, 'Pending')`,
            [customer.id, replaceVars(smsTmpl)]
          );
          
          // Log audit
          await db.query(
            'INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)',
            ['System Decider', `Auto-generated B2B replenishment reminders & notification previews for customer: ${customer.name}.`]
          );
          
          remindersGeneratedCount++;
        }
      }
    }
    
    console.log(`Reminder Engine: Cycle finished. Generated ${remindersGeneratedCount} new reminders.`);
    return remindersGeneratedCount;
  } catch (err: any) {
    console.error('Reminder Engine: Generation Cycle Error:', err.message);
    throw err;
  }
}
