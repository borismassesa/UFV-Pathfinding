import { Request, Response, NextFunction } from 'express';

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Rate limiting is already handled in app.ts
  next();
}; 