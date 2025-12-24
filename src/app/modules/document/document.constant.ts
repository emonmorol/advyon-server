// Processing status for AI pipeline
export const DocumentProcessingStatus = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;

// Legacy analysis status (deprecated, use DocumentProcessingStatus)
export const DocumentAnalysisStatus = ['pending', 'analyzed'] as const;

// Auto-detected document categories
export const DocumentCategory = [
  'Affidavit',
  'Evidence',
  'Contract',
  'Court Filing',
  'Correspondence',
  'Legal Brief',
  'Pleading',
  'Discovery',
  'Motion',
  'Order',
  'Judgment',
  'Settlement',
  'Other',
] as const;

export const ALLOWED_FILE_TYPES = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'docx',
  'doc',
  'mp4',
  'avi',
  'mov',
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
