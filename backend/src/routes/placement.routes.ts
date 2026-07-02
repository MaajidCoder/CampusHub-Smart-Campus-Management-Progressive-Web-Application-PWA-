import { Router } from 'express';
import {
  getAllJobs,
  createJob,
  deleteJob,
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
} from '../controllers/placement.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { uploadNote } from '../middlewares/upload.middleware';

const router = Router();

// Protect all placement routes
router.use(protect);

// Shared Job browsing
router.get('/jobs', getAllJobs);

// Admin/TPO operations for managing Job postings
router.post('/jobs', restrictTo('admin', 'faculty'), createJob);
router.delete('/jobs/:id', restrictTo('admin', 'faculty'), deleteJob);

// Student actions: Apply & check applications status
router.post('/jobs/:id/apply', restrictTo('student'), uploadNote.single('resume'), applyToJob);
router.get('/my-applications', restrictTo('student'), getMyApplications);

// Admin/TPO actions: view applicants & update candidate pipeline
router.get('/jobs/:id/applicants', restrictTo('admin', 'faculty'), getJobApplicants);
router.patch('/applications/:id/status', restrictTo('admin', 'faculty'), updateApplicationStatus);

export default router;
