import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Protect all dashboard endpoints
router.use(protect);

router.get('/stats', getDashboardStats);

export default router;
