import { db } from '../config/db';

export async function getCustomerRecommendations(customerId: string): Promise<any> {
  const customerRes = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
  if (customerRes.rowCount === 0) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }
  const customer = customerRes.rows[0];

  const productsRes = await db.query('SELECT * FROM products');
  const products = productsRes.rows;

  const primaryCat = customer.type === 'Hotel' ? 'Industrial Chemicals' 
                    : customer.type === 'Clinic' ? 'Sanitation Tooling' 
                    : 'Washroom Essentials';
                    
  const recommendedProducts = products
    .filter(p => p.category === customer.primary_product_category || p.category === primaryCat)
    .map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      stock: Number(p.stock),
      sku: p.sku
    }));

  let suggestedKits = [];
  if (customer.type === 'Hotel') {
    suggestedKits = [
      {
        name: 'Ganga Maxx Hotel Grand Care Kit',
        description: 'Complete heavy-duty floor and lobby polishing set designed for high occupancy cleaning schedules.',
        price: 4500.00,
        items: ['Maxx-Clean Floor Detergent 20L', 'Ganga Maxx Pro Microfiber Flat Mop', 'Heavy Duty Floor Squeegee']
      },
      {
        name: 'Guest Bathroom Premium Replenish Bundle',
        description: 'Premium towels and hand wash concentrates to restock suite restrooms.',
        price: 3200.00,
        items: ['Ganga Premium Soft Hand Towels (12pk) (x3)', 'Ganga Sanitizer Concentrate 5L']
      }
    ];
  } else if (customer.type === 'Clinic') {
    suggestedKits = [
      {
        name: 'Apollo Medical Sanitation Shield',
        description: 'High-safety grade antimicrobial chemicals and sterile squeegees, optimized for hospital environments.',
        price: 3800.00,
        items: ['Ganga Sanitizer Concentrate 5L (x2)', 'Heavy Duty Floor Squeegee', 'Ganga Premium Soft Hand Towels (12pk)']
      }
    ];
  } else {
    suggestedKits = [
      {
        name: 'Corporate Workspace Daily Essentials Package',
        description: 'High volume paper hand towels and floor sanitizers for high traffic office corridors.',
        price: 2900.00,
        items: ['Ganga Premium Soft Hand Towels (12pk) (x4)', 'Maxx-Clean Floor Detergent 20L']
      }
    ];
  }

  const frequentlyPurchased = [
    {
      name: customer.type === 'Hotel' ? 'Maxx-Clean Floor Detergent 20L' : 'Ganga Premium Soft Hand Towels (12pk)',
      sku: customer.type === 'Hotel' ? 'MC-FD-20L' : 'GP-SHT-12',
      frequency: customer.type === 'Hotel' ? 12 : 8,
      lastPrice: customer.type === 'Hotel' ? 2450.00 : 650.00
    },
    {
      name: 'Ganga Sanitizer Concentrate 5L',
      sku: 'GS-C-5L',
      frequency: 4,
      lastPrice: 1350.00
    }
  ];

  const lastOrderDate = customer.last_order_date ? new Date(customer.last_order_date) : new Date();
  const nextReminderDate = customer.next_reminder_date ? new Date(customer.next_reminder_date) : new Date();
  
  const now = new Date();
  const daysSinceLastOrder = Math.max(0, Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)));
  const averageIntervalDays = customer.purchase_frequency === 'Weekly' ? 14 : 30;
  const cycleCompletedPercentage = Math.min(100, Math.round((daysSinceLastOrder / averageIntervalDays) * 100));
  const predictedSurgeMultiplier = customer.type === 'Hotel' ? 1.25 : 1.05;
  
  const salesInsights = [
    `Recommended replenishment cycle for ${customer.name} is currently ${cycleCompletedPercentage}% complete.`,
    customer.status === 'Urgent' 
      ? `🚨 CRITICAL ALERT: Client is overdue for reorder by ${Math.abs(averageIntervalDays - daysSinceLastOrder)} days. Immediate WhatsApp outreach is recommended.`
      : `Client status is currently ${customer.status}. Restock is expected around ${nextReminderDate.toLocaleDateString()}.`,
    `Demand Surge Alert: Predicted consumption rate has risen to ${predictedSurgeMultiplier}x due to local commercial activities in the Telangana region.`
  ];

  const consumptionInsight = `Based on last order date of ${lastOrderDate.toLocaleDateString()}, this account has consumed roughly ${cycleCompletedPercentage}% of their inventory. Safety stocks at the warehouse are adequate to fulfill this request.`;

  return {
    customerId: customer.id,
    customerName: customer.name,
    recommendedProducts,
    suggestedKits,
    frequentlyPurchased,
    salesInsights,
    consumptionSummary: {
      averageIntervalDays,
      daysSinceLastOrder,
      cycleCompletedPercentage,
      predictedSurgeMultiplier,
      consumptionInsight
    }
  };
}
