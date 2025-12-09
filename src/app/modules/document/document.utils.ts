import { DocumentModel } from './document.model';

/**
 * Generate unique document ID
 * Format: DOC-XXXX (e.g., DOC-0001)
 */
export const generateDocumentId = async (): Promise<string> => {
  const prefix = 'DOC';

  // Find the latest document ID
  const latestDocument = await DocumentModel.findOne({
    id: new RegExp(`^${prefix}-`),
  })
    .sort({ id: -1 })
    .select('id');

  if (!latestDocument) {
    return `${prefix}-0001`;
  }

  // Extract the number part and increment
  const lastNumber = parseInt(latestDocument.id.split('-')[1]);
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

  return `${prefix}-${nextNumber}`;
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
