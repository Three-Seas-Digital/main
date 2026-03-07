import { randomBytes } from 'crypto';

export function generateId(): string {
  return `${Date.now()}-${randomBytes(4).toString('hex').slice(0, 7)}`;
}