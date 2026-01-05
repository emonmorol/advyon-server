/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/appError';
import { User } from '../user/user.model';
import { Case } from '../case/case.model';
import { DocumentModel } from './document.model';
import {
  TDocumentQuery,
  TGroupedDocuments,
  TInitiateDocumentPayload,
} from './document.interface';
import { generateDocumentId } from './document.utils';
import { cloudinaryUpload } from '../../config/cloudinary.config';
import { ActivityService } from '../activity/activity.service';

/**
 * Upload a document to a case
 */
const uploadDocument = async (
  caseId: string,
  userId: string,
  file: Express.Multer.File,
  folder: string,
) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  // Verify case exists and user owns it
  const caseData = await Case.findOne({ id: caseId });
  if (!caseData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Case not found');
  }

  if (caseData.createdBy.toString() !== user._id.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to upload documents to this case',
    );
  }

  // Generate document ID
  const documentId = await generateDocumentId();

  // Extract file info from Cloudinary upload
  const fileType = file.mimetype.split('/')[1];

  // Create document record
  const document = await DocumentModel.create({
    id: documentId,
    caseId: caseData._id,
    folder,
    originalName: file.originalname,
    mimeType: fileType,
    fileSize: file.size,
    storagePath: (file as any).path, // Cloudinary URL
    cloudinaryPublicId: (file as any).filename, // Cloudinary public ID
    analysisStatus: 'pending',
    uploadedBy: user._id,
    uploadedAt: new Date(),
  });

  // Log activity
  await ActivityService.logActivity({
    type: 'document_uploaded',
    message: `Document uploaded: ${document.originalName} to folder ${folder}`,
    userId: user._id,
    caseId: caseData._id,
    documentId: document._id as any,
  });

  return await DocumentModel.findById(document._id)
    .populate('uploadedBy', 'id fullName email')
    .populate('caseId', 'id caseNumber title');
};

/**
 * Get all documents for a case
 */
const getDocumentsByCase = async (
  caseId: string,
  userId: string,
  query: TDocumentQuery,
) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Verify case exists and user owns it
  const caseData = await Case.findOne({ id: caseId });
  if (!caseData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Case not found');
  }

  if (caseData.createdBy.toString() !== user._id.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to access documents for this case',
    );
  }

  // Build filter
  const filter: any = { caseId: caseData._id };

  if (query.folder) {
    filter.folder = query.folder;
  }

  // Get documents
  const documents = await DocumentModel.find(filter)
    .populate('uploadedBy', 'id fullName email')
    .sort({ uploadedAt: -1 });

  // Group documents by folder
  const groupedDocuments: TGroupedDocuments = {};

  documents.forEach((doc) => {
    if (!groupedDocuments[doc.folder]) {
      groupedDocuments[doc.folder] = [];
    }
    groupedDocuments[doc.folder].push(doc);
  });

  return {
    documents,
    groupedByFolder: groupedDocuments,
    total: documents.length,
  };
};

/**
 * Delete a document
 */
const deleteDocument = async (
  documentId: string,
  caseId: string,
  userId: string,
) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Verify case exists and user owns it
  const caseData = await Case.findOne({ id: caseId });
  if (!caseData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Case not found');
  }

  if (caseData.createdBy.toString() !== user._id.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to delete documents from this case',
    );
  }

  // Find document
  const document = await DocumentModel.findOne({ id: documentId });
  if (!document) {
    throw new AppError(httpStatus.NOT_FOUND, 'Document not found');
  }

  // Verify document belongs to the case
  if (document.caseId.toString() !== caseData._id.toString()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Document does not belong to this case');
  }

  // Delete from Cloudinary
  try {
    await cloudinaryUpload.uploader.destroy(document.cloudinaryPublicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Continue with database deletion even if Cloudinary deletion fails
  }

  // Delete from database
  await DocumentModel.findByIdAndDelete(document._id);

  // Log activity
  await ActivityService.logActivity({
    type: 'document_deleted',
    message: `Document deleted: ${document.originalName}`,
    userId: user._id,
    caseId: caseData._id,
  });

  return { message: 'Document deleted successfully' };
};

/**
 * Initiate document upload - creates initial DB record with 'pending' status
 * This is the first step in the Smart Document Intake pipeline
 * @param payload - Document metadata for initial record
 * @returns The created document ID
 */
const initiateDocumentUpload = async (payload: TInitiateDocumentPayload) => {
  const { caseId, folder, originalName, mimeType, fileSize, uploaderId, description } =
    payload;

  // Verify user exists
  const user = await User.findById(uploaderId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Verify case exists and user owns it
  const caseData = await Case.findById(caseId);
  if (!caseData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Case not found');
  }

  if (caseData.createdBy.toString() !== user._id.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to upload documents to this case',
    );
  }

  // Generate document ID
  const documentId = await generateDocumentId();

  // Create initial document record with pending status
  const document = await DocumentModel.create({
    id: documentId,
    caseId: caseData._id,
    folder,
    originalName,
    mimeType,
    fileSize,
    storagePath: '', // Will be updated after upload
    cloudinaryPublicId: '', // Will be updated after upload
    cloudinaryFileId: '', // Will be updated after upload
    processingStatus: 'pending',
    analysisStatus: 'pending',
    uploaderId: user._id,
    uploadedBy: user._id,
    uploadedAt: new Date(),
    description: description || '',
  });

  return {
    documentId: document.id,
    _id: document._id,
    status: 'pending',
  };
};

/**
 * Update document processing status
 * @param documentId - The document ID
 * @param status - New processing status
 * @param error - Optional error message if status is 'failed'
 */
const updateProcessingStatus = async (
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string,
) => {
  const updateData: any = { processingStatus: status };
  if (error) {
    updateData.processingError = error;
  }

  const document = await DocumentModel.findOneAndUpdate(
    { id: documentId },
    updateData,
    { new: true },
  );

  if (!document) {
    throw new AppError(httpStatus.NOT_FOUND, 'Document not found');
  }

  return document;
};

/**
 * Update document with Cloudinary details after successful upload
 */
const updateCloudinaryDetails = async (
  documentId: string,
  cloudinaryUrl: string,
  cloudinaryPublicId: string,
  cloudinaryFileId: string,
) => {
  const document = await DocumentModel.findOneAndUpdate(
    { id: documentId },
    {
      storagePath: cloudinaryUrl,
      cloudinaryPublicId,
      cloudinaryFileId,
      processingStatus: 'processing', // Move to processing for AI analysis
    },
    { new: true },
  );

  if (!document) {
    throw new AppError(httpStatus.NOT_FOUND, 'Document not found');
  }

  return document;
};



/**
 * Update document summary (refined or raw)
 */
const updateSummary = async (documentId: string, payload: { rawSummary?: string, refinedSummary?: string, type: 'raw' | 'refined' }) => {
    const document = await DocumentModel.findOne({ id: documentId });
    if (!document) {
        throw new AppError(httpStatus.NOT_FOUND, 'Document not found');
    }

    // Initialize aiAnalysis if needed
    if (!document.aiAnalysis) {
        // Create default structure if missing
        document.aiAnalysis = {
            summary: { raw: '', refined: '' },
            extractedEntities: [],
            documentCategory: null,
            confidenceScore: 0
        };
    }
    // Ensure summary object exists
    if (!document.aiAnalysis.summary) {
        document.aiAnalysis.summary = { raw: '', refined: '' };
    }

    if (payload.type === 'raw' && payload.rawSummary) {
        document.aiAnalysis.summary.raw = payload.rawSummary;
    } else if (payload.type === 'refined' && payload.refinedSummary) {
        document.aiAnalysis.summary.refined = payload.refinedSummary;
    }

    // Mark modified because we are modifying a mixed/nested path that mongoose might not track automatically if strict is false
    document.markModified('aiAnalysis');
    
    await document.save();
    return document;
};
export const DocumentServices = {
  uploadDocument,
  getDocumentsByCase,
  deleteDocument,
  initiateDocumentUpload,
  updateProcessingStatus,
  updateCloudinaryDetails,
  updateSummary,
};
