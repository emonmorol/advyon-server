// src/app/modules/user/admin/admin.validation.ts
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

// Custom ObjectId validator
const objectIdSchema = z.string().refine((val) => isValidObjectId(val), {
  message: 'Invalid user ID format',
});

export const getUserParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.enum(['superAdmin', 'admin', 'lawyer', 'client', 'judge']),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(['active', 'blocked', 'in-progress']),
  }),
});

export const deleteUserParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'email', 'fullName', 'role', 'status'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    role: z.enum(['superAdmin', 'admin', 'lawyer', 'client', 'judge']).optional(),
    status: z.enum(['active', 'blocked', 'in-progress']).optional(),
  }),
});
