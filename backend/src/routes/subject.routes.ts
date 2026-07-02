import { Router } from 'express';
import {
  getAllSubjects,
  createSubject,
  deleteSubject,
} from '../controllers/subject.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Protect all subject endpoints
router.use(protect);

router.get('/', getAllSubjects);

// Restrict writing actions to faculty/admin roles
router.post('/', restrictTo('faculty', 'admin'), createSubject);
router.delete('/:id', restrictTo('admin'), deleteSubject);

export default router;
