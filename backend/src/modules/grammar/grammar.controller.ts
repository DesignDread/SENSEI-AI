import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { GrammarPoint } from '../../models/GrammarPoint';
import { AppError } from '../../middleware/errorHandler';
import * as SrsService from '../srs/srs.service';
import { ensureGrammarGenerated } from './grammar.service';

export const listGrammar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const level = req.query.level as string;
    const category = req.query.category as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filter: Record<string, string> = {};
    if (level) filter.jlptLevel = level;
    if (category) filter.category = category;
    const total = await GrammarPoint.countDocuments(filter);
    const items = await GrammarPoint.find(filter).skip((page - 1) * limit).limit(limit).lean();
    res.json({ data: items, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
};

export const getGrammar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    // This triggers generation if it's still a skeleton
    const item = await ensureGrammarGenerated(id);
    res.json({ data: item });
  } catch (err) { next(err); }
};

export const addToSRS = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const card = await SrsService.addCardToSRS(req.userId!, 'grammar', id);
    res.json({ data: card });
  } catch (err) { next(err); }
};
