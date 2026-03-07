import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';

// Augment Express Request to carry client context (used by authenticateClient)
declare global {
  namespace Express {
    interface Request {
      client?: {
        clientId: string;
        email: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-secret' : null);
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-refresh-secret' : null);

// Startup guard: ensure secrets are set in production
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
  process.exit(1);
}

interface TokenPayload {
  userId: number;
  username: string;
  role: string;
}

// Verify JWT from Authorization header
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET!, (err: jwt.VerifyErrors | null, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  });
}

// Verify client JWT from Authorization header
// Client tokens carry { clientId, email, userType: 'client' } and are signed
// with the same JWT_SECRET as admin tokens. Decoded payload is attached to req.client.
export function authenticateClient(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET!, (err: jwt.VerifyErrors | null, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    if (decoded.userType !== 'client') {
      res.status(403).json({ error: 'Client token required' });
      return;
    }

    req.client = {
      clientId: decoded.clientId,
      email: decoded.email,
    };

    next();
  });
}

// Generate access and refresh tokens
export function generateTokens(userId: number, username: string, role: string) {
  const payload: TokenPayload = { userId, username, role };
  
  const accessToken = jwt.sign(payload, JWT_SECRET!, { 
    expiresIn: '15m',
    issuer: 'threeseas-digital',
    audience: 'threeseas-digital'
  } as SignOptions);

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET!, { 
    expiresIn: '7d',
    issuer: 'threeseas-digital',
    audience: 'threeseas-digital'
  } as SignOptions);

  return { accessToken, refreshToken };
}

// Verify refresh token
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET!) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Check if user has any of the listed roles.
// Accepts one or more role strings so both call styles work without TS errors:
//   requireRole('admin')
//   requireRole('owner', 'admin', 'manager', 'analyst')
// 'owner' always passes regardless of the roles list.
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role;
    // 'owner' is the super-admin — always permitted.
    if (userRole !== 'owner' && !roles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Alias kept for backward compatibility with any code that imports requireAnyRole.
export const requireAnyRole = (roles: string[]) => requireRole(...roles);