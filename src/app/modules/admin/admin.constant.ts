// src/app/modules/user/admin/admin.constant.ts

export const ADMIN_ALLOWED_ROLES = ['admin', 'superAdmin'] as const;
export const ROLE_UPDATE_ALLOWED = ['superAdmin'] as const;
export const STATUS_UPDATE_ALLOWED = ['admin', 'superAdmin'] as const;

export const ALLOWED_USER_ROLES = [
    'superAdmin',
    'admin',
    'lawyer',
    'client',
    'judge',
] as const;

export const ALLOWED_USER_STATUSES = [
    'active',
    'blocked',
    'in-progress',
] as const;

export const ALLOWED_SORT_FIELDS = [
    'createdAt',
    'updatedAt',
    'email',
    'fullName',
    'role',
    'status',
] as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const DEFAULT_SORT = '-createdAt';

export const ADMIN_ERROR_MESSAGES = {
    USER_NOT_FOUND: 'User not found',
    INVALID_USER_ID: 'Invalid user ID format',
    CANNOT_MODIFY_SELF: 'You cannot modify your own account',
    CANNOT_DELETE_LAST_SUPERADMIN: 'Cannot delete the last superAdmin',
    CANNOT_BLOCK_LAST_SUPERADMIN: 'Cannot block the last superAdmin',
    USER_ALREADY_DELETED: 'User is already deleted',
} as const;
