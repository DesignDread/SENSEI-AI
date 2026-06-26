import { Router } from 'express';
import * as KanjiController from './kanji.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/', KanjiController.listKanji);
router.get('/:id', KanjiController.getKanji);
router.post('/:id/srs', authenticate, KanjiController.addToSRS);

export default router;
