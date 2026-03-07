import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';

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

// Check if user has required role
export function requireRole(requiredRole: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Check if user has any of the required roles
export function requireAnyRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}