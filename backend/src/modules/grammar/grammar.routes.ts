import { Router } from 'express';
import * as GrammarController from './grammar.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/', GrammarController.listGrammar);
router.get('/:id', GrammarController.getGrammar);
router.post('/:id/srs', authenticate, GrammarController.addToSRS);

export default router;
