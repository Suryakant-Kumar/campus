import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getPool } from './db.js';

export type UserRole = 'user' | 'worker' | 'co_admin' | 'admin' | 'founder';

// Hierarchy: founder > admin > co_admin > worker > user
const ROLE_HIERARCHY: Record<UserRole, number> = {
  founder: 100,
  admin: 50,
  co_admin: 40,
  worker: 20,
  user: 10,
};

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  campusId: string | null;
  campusSlug: string | null;
  exp: number; // Unix timestamp in seconds (7 days)
  iat: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  campusId: string | null;
  campusSlug: string | null;
  department?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      campus?: {
        id: string;
        name: string;
        slug: string;
        type: string;
      };
    }
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'campusconnect-secure-hmac-secret-salt-2026-production';

/**
 * Hash password with scrypt and a random salt
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt,
      });
    });
  });
}

/**
 * Verify password against stored scrypt hash and salt
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = derivedKey;
      const hashBuffer = Buffer.from(storedHash, 'hex');
      if (keyBuffer.length !== hashBuffer.length) {
        return resolve(false);
      }
      resolve(crypto.timingSafeEqual(keyBuffer, hashBuffer));
    });
  });
}

/**
 * Sign token using HMAC SHA-256 with 7-day expiration
 */
export function signToken(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  campusId: string | null;
  campusSlug: string | null;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 60 * 60; // 7 days

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    campusId: user.campusId,
    campusSlug: user.campusSlug,
    iat: now,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify HMAC token and return payload if valid and unexpired
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization Bearer header or Cookie
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Middleware: Verify user authentication and load active user from database
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.campus_id, u.department, c.slug AS campus_slug
       FROM users u
       LEFT JOIN campuses c ON u.campus_id = c.id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    const row = result.rows[0];
    req.user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      campusId: row.campus_id,
      campusSlug: row.campus_slug,
      department: row.department,
    };

    next();
  } catch (error) {
    console.error('Authentication database query error:', error);
    res.status(500).json({ error: 'Internal authentication verification error.' });
  }
}

/**
 * Optional authentication: loads user if token is valid, but does not block if not logged in
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) return next();

  const payload = verifyToken(token);
  if (!payload) return next();

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.campus_id, u.department, c.slug AS campus_slug
       FROM users u
       LEFT JOIN campuses c ON u.campus_id = c.id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      req.user = {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        campusId: row.campus_id,
        campusSlug: row.campus_slug,
        department: row.department,
      };
    }
  } catch {
    // Continue without req.user
  }
  next();
}

/**
 * Enforce minimum role level.
 * Example: requireRole('co_admin') allows 'co_admin', 'admin', and 'founder'.
 */
export function requireRole(minimumRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Please sign in.' });
      return;
    }

    const userWeight = ROLE_HIERARCHY[req.user.role] ?? 0;
    const requiredWeight = ROLE_HIERARCHY[minimumRole] ?? 0;

    if (userWeight < requiredWeight) {
      res.status(403).json({
        error: `Access denied. Requires '${minimumRole}' privileges or higher.`,
      });
      return;
    }

    next();
  };
}

/**
 * Enforces strict campus isolation.
 * A user can only access resources matching their own campus, UNLESS they are a global 'founder'.
 * Campus identifier is resolved from the route/link context.
 */
export function enforceCampusIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  // Founder has global clearance across all campuses
  if (req.user.role === 'founder') {
    return next();
  }

  // Resolve target campus slug from parameters, query, or request context
  const targetSlug = (req.params.campusSlug || req.query.campus || req.headers['x-campus-slug']) as string | undefined;

  if (targetSlug && req.user.campusSlug) {
    if (targetSlug.toLowerCase() !== req.user.campusSlug.toLowerCase()) {
      res.status(403).json({
        error: 'Forbidden. You do not belong to this campus domain.',
      });
      return;
    }
  }

  next();
}
