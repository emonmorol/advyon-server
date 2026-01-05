import httpStatus from 'http-status';
import fs from 'fs';
import mongoose from 'mongoose';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { GeminiService } from '../gemini/gemini.service';
import {
  uploadBufferToCloudinary,
  uploadFileToCloudinary,
} from '../../utils/file.upload.utils';
import { DocumentModel } from './document.model';
import { Case } from '../case/case.model';
import { User } from '../user/user.model';
import AppError from '../../errors/appError';
import { DocumentServices } from './document.service';

/**
 * Upload a document with AI analysis
 * POST /cases/:caseId/documents/upload
 *
 * Workflow:
 * 1. Receive file via Multer
 * 2. Upload to Cloudinary
 * 3. Create DB entry (status: 'processing')
 * 4. Async: Trigger AI analysis
 * 5. Update DB with results (status: 'completed' or 'failed')
 * 6. Return document ID immediately (don't wait for AI)
 */
const uploadDocument = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId: caseIdParam } = req.params;
  const { folder, description } = req.body;
  const file = req.file;

  // Validate caseId
  if (!caseIdParam) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Missing required field: caseId',
      data: null,
    });
  }

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'No file uploaded',
      data: null,
    });
  }

  // Resolve case ID: might be ObjectId or custom ID (e.g., CS-2025-0047)
  let resolvedCaseId: string = caseIdParam;
  const isCaseValidObjectId = mongoose.Types.ObjectId.isValid(caseIdParam);

  if (!isCaseValidObjectId) {
    // It's a custom ID (e.g., CS-2025-0047). Find the real _id.
    const caseData = await Case.findOne({ id: caseIdParam });
    if (!caseData) {
      throw new AppError(httpStatus.NOT_FOUND, `Case not found: ${caseIdParam}`);
    }
    resolvedCaseId = caseData._id.toString();
  }

  // Resolve user ID: might be ObjectId or custom ID (e.g., CLI-0002)
  let resolvedUploaderId: string = userId;
  const isUserValidObjectId = mongoose.Types.ObjectId.isValid(userId);

  if (!isUserValidObjectId) {
    // It's a custom ID (e.g., CLI-0002). Find the real _id.
    const uploaderUser = await User.findOne({ id: userId });
    if (!uploaderUser) {
      throw new AppError(httpStatus.NOT_FOUND, `Uploader user not found: ${userId}`);
    }
    resolvedUploaderId = uploaderUser._id.toString();
  }

  const documentInit = await DocumentServices.initiateDocumentUpload({
    caseId: resolvedCaseId,
    folder: folder || 'General',
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    uploaderId: resolvedUploaderId,
    description: description || '',
  });

  const documentId = documentInit.documentId;

  // Step 2: Upload to Cloudinary (async, but we need the URL)
  try {
    let cloudinaryResult;

    // Check if file is stored on disk (multer diskStorage) or in memory
    if (file.path) {
      // File is on disk
      cloudinaryResult = await uploadFileToCloudinary(file.path, {
        folder: `advyon/cases/${caseIdParam}/documents`,
        publicIdPrefix: `doc_${documentId}`,
        resourceType: 'auto',
      });

      // Clean up temp file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    } else if (file.buffer) {
      // File is in memory
      cloudinaryResult = await uploadBufferToCloudinary(file.buffer, {
        folder: `advyon/cases/${caseIdParam}/documents`,
        publicIdPrefix: `doc_${documentId}`,
        resourceType: 'auto',
      });
    } else {
      throw new Error('File data not available');
    }

    // Step 3: Update DB with Cloudinary details (status: 'processing')
    await DocumentServices.updateCloudinaryDetails(
      documentId,
      cloudinaryResult.secure_url,
      cloudinaryResult.public_id,
      cloudinaryResult.asset_id,
    );

    // Step 4: Trigger async AI analysis (don't await)
    processDocumentWithAI(documentId, file).catch((error) => {
      console.error(`AI processing error for document ${documentId}:`, error);
    });

    // Step 5: Return immediately with document ID
    const document = await DocumentModel.findOne({ id: documentId })
      .populate('uploadedBy', 'id fullName email')
      .populate('caseId', 'id caseNumber title');

    const responseData = {
        id: document?.id,
        caseId: document?.caseId instanceof mongoose.Types.ObjectId ? (document?.caseId as any).id : (document?.caseId as any).caseNumber,
        name: document?.originalName,
        url: document?.storagePath,
        type: document?.mimeType,
        size: document?.fileSize,
        folder: document?.folder,
        uploadedAt: document?.uploadedAt,
        processingStatus: 'queued',
        analysisId: null
    };

    sendResponse(res, {
      statusCode: httpStatus.OK, // User requested 200 OK
      success: true,
      message: 'Document uploaded successfully', // Added message field for consistency
      data: responseData,
    });
  } catch (error) {
    // Update status to failed if upload fails
    await DocumentServices.updateProcessingStatus(
      documentId,
      'failed',
      error instanceof Error ? error.message : 'Upload failed',
    );

    throw error;
  }
});

/**
 * Background process for AI analysis
 * This runs asynchronously after the response is sent
 */
async function processDocumentWithAI(
  documentId: string,
  file: Express.Multer.File,
): Promise<void> {
  try {
    // Extract text from document
    const fileBuffer = file.buffer || fs.readFileSync(file.path);
    const extractedText = await GeminiService.extractTextFromDocument(
      fileBuffer,
      file.mimetype,
    );

    // Analyze with Gemini AI
    const aiAnalysis = await GeminiService.analyzeLegalDocument(extractedText);

    // Update document with AI analysis results
    await DocumentModel.findOneAndUpdate(
      { id: documentId },
      {
        processingStatus: 'completed',
        aiAnalysis,
        analysisStatus: 'analyzed', // Legacy field
      },
    );

    console.log(`AI analysis completed for document: ${documentId}`);
  } catch (error) {
    console.error(`AI processing failed for document ${documentId}:`, error);

    // Update status to failed
    await DocumentServices.updateProcessingStatus(
      documentId,
      'failed',
      error instanceof Error ? error.message : 'AI analysis failed',
    );
  }
}

/**
 * Upload document (legacy - direct Cloudinary upload via multer-storage-cloudinary)
 * POST /cases/:caseId/documents/upload-legacy
 */
const uploadDocumentLegacy = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId } = req.params;
  const { folder } = req.body;
  const file = req.file;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'No file uploaded',
      data: null,
    });
  }

  const result = await DocumentServices.uploadDocument(
    caseId,
    userId,
    file,
    folder,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Document uploaded successfully',
    data: result,
  });
});

/**
 * Get all documents for a case
 * GET /cases/:caseId/documents
 */
const getDocuments = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId } = req.params;

  const result = await DocumentServices.getDocumentsByCase(
    caseId,
    userId,
    req.query,
  );

  // Map to required format
  // Map to required format matching user request
  const mappedDocuments = result.documents.map((doc: any) => ({
      id: doc.id,
      name: doc.originalName,
      folder: doc.folder,
      uploadedAt: doc.uploadedAt,
      processingStatus: doc.processingStatus === 'pending' ? 'queued' : doc.processingStatus,
      confidenceScore: doc.aiAnalysis?.confidenceScore,
      documentCategory: doc.aiAnalysis?.documentCategory
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: mappedDocuments,
  });
});

/**
 * Get document content for viewer
 * GET /documents/:id/content
 */
const getDocumentContent = catchAsync(async (req, res) => {
    const { documentId } = req.params; // Make sure route param matches
    
    // logic to get url. reusing existing service or just finding doc
    const document = await DocumentModel.findOne({ id: documentId });
    if (!document) {
        throw new AppError(httpStatus.NOT_FOUND, 'Document not found');
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Document content retrieved',
        data: { url: document.storagePath }
    });
});

/**
 * Update document summary
 * PUT /documents/:id/summary
 */
const updateDocumentSummary = catchAsync(async (req, res) => {
    const { documentId } = req.params;
    const result = await DocumentServices.updateSummary(documentId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Document summary updated',
        data: result
    });
});

/**
 * Get single document with AI analysis status
 * GET /cases/:caseId/documents/:documentId
 */
const getDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;

  const document = await DocumentModel.findOne({ id: documentId })
    .populate('uploadedBy', 'id fullName email')
    .populate('caseId', 'id caseNumber title');

  if (!document) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Document not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document retrieved successfully',
    data: document,
  });
});

/**
 * Get document processing status (for polling)
 * GET /cases/:caseId/documents/:documentId/status
 */
const getDocumentStatus = catchAsync(async (req, res) => {
  const { documentId } = req.params;

  const document = await DocumentModel.findOne(
    { id: documentId },
    { processingStatus: 1, processingError: 1, aiAnalysis: 1 },
  );

  if (!document) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Document not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
        id: document.id,
        processingStatus: document.processingStatus === 'pending' ? 'queued' : document.processingStatus,
        aiAnalysis: document.aiAnalysis ? {
            summary: document.aiAnalysis.summary.refined,
            documentCategory: document.aiAnalysis.documentCategory,
            confidenceScore: document.aiAnalysis.confidenceScore,
            entities: document.aiAnalysis.extractedEntities,
            riskScore: 0.1 // Mock risk score as it's not in our schema yet
        } : null,
        error: document.processingError || null
    },
  });
});

/**
 * Delete a document
 * DELETE /cases/:caseId/documents/:documentId
 */
const deleteDocument = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId, documentId } = req.params;

  const result = await DocumentServices.deleteDocument(
    documentId,
    caseId,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

/**
 * Re-analyze document with AI (retry failed analysis)
 * POST /cases/:caseId/documents/:documentId/reanalyze
 */
const reanalyzeDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;

  const document = await DocumentModel.findOne({ id: documentId });

  if (!document) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Document not found',
      data: null,
    });
  }

  // Update status to processing
  await DocumentServices.updateProcessingStatus(documentId, 'processing');

  // We need the file for re-analysis, but it's on Cloudinary
  // For re-analysis, we would need to download from Cloudinary first
  // This is a placeholder - actual implementation would fetch and re-process

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document re-analysis initiated',
    data: { documentId, processingStatus: 'processing' },
  });
});

/**
 * Download a document
 * GET /documents/:caseId/:documentId/download
 */
const downloadDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;

  const document = await DocumentModel.findOne({ id: documentId });

  if (!document) {
    throw new AppError(httpStatus.NOT_FOUND, 'Document not found');
  }

  // In a real production app, we might proxy the file or use signed URLs
  // For now, we'll return the Cloudinary URL for the client to download
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Download URL retrieved successfully',
    data: {
      downloadUrl: document.storagePath,
      fileName: document.originalName,
    },
  });
});

export const DocumentControllers = {
  uploadDocument,
  uploadDocumentLegacy,
  getDocuments,
  getDocument,
  getDocumentStatus,
  deleteDocument,
  reanalyzeDocument,
  downloadDocument,
  getDocumentContent,
  updateDocumentSummary,
};
