import { Router } from 'express';
import * as VocabController from './vocabulary.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/', VocabController.listVocabulary);
router.get('/:id', VocabController.getVocabulary);
router.post('/:id/srs', authenticate, VocabController.addToSRS);

export default router;
