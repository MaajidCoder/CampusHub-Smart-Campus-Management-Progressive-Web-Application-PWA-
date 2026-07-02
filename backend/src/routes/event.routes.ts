import { Router } from 'express';
import {
  getAllEvents,
  createEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
} from '../controllers/event.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { uploadListingImage } from '../middlewares/upload.middleware';

const router = Router();

// Protect all event routes
router.use(protect);

router.get('/', getAllEvents);

// Only Faculty and Admins can publish events
router.post('/', restrictTo('faculty', 'admin'), uploadListingImage.single('image'), createEvent);

// Deletions
router.delete('/:id', deleteEvent);

// RSVPs are restricted to students
router.post('/:id/register', restrictTo('student'), registerForEvent);
router.post('/:id/unregister', restrictTo('student'), unregisterFromEvent);

export default router;
