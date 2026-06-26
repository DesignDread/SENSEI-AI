import { Router } from 'express';
import { listKana } from './kana.controller';

const router = Router();
router.get('/', listKana);
export default router;
