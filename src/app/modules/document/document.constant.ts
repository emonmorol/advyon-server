export const DocumentAnalysisStatus = ['pending', 'analyzed'] as const;

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
