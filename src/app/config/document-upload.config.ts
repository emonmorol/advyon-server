import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinaryUpload } from './cloudinary.config';
import AppError from '../errors/appError';
import httpStatus from 'http-status';

/**
 * Sanitize filename for Cloudinary
 */
const sanitizeFilename = (filename: string): string => {
  const name = filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9\-\\/_.]/g, '') // Remove special characters
    .slice(0, 100); // Limit length

  return `${Math.random().toString(36).substring(2)}-${Date.now()}-${name}`;
};

/**
 * Get Cloudinary resource type based on file mimetype
 */
const getResourceType = (mimetype: string): 'image' | 'video' | 'raw' => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw';
};

/**
 * Memory storage for case documents
 * We use memory storage to allow:
 * 1. AI processing using the file buffer immediately
 * 2. Manual upload to Cloudinary in the controller
 * 3. Avoiding double uploads and 401 errors when fetching back
 */
const documentStorage = multer.memoryStorage();

/**
 * Multer upload middleware for documents
 */
export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      // Videos
      'video/mp4',
      'video/avi',
      'video/quicktime',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          'Invalid file type. Allowed: PDF, DOCX, DOC, JPG, PNG, MP4, AVI, MOV',
        ),
      );
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1, // One file at a time
  },
});
