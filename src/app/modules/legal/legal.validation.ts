import { z } from 'zod';

const createLegalValidationSchema = z.object({
    body: z.object({
        actName: z.string(),
        year: z.string(),
        number: z.string(),
        title: z.string(),
        chapter: z.string(),
        chapterTitle: z.string(),
        previewText: z.string(),
        fullText: z.string(),
        subsections: z.array(z.string()).optional(),
        relatedSections: z.array(z.string()).optional(),
    }),
});

export const LegalValidations = {
    createLegalValidationSchema,
};
