import { Router } from 'express';
import {
  getAllItems,
  createItem,
  updateItemStatus,
  deleteItem,
} from '../controllers/lostFound.controller';
import { protect } from '../middlewares/auth.middleware';
import { uploadListingImage } from '../middlewares/upload.middleware';

const router = Router();

// Protect all Lost & Found endpoints
router.use(protect);

router.get('/', getAllItems);
router.post('/', uploadListingImage.single('image'), createItem);
router.patch('/:id/status', updateItemStatus);
router.delete('/:id', deleteItem);

export default router;
