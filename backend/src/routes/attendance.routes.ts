import { Router } from 'express';
import {
  getStudentStats,
  getSubjectAttendance,
  markAttendanceBulk,
  createQRSession,
  qrCheckin,
} from '../controllers/attendance.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

// Student aggregate statistics
router.get('/stats', restrictTo('student'), getStudentStats);

// Detailed logs per subject
router.get('/subject/:subjectId', getSubjectAttendance);

// Faculty bulk sheet submissions
router.post('/bulk', restrictTo('faculty', 'admin'), markAttendanceBulk);

// Faculty QR session initialization
router.post('/qr-session', restrictTo('faculty', 'admin'), createQRSession);

// Student QR Code scan check-in
router.post('/qr-checkin', restrictTo('student'), qrCheckin);

export default router;
