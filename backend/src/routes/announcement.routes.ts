import { Router } from 'express';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Require logging in for all announcement endpoints
router.use(protect);

router.get('/', getAllAnnouncements);

// Write actions restricted to Faculty and Admins
router.post('/', restrictTo('faculty', 'admin'), createAnnouncement);
router.patch('/:id', restrictTo('faculty', 'admin'), updateAnnouncement);
router.delete('/:id', restrictTo('faculty', 'admin'), deleteAnnouncement);

export default router;
