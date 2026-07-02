import { Router } from 'express';
import { chatWithAI } from '../controllers/ai.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Protect all AI assistant routes
router.use(protect);

router.post('/chat', chatWithAI);

export default router;
