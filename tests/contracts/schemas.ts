import { z } from 'zod';

// ============================================
// Auth Response Schemas
// ============================================

export const UserSchema = z.object({
  id: z.string(),
  clerkUserId: z.string().optional(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(['superAdmin', 'student', 'faculty', 'admin', 'client', 'lawyer', 'judge']),
  status: z.string(),
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: UserSchema,
});

// ============================================
// Case Response Schemas
// ============================================

export const CaseFolderSchema = z.object({
  name: z.string(),
  order: z.number(),
});

export const CaseSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  title: z.string(),
  caseType: z.string(),
  status: z.enum(['active', 'pending', 'review', 'closed']),
  urgency: z.enum(['low', 'medium', 'high']),
  progress: z.number(),
  folders: z.array(CaseFolderSchema),
  createdBy: z.union([z.string(), UserSchema]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CaseListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CaseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPage: z.number(),
  }).optional(),
});

export const CaseDetailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: CaseSchema,
});

// ============================================
// Document Response Schemas
// ============================================

export const AIAnalysisSchema = z.object({
  summary: z.string().optional(),
  extractedEntities: z.array(z.string()).optional(),
  documentCategory: z.string().nullable().optional(),
  confidenceScore: z.number().optional(),
}).optional();

export const DocumentSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  folderName: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  cloudinaryUrl: z.string().url(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']),
  aiAnalysis: AIAnalysisSchema.nullable(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
});

export const DocumentListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DocumentSchema),
});

// ============================================
// Error Response Schema
// ============================================

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  stack: z.string().optional(),
});
