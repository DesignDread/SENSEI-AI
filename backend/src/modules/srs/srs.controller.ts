import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as SrsService from './srs.service';

export const getDueCards = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const cards = await SrsService.getDueCards(req.userId!, limit);
    res.json({ data: { cards, count: cards.length } });
  } catch (err) {
    next(err);
  }
};

export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cardId, grade } = req.body;
    const result = await SrsService.submitReview(req.userId!, cardId, grade);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await SrsService.getSrsStats(req.userId!);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};

export const seedCards = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const result = await SrsService.seedCardsForUser(req.userId!, limit);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

