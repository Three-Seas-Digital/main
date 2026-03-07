import { Request } from 'express';

// AuthRequest extends Express Request and adds user context
// Use as: (req: any, res: Response) to avoid type conflicts with multer/file uploads
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
  csvData?: any;
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  email?: string;
  created_at?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}