import { Request } from 'express';

export const extractToken = (request: Request): string | undefined => {
  // 2. Fallback to Authorization header
  const authHeader = request.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  return undefined;
};
