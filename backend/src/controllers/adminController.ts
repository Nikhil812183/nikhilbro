import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await db.query('SELECT * FROM settings');
    res.json({ settings: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  const { settings } = req.body; // Array of { key: string, value: string }

  if (!settings || !Array.isArray(settings)) {
    return res.status(400).json({ error: 'Settings array is required' });
  }

  try {
    for (const item of settings) {
      await db.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
        [item.key, item.value]
      );
    }

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Admin', 'Updated system configurations and B2B notification templates.']
    );

    res.json({ message: 'System settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await db.query('SELECT id, email, role, name, status, created_at FROM users ORDER BY name');
    res.json({ users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const checkUser = await db.query('SELECT name, role, status FROM users WHERE id = $1', [id]);
    if (checkUser.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = checkUser.rows[0];

    await db.query(
      'UPDATE users SET role = $1, status = $2 WHERE id = $3',
      [role || current.role, status || current.status, id]
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [req.user?.id || null, req.user?.role || 'Admin', `Modified privileges for staff: ${current.name} (Role: ${role || current.role}, Status: ${status || current.status}).`]
    );

    res.json({ message: 'User role updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await db.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.json({ logs: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
