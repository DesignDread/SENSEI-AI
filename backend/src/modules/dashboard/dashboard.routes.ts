import { Router } from 'express';
import * as DashboardController from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/summary', DashboardController.getSummary);
router.get('/mastery', DashboardController.getMastery);
router.get('/history', DashboardController.getHistory);

export default router;
