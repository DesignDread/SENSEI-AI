import { Router } from 'express';
import * as TestsController from './tests.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/', TestsController.listTests);
router.post('/:id/start', authenticate, TestsController.startAttempt);
router.post('/attempts/:attemptId/submit', authenticate, TestsController.submitAttempt);
router.get('/attempts/:attemptId/report', authenticate, TestsController.getReport);

export default router;
