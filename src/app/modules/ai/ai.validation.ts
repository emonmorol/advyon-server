import { z } from 'zod';

const chatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(6000),
});

export const AIValidation = {
  chatValidation: z.object({
    body: z.object({
      message: z.string().trim().min(1).max(6000),
      caseId: z.string().trim().optional(),
      documentId: z.string().trim().optional(),
      documentIds: z.array(z.string().trim().min(1)).max(10).optional(),
      history: z.array(chatHistoryItemSchema).max(20).optional().default([]),
    }),
  }),

  analyzeDocumentValidation: z.object({
    body: z.object({
      documentId: z.string().trim().min(1),
    }),
  }),
};

