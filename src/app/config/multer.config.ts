import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinaryUpload } from './cloudinary.config';
import appError from '../errors/appError';
import httpStatus from 'http-status';

const sanitizeFilename = (filename: string) => {
  const name = filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-\\/.]/g, '')
    .slice(0, 100);
  return (
    Math.random().toString(36).substring(2) + '-' + Date.now() + '-' + name
  );
};

const getCloudinaryFolder = (mimetype: string): string => {
  if (mimetype === 'application/pdf') return 'rimonsielts/resources';
  if (['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype))
    return 'rimonsielts/images';

  if (['audio/mpeg', 'audio/mp3'].includes(mimetype))
    return 'rimonsielts/audio';
  return 'rimonsielts/others';
};

const getCloudinaryResourceType = (
  mimetype: string,
): 'image' | 'video' | 'raw' => {
  if (['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype)) {
    return 'image';
  }

  if (mimetype === 'application/pdf') {
    return 'raw';
  }

  if (['audio/mpeg', 'audio/mp3'].includes(mimetype)) {
    return 'raw';
  }

  return 'raw';
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: (req, file) => {
    const folder = getCloudinaryFolder(file.mimetype);
    const resourceType = getCloudinaryResourceType(file.mimetype);

    return {
      folder,
      resource_type: resourceType,
      public_id: sanitizeFilename(file.originalname),

      ...(resourceType !== 'image' && {
        format:
          file.mimetype === 'audio/mpeg' ? 'mp3' : file.mimetype.split('/')[1],
      }),
    };
  },
});

export const multerUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = {
      pdf: ['application/pdf'],
      image: ['image/jpeg', 'image/jpg', 'image/png'],
      audio: ['audio/mpeg', 'audio/mp3'],
    };

    const allAllowedTypes = Object.values(allowedMimeTypes).flat();

    if (allAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new appError(
          httpStatus.BAD_REQUEST,

          'Only PDF documents, images (JPEG, JPG, PNG), and MP3 audio files are allowed!',
        ),
      );
    }
  },

  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
});
