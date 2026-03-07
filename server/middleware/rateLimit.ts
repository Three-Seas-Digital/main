import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

interface RateLimitOptions {
  windowMs?: number | ((req: Request) => number);
  max?: number | ((req: Request) => number);
  message?: string | { error: string };
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  const messageStr = typeof message === 'string' ? message : message.error;

  return rateLimit({
    windowMs: windowMs as number,
    max: max as number,
    message: messageStr,
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round((windowMs as number) / 1000), // Convert to seconds
      });
    },
  });
}

// Predefined rate limiters for different use cases
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
  },
});

export const emailRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 emails per hour
  message: {
    error: 'Too many email requests, please try again later.',
  },
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: {
    error: 'Too many AI requests, please try again later.',
  },
});

// Custom rate limiter based on user role
export function createRoleBasedRateLimiter(roleLimits: Record<string, { windowMs: number; max: number }>) {
  // express-rate-limit typedefs don't accept function-valued windowMs/max,
  // but the runtime supports it. Cast to any to satisfy the type checker.
  return rateLimit({
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      if (!user || !user.role) {
        return req.ip;
      }
      return `${user.role}:${user.id}`;
    },
    windowMs: ((req: Request) => {
      const user = (req as any).user;
      if (!user || !user.role) {
        return 15 * 60 * 1000; // Default 15 minutes
      }
      return roleLimits[user.role]?.windowMs || 15 * 60 * 1000;
    }) as any,
    max: ((req: Request) => {
      const user = (req as any).user;
      if (!user || !user.role) {
        return 100; // Default limit
      }
      return roleLimits[user.role]?.max || 100;
    }) as any,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const user = (req as any).user;
      const isUserRequest = user && user.role;
      
      res.status(429).json({
        error: 'Too many requests, please try again later.',
        ...(isUserRequest && { userRole: user.role }),
      });
    },
  });
}

// Factory-style rate limiter: loginRateLimit(max, windowMs)
// Used by auth.ts and clientAuth.ts as loginRateLimit(5, 60000)
export function loginRateLimit(max: number, windowMs: number) {
  return createRateLimiter({ max, windowMs });
}

// Example role-based rate limiter
export const roleBasedRateLimiter = createRoleBasedRateLimiter({
  admin: { windowMs: 15 * 60 * 1000, max: 1000 }, // Admin: 1000 requests per 15 minutes
  user: { windowMs: 15 * 60 * 1000, max: 100 },   // User: 100 requests per 15 minutes
  client: { windowMs: 15 * 60 * 1000, max: 50 },  // Client: 50 requests per 15 minutes
});