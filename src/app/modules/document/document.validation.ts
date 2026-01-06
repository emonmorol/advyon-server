import { z } from 'zod';

export const DocumentValidation = {
  uploadDocumentValidation: z.object({
    body: z.object({
      folderName: z.string().optional(),
      folder: z.string().optional(),
    }),
  }),

  queryDocumentValidation: z.object({
    query: z.object({
      folder: z.string().optional(),
    }),
  }),
};
