import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'gangamaxx_secret_jwt_key_2026';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userRes.rows[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [user.id, user.role, `User ${user.name} logged in successfully.`]
    );

    // B2B security requirement: simulate OTP request for high-privilege operations
    // Trigger mock OTP flow
    res.json({
      message: 'Login successful. OTP required.',
      token,
      requireOtp: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, role, name } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email exists
    const checkEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rowCount > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, role, name, status) VALUES ($1, $2, $3, $4, $5)',
      [email, hash, role, name, 'Active']
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_role, event) VALUES ($1, $2)',
      ['System Decider', `New account registered: ${name} as role ${role}.`]
    );

    res.status(201).json({ message: 'User registered successfully. You can now log in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ error: 'OTP code is required' });
  }

  // Simulated OTP verification (code '123456' is success)
  if (otp === '123456') {
    res.json({ message: 'OTP verified successfully.' });
  } else {
    res.status(400).json({ error: 'Invalid or expired OTP code' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    const userRes = await db.query('SELECT id, name, role FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'Email address not found' });
    }

    const user = userRes.rows[0];
    const hash = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);

    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, event) VALUES ($1, $2, $3)',
      [user.id, user.role, `Password reset processed for ${user.name}.`]
    );

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
