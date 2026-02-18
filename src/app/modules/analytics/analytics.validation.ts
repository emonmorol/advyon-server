import { z } from 'zod';

const dateString = z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' });

const getMetricsValidation = z.object({
    query: z.object({
        startDate: dateString.optional(),
        endDate: dateString.optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        caseId: z.string().optional(),
    }),
});

export const AnalyticsValidation = {
    getMetricsValidation,
};
