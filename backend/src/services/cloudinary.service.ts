import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Setup local uploads fallback directory
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');

// Helper to check if Cloudinary settings are active
const isCloudinaryConfigured = (): boolean => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
    process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
    process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret' &&
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Media Service] Cloudinary configured successfully.');
} else {
  console.warn('[Media Service] WARNING: Cloudinary credentials missing or default. Falling back to local filesystem uploads.');
  // Ensure local uploads directory exists
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

interface UploadResponse {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a file buffer (from Multer) to either Cloudinary or the local uploads folder.
 * @param fileBuffer Buffer containing file data
 * @param folder Cloudinary folder name or local subfolder
 * @param originalName Original name of file for extension checking
 */
export const uploadFile = async (
  fileBuffer: Buffer,
  folder: string,
  originalName: string
): Promise<UploadResponse> => {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `campushub/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve({
            secure_url: result!.secure_url,
            public_id: result!.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  } else {
    // Local fallback upload
    const fileExt = path.extname(originalName) || '.bin';
    const uniqueName = `${folder}_${crypto.randomBytes(16).toString('hex')}${fileExt}`;
    const destinationPath = path.join(LOCAL_UPLOADS_DIR, uniqueName);
    
    // Write buffer to local folder
    fs.writeFileSync(destinationPath, fileBuffer);
    
    // Return path relative to the public route /uploads
    const relativeUrl = `/uploads/${uniqueName}`;
    return {
      secure_url: relativeUrl,
      public_id: `local_uploads/${uniqueName}`, // store local filename as publicId
    };
  }
};

/**
 * Deletes a file from either Cloudinary or local folder.
 * @param publicId Cloudinary public_id or local filename identifier
 */
export const deleteFile = async (publicId: string): Promise<void> => {
  if (!publicId) return;

  if (isCloudinaryConfigured() && !publicId.startsWith('local_uploads/')) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(`[Media Service] Failed to destroy Cloudinary asset: ${publicId}`, err);
    }
  } else {
    // Local fallback deletion
    const filename = publicId.replace('local_uploads/', '');
    const targetPath = path.join(LOCAL_UPLOADS_DIR, filename);
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch (err) {
        console.error(`[Media Service] Failed to delete local file: ${targetPath}`, err);
      }
    }
  }
};
