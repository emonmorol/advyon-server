/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/appError';
import { User } from '../user/user.model';
import { Case } from '../case/case.model';
import { DocumentModel } from './document.model';
import { TDocumentQuery, TGroupedDocuments } from './document.interface';
import { generateDocumentId } from './document.utils';
import { cloudinaryUpload } from '../../config/cloudinary.config';

/**
 * Upload a document to a case
 */
const uploadDocument = async (
  caseId: string,
  userId: string,
  file: Express.Multer.File,
  folderName: string,
) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  console.log('user => ', user);
  console.log('caseId => ', caseId);
  
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
    folderName,
    fileName: file.originalname,
    fileType,
    fileSize: file.size,
    cloudinaryUrl: (file as any).path, // Cloudinary URL
    cloudinaryPublicId: (file as any).filename, // Cloudinary public ID
    analysisStatus: 'pending',
    uploadedBy: user._id,
    uploadedAt: new Date(),
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
    filter.folderName = query.folder;
  }

  // Get documents
  const documents = await DocumentModel.find(filter)
    .populate('uploadedBy', 'id fullName email')
    .sort({ uploadedAt: -1 });

  // Group documents by folder
  const groupedDocuments: TGroupedDocuments = {};

  documents.forEach((doc) => {
    if (!groupedDocuments[doc.folderName]) {
      groupedDocuments[doc.folderName] = [];
    }
    groupedDocuments[doc.folderName].push(doc);
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

  return { message: 'Document deleted successfully' };
};

export const DocumentServices = {
  uploadDocument,
  getDocumentsByCase,
  deleteDocument,
};
