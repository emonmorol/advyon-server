/* eslint-disable no-unused-vars */

import { Document, Types } from 'mongoose';

// Case status enum
export type TCaseStatus = 'active' | 'pending' | 'review' | 'closed';

// Case urgency enum
export type TCaseUrgency = 'low' | 'medium' | 'high';

// Case folder structure
export interface TCaseFolder {
  name: string;
  order: number;
}

// Main case interface
export interface TCase extends Document {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  status: TCaseStatus;
  urgency: TCaseUrgency;
  nextDeadline?: Date;
  nextDeadlineDescription?: string;
  progress: number;
  createdBy: Types.ObjectId;
  folders: TCaseFolder[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create case payload
export interface TCreateCasePayload {
  title: string;
  caseNumber?: string;
  caseType?: string;
  urgency?: TCaseUrgency;
  nextDeadline?: Date;
  nextDeadlineDescription?: string;
  folders?: TCaseFolder[];
}

// Update case payload
export interface TUpdateCasePayload {
  title?: string;
  caseType?: string;
  status?: TCaseStatus;
  urgency?: TCaseUrgency;
  nextDeadline?: Date;
  nextDeadlineDescription?: string;
  progress?: number;
  folders?: TCaseFolder[];
}

// Query parameters for filtering cases
export interface TCaseQuery {
  search?: string;
  status?: TCaseStatus;
  urgency?: TCaseUrgency;
  page?: number;
  limit?: number;
}
