import { Router } from 'express';
import {
  getAllApprovedListings,
  getMyListings,
  getPendingListings,
  createListing,
  updateListingStatus,
  deleteListing,
} from '../controllers/marketplace.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { uploadListingImage } from '../middlewares/upload.middleware';

const router = Router();

// Protect all marketplace routes
router.use(protect);

router.get('/', getAllApprovedListings);
router.get('/my-listings', getMyListings);

// Only admins can view pending items for moderation
router.get('/pending', restrictTo('admin'), getPendingListings);

// Creations require image upload
router.post('/', uploadListingImage.single('image'), createListing);

// Moderator status changes and deletion
router.patch('/:id/status', updateListingStatus);
router.delete('/:id', deleteListing);

export default router;
