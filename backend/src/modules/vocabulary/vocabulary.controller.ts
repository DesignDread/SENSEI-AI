import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { Vocabulary } from '../../models/Vocabulary';
import { AppError } from '../../middleware/errorHandler';
import * as SrsService from '../srs/srs.service';

export const listVocabulary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const level = req.query.level as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filter: Record<string, unknown> = {};
    if (level) filter.jlptLevel = level;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    const total = await Vocabulary.countDocuments(filter);
    const items = await Vocabulary.find(filter).skip((page - 1) * limit).limit(limit).lean();
    res.json({ data: items, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
};

export const getVocabulary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await Vocabulary.findById((req.params.id as string)).lean();
    if (!item) throw new AppError('Vocabulary item not found', 404);
    res.json({ data: item });
  } catch (err) { next(err); }
};

export const addToSRS = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const card = await SrsService.addCardToSRS(req.userId!, 'vocab', (req.params.id as string));
    res.json({ data: card });
  } catch (err) { next(err); }
};
