import { Request, Response, NextFunction } from 'express';
import { Kana } from '../../models/Kana';

export const listKana = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const script = req.query.script as string;
    const filter = script ? { script } : {};
    const items = await Kana.find(filter).lean();
    res.json({ data: items, count: items.length });
  } catch (err) { next(err); }
};
