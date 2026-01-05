import { z } from 'zod';

export const DocumentValidation = {
  uploadDocumentValidation: z.object({
    body: z.object({
      folder: z.string().min(1, 'Folder name is required'),
    }),
  }),

  queryDocumentValidation: z.object({
    query: z.object({
      folder: z.string().optional(),
    }),
  }),
};
