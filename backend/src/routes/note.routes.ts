import { Router } from 'express';
import {
  getAllNotes,
  createNote,
  deleteNote,
  incrementDownload,
} from '../controllers/note.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { uploadNote } from '../middlewares/upload.middleware';

const router = Router();

// Protect all note routes
router.use(protect);

router.get('/', getAllNotes);

// Only faculty members can upload study materials
router.post('/', restrictTo('faculty'), uploadNote.single('file'), createNote);

// Faculty author or admin can delete notes
router.delete('/:id', deleteNote);

// Track downloads
router.post('/:id/download', incrementDownload);

export default router;
