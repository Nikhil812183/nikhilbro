import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getProducts(req: AuthenticatedRequest, res: Response) {
  const { category, warehouse, search = '' } = req.query;

  try {
    let queryText = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (name LIKE $${paramIndex} OR sku LIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (warehouse) {
      queryText += ` AND warehouse = $${paramIndex}`;
      params.push(warehouse);
      paramIndex++;
    }

    queryText += ' ORDER BY category, name';

    const result = await db.query(queryText, params);
    res.json({ products: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProductById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product SKU not found' });
    }
    res.json({ product: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  const { id, sku, name, category, price, stock, warehouse } = req.body;

  if (!id || !sku || !name || !category || price === undefined || stock === undefined || !warehouse) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check duplication
    const checkSku = await db.query('SELECT id FROM products WHERE id = $1 OR sku = $2', [id, sku]);
    if (checkSku.rowCount > 0) {
      return res.status(409).json({ error: 'Product ID or SKU code already exists' });
    }

    await db.query(
      'INSERT INTO products (id, sku, name, category, price, stock, warehouse) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, sku, name, category, price, stock, warehouse]
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Coordinator', `Added new product catalog: ${name} SKU: ${sku} at WH: ${warehouse}.`]
    );

    res.status(201).json({ message: 'Product catalog entry created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { sku, name, category, price, stock, warehouse } = req.body;

  try {
    const checkProd = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (checkProd.rowCount === 0) {
      return res.status(404).json({ error: 'Product SKU not found' });
    }

    const current = checkProd.rows[0];

    await db.query(
      'UPDATE products SET sku = $1, name = $2, category = $3, price = $4, stock = $5, warehouse = $6 WHERE id = $7',
      [
        sku || current.sku,
        name || current.name,
        category || current.category,
        price !== undefined ? price : current.price,
        stock !== undefined ? stock : current.stock,
        warehouse || current.warehouse,
        id
      ]
    );

    // Log low stock warnings if updated stock is below 15 items
    const finalStock = stock !== undefined ? stock : current.stock;
    if (finalStock < 15) {
      await db.query(
        'INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)',
        ['System Decider', `INVENTORY ALERT: Product ${name || current.name} (${sku || current.sku}) is running low in stock (${finalStock} remaining).`]
      );
    }

    res.json({ message: 'Product details updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const checkProd = await db.query('SELECT name, sku FROM products WHERE id = $1', [id]);
    if (checkProd.rowCount === 0) {
      return res.status(404).json({ error: 'Product SKU not found' });
    }

    const product = checkProd.rows[0];
    await db.query('DELETE FROM products WHERE id = $1', [id]);

    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Admin', `Removed product from database catalog: ${product.name} (${product.sku}).`]
    );

    res.json({ message: 'Product catalog entry deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
