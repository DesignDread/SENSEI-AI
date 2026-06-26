import { Router } from 'express';
import * as SrsController from './srs.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/due', SrsController.getDueCards);
router.post('/review', SrsController.submitReview);
router.get('/stats', SrsController.getStats);
router.post('/seed', SrsController.seedCards);   // auto-seed cards from content DB

export default router;

