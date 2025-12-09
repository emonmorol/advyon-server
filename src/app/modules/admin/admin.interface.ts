// src/app/modules/user/admin/admin.interface.ts

export type TUserRole =
  | 'superAdmin'
  | 'admin'
  | 'lawyer'
  | 'client'
  | 'judge';

export type TUserStatus = 'active' | 'blocked' | 'in-progress';

export type TUserFilter = {
  search?: string;
  role?: TUserRole;
  status?: TUserStatus;
};

export type TPaginationOptions = {
  page: number;
  limit: number;
  sort: string;
  skip: number;
};

export type TAdminQueryOptions = {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: TUserRole;
  status?: TUserStatus;
};
