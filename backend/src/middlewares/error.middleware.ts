import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
    return;
  }

  // Production Error Handling
  let error = { ...err };
  error.message = err.message;

  // MongoDB CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid path: ${err.path}`;
    error = new AppError(message, 400);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered: ${field}. Please use another value!`;
    error = new AppError(message, 400);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    error = new AppError(message, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again!', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again!', 401);
  }

  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    message: error.message || 'Something went wrong!',
  });
};
