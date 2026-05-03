import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const getJwtSecret = () => process.env.JWT_SECRET || 'super-secret-procure-key';

export interface AuthRequest extends Request {
  user?: {
    id: any; // Using any to handle transition from Mongo string IDs to Prisma numeric IDs
    role: string;
  };
}


export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
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
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of the following roles: ${roles.join(', ')}` });
    }

    next();
  };
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
