import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, message: string, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        field: prismaError.meta?.target?.[0],
      });
      return;
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      res.status(400).json({
        success: false,
        message: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      });
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'RECORD_NOT_FOUND',
      });
      return;
    }

    // Default Prisma error
    res.status(500).json({
      success: false,
      message: 'Database error',
      code: 'DATABASE_ERROR',
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: (err as any).errors,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'TOKEN_INVALID',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Not found error helper
export const notFound = (resource: string): ApiError => {
  return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
};

// Bad request error helper
export const badRequest = (message: string, details?: any): ApiError => {
  return new ApiError(400, message, 'BAD_REQUEST', details);
};

// Unauthorized error helper
export const unauthorized = (message: string = 'Unauthorized'): ApiError => {
  return new ApiError(401, message, 'UNAUTHORIZED');
};

// Forbidden error helper
export const forbidden = (message: string = 'Forbidden'): ApiError => {
  return new ApiError(403, message, 'FORBIDDEN');
};

// Conflict error helper
export const conflict = (message: string): ApiError => {
  return new ApiError(409, message, 'CONFLICT');
};
