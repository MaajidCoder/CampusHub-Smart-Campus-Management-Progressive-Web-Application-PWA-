import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'faculty', 'admin'], {
      required_error: 'Role is required',
    }),
    department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
    semester: z.preprocess(
      (val) => (val === undefined || val === '' ? undefined : Number(val)),
      z.number().min(1).max(8).optional()
    ),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Reset token is required'),
  }),
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
    semester: z.preprocess(
      (val) => (val === undefined || val === '' ? undefined : Number(val)),
      z.number().min(1).max(8).optional()
    ),
  }),
});

export const userParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

