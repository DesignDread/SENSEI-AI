import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { Kanji } from '../../models/Kanji';
import { AppError } from '../../middleware/errorHandler';
import * as SrsService from '../srs/srs.service';

export const listKanji = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const level = req.query.level as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filter = level ? { jlptLevel: level } : {};
    const total = await Kanji.countDocuments(filter);
    const items = await Kanji.find(filter)
      .sort({ frequencyRank: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-pictographImage')
      .lean();
    res.json({ data: items, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
};

export const getKanji = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const kanji = await Kanji.findById((req.params.id as string)).lean();
    if (!kanji) throw new AppError('Kanji not found', 404);
    res.json({ data: kanji });
  } catch (err) { next(err); }
};

export const addToSRS = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const card = await SrsService.addCardToSRS(req.userId!, 'kanji', (req.params.id as string));
    res.json({ data: card });
  } catch (err) { next(err); }
};
