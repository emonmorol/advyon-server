/* eslint-disable no-unused-vars */

import { Document, Types } from 'mongoose';

// Document analysis status
export type TDocumentAnalysisStatus = 'pending' | 'analyzed';

// Main document interface
export interface TDocument extends Document {
  id: string;
  caseId: Types.ObjectId;
  folderName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  analysisStatus: TDocumentAnalysisStatus;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Upload document payload
export interface TUploadDocumentPayload {
  caseId: string;
  folderName: string;
  file: Express.Multer.File;
}

// Query parameters for filtering documents
export interface TDocumentQuery {
  folder?: string;
}

// Grouped documents by folder
export interface TGroupedDocuments {
  [folderName: string]: TDocument[];
}
