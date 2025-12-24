import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import config from '../config';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// Upload result interface
export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  asset_id: string;
  bytes: number;
  resource_type: string;
}

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer
 * @param options - Upload options (folder, public_id prefix, resource_type)
 * @returns Cloudinary upload result
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: {
    folder?: string;
    publicIdPrefix?: string;
    resourceType?: 'auto' | 'image' | 'video' | 'raw';
  } = {},
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const { folder = 'documents', publicIdPrefix, resourceType = 'auto' } = options;

    // Generate unique public ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const publicId = publicIdPrefix
      ? `${publicIdPrefix}_${timestamp}_${randomSuffix}`
      : `doc_${timestamp}_${randomSuffix}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result'));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          asset_id: result.asset_id,
          bytes: result.bytes,
          resource_type: result.resource_type,
        });
      },
    );

    // Convert buffer to stream and pipe to upload
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Upload a file from path to Cloudinary
 * @param filePath - Path to the file
 * @param options - Upload options
 * @returns Cloudinary upload result
 */
export const uploadFileToCloudinary = async (
  filePath: string,
  options: {
    folder?: string;
    publicIdPrefix?: string;
    resourceType?: 'auto' | 'image' | 'video' | 'raw';
  } = {},
): Promise<CloudinaryUploadResult> => {
  const { folder = 'documents', publicIdPrefix, resourceType = 'auto' } = options;

  // Generate unique public ID
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const publicId = publicIdPrefix
    ? `${publicIdPrefix}_${timestamp}_${randomSuffix}`
    : `doc_${timestamp}_${randomSuffix}`;

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    public_id: publicId,
    resource_type: resourceType,
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    asset_id: result.asset_id,
    bytes: result.bytes,
    resource_type: result.resource_type,
  };
};

/**
 * Delete a file from Cloudinary by public ID
 * @param publicId - Cloudinary public ID
 * @param resourceType - Resource type (image, video, raw)
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw',
): Promise<{ result: string }> => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

/**
 * Get a signed URL for secure document access
 * @param publicId - Cloudinary public ID
 * @param expiresInSeconds - URL expiration time in seconds
 */
export const getSignedUrl = (
  publicId: string,
  expiresInSeconds: number = 3600,
): string => {
  const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    expires_at: expirationTimestamp,
  });
};
