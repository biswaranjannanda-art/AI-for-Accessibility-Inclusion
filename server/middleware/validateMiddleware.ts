import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const details = (err.issues || (err as any).errors || []).map((issue: any) => ({
          field: issue.path ? issue.path.join('.') : 'body',
          message: issue.message,
        }));
        res.status(400).json({
          error: 'Validation failed',
          details,
        });
        return;
      }
      res.status(400).json({ error: 'Malformed request payload' });
    }
  };
}
