import { Schema, model } from 'mongoose';
import { TDocument } from './document.interface';
import { DocumentAnalysisStatus } from './document.constant';

const documentSchema = new Schema<TDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    folderName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    analysisStatus: {
      type: String,
      enum: DocumentAnalysisStatus,
      default: 'pending',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
documentSchema.index({ caseId: 1 });
documentSchema.index({ folderName: 1 });
documentSchema.index({ uploadedBy: 1 });

export const DocumentModel = model<TDocument>('Document', documentSchema);
