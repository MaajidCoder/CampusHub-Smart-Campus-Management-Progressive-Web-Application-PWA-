import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/appError';

// 1. Storage Configuration (store in memory so we can upload buffer to Cloudinary or write locally)
const storage = multer.memoryStorage();

// 2. Document/PDF Filter
const pdfFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are allowed for note uploads!', 400) as any, false);
  }
};

// 3. Image Filter
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WEBP) are allowed for listings!', 400) as any, false);
  }
};

// Expose Multer instances
export const uploadNote = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit for notes
  fileFilter: pdfFilter,
});

export const uploadListingImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit for images
  fileFilter: imageFilter,
});
