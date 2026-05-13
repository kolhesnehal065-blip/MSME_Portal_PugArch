import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'super-secret-procure-key';

// Use Declaration Merging to extend the Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: any;
        role: string;
      };
    }
  }
}

// Export AuthRequest as a type alias for the now-extended Request
export type AuthRequest = Request;

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of the following roles: ${roles.join(', ')}` });
    }

    next();
  };
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

import prisma from '../lib/prisma.js';

/**
 * Validates that the authenticated user has specific capability granted by their dynamic RBAC assignment.
 */
export const hasPermission = (permissionCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      // 1. Lookup user's dynamic role and associated flattened permission matrix
      const userWithPerms = await prisma.user.findUnique({
        where: { id: Number(req.user.id) },
        select: {
          rbacRole: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!userWithPerms?.rbacRole) {
        // Fallback: if it's an admin from standard enum, let's auto-pass.
        if (req.user.role === 'admin') return next();
        return res.status(403).json({ message: 'Insufficient access: No active dynamic role assigned.' });
      }

      // Extract flattened codes list
      const capabilities = userWithPerms.rbacRole.permissions.map(rp => rp.permission.code);
      
      // Also handle super-admin escape hatch
      if (req.user.role === 'admin' || userWithPerms.rbacRole.name === 'System Administrator') {
         return next(); 
      }

      if (capabilities.includes(permissionCode)) {
        return next();
      }

      return res.status(403).json({ 
        message: `Forbidden: Missing required capability '${permissionCode}'` 
      });

    } catch (err) {
      console.error('Auth RBAC Check Failed:', err);
      return res.status(500).json({ message: 'Internal security authorization failure.' });
    }
  };
};
