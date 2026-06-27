import { db } from '../config/db';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export async function generateCSVReport(type: string): Promise<string> {
  let queryText = '';
  let headers: string[] = [];
  let rowMapper = (row: any) => '';

  switch (type) {
    case 'reminder':
      queryText = `
        SELECT r.id, c.name as customer_name, p.name as product_name, r.reminder_date, r.cycle_type, r.status 
        FROM reminder_history r
        JOIN customers c ON r.customer_id = c.id
        JOIN products p ON r.product_id = p.id
        ORDER BY r.reminder_date DESC`;
      headers = ['Reminder ID', 'Customer Name', 'Product Name', 'Reminder Date', 'Cycle', 'Status'];
      rowMapper = (row) => `"${row.id}","${row.customer_name}","${row.product_name}","${row.reminder_date}","${row.cycle_type}","${row.status}"`;
      break;

    case 'customer':
      queryText = 'SELECT id, name, company, contact, email, type, purchase_frequency, status FROM customers ORDER BY name';
      headers = ['Customer ID', 'Name', 'Company', 'Contact', 'Email', 'Type', 'Frequency', 'Status'];
      rowMapper = (row) => `"${row.id}","${row.name}","${row.company}","${row.contact}","${row.email}","${row.type}","${row.purchase_frequency}","${row.status}"`;
      break;

    case 'sales':
      queryText = `
        SELECT o.id as order_id, c.name as customer_name, o.total_amount, o.order_date, o.status 
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        ORDER BY o.order_date DESC`;
      headers = ['Order ID', 'Customer Name', 'Total Amount', 'Order Date', 'Delivery Status'];
      rowMapper = (row) => `"${row.order_id}","${row.customer_name}",${row.total_amount},"${row.order_date}","${row.status}"`;
      break;

    case 'product':
      queryText = 'SELECT id, sku, name, category, price, stock, warehouse FROM products ORDER BY category, name';
      headers = ['Product ID', 'SKU', 'Name', 'Category', 'Price', 'Stock', 'Warehouse'];
      rowMapper = (row) => `"${row.id}","${row.sku}","${row.name}","${row.category}",${row.price},${row.stock},"${row.warehouse}"`;
      break;

    default:
      throw new Error(`Unknown report type: ${type}`);
  }

  const res = await db.query(queryText);
  const csvLines = [
    headers.join(','),
    ...res.rows.map(rowMapper)
  ];
  return csvLines.join('\n');
}

export async function generateExcelReport(type: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`);

  let queryText = '';
  let columns: Array<{ header: string; key: string; width: number }> = [];

  switch (type) {
    case 'reminder':
      queryText = `
        SELECT r.id, c.name as customer_name, p.name as product_name, r.reminder_date, r.cycle_type, r.status 
        FROM reminder_history r
        JOIN customers c ON r.customer_id = c.id
        JOIN products p ON r.product_id = p.id
        ORDER BY r.reminder_date DESC`;
      columns = [
        { header: 'Reminder ID', key: 'id', width: 15 },
        { header: 'Customer Name', key: 'customer_name', width: 30 },
        { header: 'Product Name', key: 'product_name', width: 30 },
        { header: 'Reminder Date', key: 'reminder_date', width: 25 },
        { header: 'Cycle Type', key: 'cycle_type', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      break;

    case 'customer':
      queryText = 'SELECT id, name, company, contact, email, type, purchase_frequency, status FROM customers ORDER BY name';
      columns = [
        { header: 'Customer ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Contact', key: 'contact', width: 18 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Frequency', key: 'purchase_frequency', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      break;

    case 'sales':
      queryText = `
        SELECT o.id as order_id, c.name as customer_name, o.total_amount, o.order_date, o.status 
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        ORDER BY o.order_date DESC`;
      columns = [
        { header: 'Order ID', key: 'order_id', width: 15 },
        { header: 'Customer Name', key: 'customer_name', width: 35 },
        { header: 'Total Amount (INR)', key: 'total_amount', width: 20 },
        { header: 'Order Date', key: 'order_date', width: 25 },
        { header: 'Delivery Status', key: 'status', width: 15 }
      ];
      break;

    case 'product':
      queryText = 'SELECT id, sku, name, category, price, stock, warehouse FROM products ORDER BY category, name';
      columns = [
        { header: 'Product ID', key: 'id', width: 15 },
        { header: 'SKU', key: 'sku', width: 18 },
        { header: 'Product Name', key: 'name', width: 35 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Price (INR)', key: 'price', width: 15 },
        { header: 'Stock Level', key: 'stock', width: 12 },
        { header: 'Warehouse Location', key: 'warehouse', width: 25 }
      ];
      break;

    default:
      throw new Error(`Unknown report type: ${type}`);
  }

  sheet.columns = columns;

  const headerRow = sheet.getRow(1);
  headerRow.font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const res = await db.query(queryText);
  sheet.addRows(res.rows);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle', horizontal: 'left' };
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as any;
}

export async function generatePDFReport(type: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.rect(0, 0, 595, 80).fill('#2563EB');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('GANGA MAXX MARKETPLACE', 30, 20);
      doc.fontSize(10).font('Helvetica').text('B2B Repeat Order Reminder System - Enterprise Report Log', 30, 45);
      
      const reportTitle = `${type.toUpperCase()} STATUS REPORT`;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(14).text(reportTitle, 30, 100);
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(`Generated Date: ${new Date().toLocaleString()}`, 30, 120);
      
      let queryText = '';
      let y = 150;

      if (type === 'reminder') {
        queryText = `
          SELECT r.id, c.name as customer_name, p.name as product_name, r.reminder_date, r.status 
          FROM reminder_history r
          JOIN customers c ON r.customer_id = c.id
          JOIN products p ON r.product_id = p.id
          ORDER BY r.reminder_date DESC LIMIT 15`;
          
        doc.rect(30, y, 535, 20).fill('#F1F5F9');
        doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8);
        doc.text('ID', 35, y + 6);
        doc.text('Customer Account', 80, y + 6);
        doc.text('Product Name', 250, y + 6);
        doc.text('Reminder Date', 430, y + 6);
        doc.text('Status', 510, y + 6);
        
        y += 20;
        const res = await db.query(queryText);
        
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
        for (const row of res.rows) {
          doc.rect(30, y, 535, 18).stroke('#E2E8F0');
          doc.text(row.id.toString(), 35, y + 5);
          doc.text(row.customer_name.substring(0, 32), 80, y + 5);
          doc.text(row.product_name.substring(0, 32), 250, y + 5);
          doc.text(new Date(row.reminder_date).toLocaleDateString(), 430, y + 5);
          
          const statusColor = row.status === 'Completed' ? '#22C55E' : row.status === 'Pending' ? '#F59E0B' : '#EF4444';
          doc.fillColor(statusColor).font('Helvetica-Bold').text(row.status, 510, y + 5).fillColor('#334155').font('Helvetica');
          y += 18;
        }
      } 
      else if (type === 'customer') {
        queryText = 'SELECT id, name, company, email, type, status FROM customers LIMIT 15';
        doc.rect(30, y, 535, 20).fill('#F1F5F9');
        doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8);
        doc.text('ID', 35, y + 6);
        doc.text('Customer Name', 90, y + 6);
        doc.text('B2B Company', 240, y + 6);
        doc.text('Email Address', 370, y + 6);
        doc.text('Type', 490, y + 6);
        doc.text('Status', 525, y + 6);
        
        y += 20;
        const res = await db.query(queryText);
        
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
        for (const row of res.rows) {
          doc.rect(30, y, 535, 18).stroke('#E2E8F0');
          doc.text(row.id, 35, y + 5);
          doc.text(row.name.substring(0, 26), 90, y + 5);
          doc.text(row.company ? row.company.substring(0, 24) : 'N/A', 240, y + 5);
          doc.text(row.email, 370, y + 5);
          doc.text(row.type, 490, y + 5);
          
          const statusColor = row.status === 'Stable' ? '#22C55E' : '#EF4444';
          doc.fillColor(statusColor).font('Helvetica-Bold').text(row.status, 525, y + 5).fillColor('#334155').font('Helvetica');
          y += 18;
        }
      } 
      else if (type === 'sales') {
        queryText = `
          SELECT o.id, c.name as customer_name, o.total_amount, o.order_date, o.status 
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          ORDER BY o.order_date DESC LIMIT 15`;
        doc.rect(30, y, 535, 20).fill('#F1F5F9');
        doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8);
        doc.text('Order ID', 35, y + 6);
        doc.text('Customer Account', 100, y + 6);
        doc.text('Order Date', 290, y + 6);
        doc.text('Delivery Status', 410, y + 6);
        doc.text('Total (INR)', 490, y + 6);
        
        y += 20;
        const res = await db.query(queryText);
        
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
        for (const row of res.rows) {
          doc.rect(30, y, 535, 18).stroke('#E2E8F0');
          doc.text(row.id, 35, y + 5);
          doc.text(row.customer_name, 100, y + 5);
          doc.text(new Date(row.order_date).toLocaleString(), 290, y + 5);
          doc.text(row.status, 410, y + 5);
          doc.text(`Rs. ${Number(row.total_amount).toFixed(2)}`, 490, y + 5);
          y += 18;
        }
      } 
      else {
        queryText = 'SELECT id, sku, name, category, price, stock FROM products LIMIT 15';
        doc.rect(30, y, 535, 20).fill('#F1F5F9');
        doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8);
        doc.text('SKU', 35, y + 6);
        doc.text('Product Name', 110, y + 6);
        doc.text('Category', 300, y + 6);
        doc.text('Stock Level', 420, y + 6);
        doc.text('Unit Price (INR)', 490, y + 6);
        
        y += 20;
        const res = await db.query(queryText);
        
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
        for (const row of res.rows) {
          doc.rect(30, y, 535, 18).stroke('#E2E8F0');
          doc.text(row.sku, 35, y + 5);
          doc.text(row.name, 110, y + 5);
          doc.text(row.category, 300, y + 5);
          doc.text(row.stock.toString(), 420, y + 5);
          doc.text(`Rs. ${Number(row.price).toFixed(2)}`, 490, y + 5);
          y += 18;
        }
      }

      doc.fontSize(8).fillColor('#94A3B8').text('Ganga Maxx repeat replenishment analytics. Strictly Confidential B2B.', 30, y + 30);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
