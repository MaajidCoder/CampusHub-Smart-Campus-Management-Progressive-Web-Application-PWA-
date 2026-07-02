import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  getStudents,
  getAllUsers,
  approveUser,
  deleteUser,
} from '../controllers/auth.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  userParamSchema,
} from '../validation/auth.validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

// Protected routes (require valid access token)
router.get('/me', protect, getMe);
router.patch('/update-me', protect, validate(updateProfileSchema), updateMe);
router.get('/students', protect, restrictTo('faculty', 'admin'), getStudents);

// Admin-only user management routes
router.get('/users', protect, restrictTo('admin'), getAllUsers);
router.patch('/users/:id/approve', protect, restrictTo('admin'), validate(userParamSchema), approveUser);
router.delete('/users/:id', protect, restrictTo('admin'), validate(userParamSchema), deleteUser);

export default router;
