import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as DashboardService from './dashboard.service';

export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await DashboardService.getDashboardSummary(req.userId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const getMastery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await DashboardService.getMastery(req.userId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await DashboardService.getHistory(req.userId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
