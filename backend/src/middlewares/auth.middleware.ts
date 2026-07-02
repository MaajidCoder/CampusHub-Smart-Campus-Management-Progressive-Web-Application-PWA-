import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { AppError } from '../utils/appError';

// Extend Express Request interface to hold the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    // Check for authorization header with Bearer token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // Fallback to checking cookie if present
      token = req.cookies.accessToken;
    }

    if (!token) {
      next(new AppError('You are not logged in! Please log in to get access.', 401));
      return;
    }

    // Verify access token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'campushub_access_secret_key_12345_super_secure'
    ) as DecodedToken;

    // Fetch user and check if they still exist
    const currentUser = await User.findById(decoded.id).select('+refreshToken');
    if (!currentUser) {
      next(new AppError('The user belonging to this token no longer exists.', 401));
      return;
    }

    // Check if user is approved
    if (!currentUser.isApproved) {
      next(new AppError('Your account has not been approved by an administrator yet.', 403));
      return;
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError('Invalid token or signature. Please log in again.', 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required to perform this action.', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action.', 403));
      return;
    }

    next();
  };
};
