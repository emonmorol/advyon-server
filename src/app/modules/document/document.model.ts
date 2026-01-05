import { Schema, model } from 'mongoose';
import { TDocument, TAiAnalysis } from './document.interface';
import {
  DocumentProcessingStatus,
  DocumentAnalysisStatus,
  DocumentCategory,
} from './document.constant';

// Sub-schema for AI Analysis results
const aiAnalysisSchema = new Schema<TAiAnalysis>(
  {
    summary: {
      refined: {
        type: String,
        default: '',
      },
      raw: {
        type: String,
        default: '',
      },
    },
    extractedEntities: {
      type: [String],
      default: [],
    },
    documentCategory: {
      type: String,
      enum: [...DocumentCategory, null],
      default: null,
    },
    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    analyzedAt: {
      type: Date,
    },
    modelVersion: {
      type: String,
    },
  },
  { _id: false },
);

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
    folder: {
        type: String,
        default: 'Unsorted'
    },
    originalName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    mimeType: {
        type: String,
        required: true
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storagePath: {
        type: String,
        default: ''
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    cloudinaryFileId: {
      type: String,
      default: '',
    },
    extractedText: {
      type: String,
      select: false, // Don't return by default
    },

    // Processing status for AI pipeline
    processingStatus: {
      type: String,
      enum: DocumentProcessingStatus,
      default: 'pending',
    },
    processingError: {
      type: String,
    },

    // AI Analysis results
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: null,
    },

    // Legacy analysis status (deprecated)
    analysisStatus: {
      type: String,
      enum: DocumentAnalysisStatus,
      default: 'pending',
    },

    // References
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
documentSchema.index({ folder: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ uploaderId: 1 });
documentSchema.index({ processingStatus: 1 });
documentSchema.index({ 'aiAnalysis.documentCategory': 1 });

// Compound index for efficient querying by case and processing status
documentSchema.index({ caseId: 1, processingStatus: 1 });

export const DocumentModel = model<TDocument>('Document', documentSchema);
