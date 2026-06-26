import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as TestsService from './tests.service';

export const listTests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tests = await TestsService.listTests(req.query.level as string);
    res.json({ data: tests });
  } catch (err) { next(err); }
};

export const startAttempt = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await TestsService.startAttempt(req.userId!, (req.params.id as string));
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
};

export const submitAttempt = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const attempt = await TestsService.submitAttempt(req.userId!, (req.params.attemptId as string), req.body.answers);
    res.json({ data: attempt });
  } catch (err) { next(err); }
};

export const getReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await TestsService.getReport(req.userId!, (req.params.attemptId as string));
    res.json({ data: report });
  } catch (err) { next(err); }
};
