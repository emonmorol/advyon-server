import httpStatus from 'http-status';
import fs from 'fs';
import mongoose from 'mongoose';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OpenRouterService } from '../ai/openrouter.service';
import { extractTextFromDocument } from '../../utils/document.utils';
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

    try {
        console.log('File uploaded via middleware:', file); 
      // Step 2: Extract Cloudinary details (already uploaded via multer middleware)
      if (!file.path) {
         throw new Error('File path (Cloudinary URL) not available');
      }

    const cloudinaryUrl = file.path;
    console.log('Using Cloudinary URL:', cloudinaryUrl);
    // Check if the URL is accessible
    // For raw files, sometimes the extension is missing or it needs specific handling
    
    const cloudinaryPublicId = file.filename;
    
    // Step 3: Update DB with Cloudinary details (status: 'processing')
    await DocumentServices.updateCloudinaryDetails(
      documentId,
      cloudinaryUrl,
      cloudinaryPublicId,
      cloudinaryPublicId, // Using filename as assetId since it's not strictly separate here
    );

    // Step 4: Trigger async AI analysis (don't await)
    // We pass the URL so the background process can download it
    processDocumentWithAI(documentId, cloudinaryUrl, file.mimetype, cloudinaryPublicId).catch((error) => {
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
  // No catch block needed here for upload failure because request shouldn't fail after DB init 
  // if Cloudinary was already handled by middleware. 
  // But if updateCloudinaryDetails fails, it will go to global error handler.
  // We can wrap in try-catch if we want to update status on error, but catchAsync handles it.
  // However, the original code had a try/catch to update status to failed.
  } catch (error) {
     await DocumentServices.updateProcessingStatus(
      documentId,
      'failed',
      error instanceof Error ? error.message : 'Upload processing failed',
    );
    throw error;
  }
});

/**
 * Background process for AI analysis
 * This runs asynchronously after the response is sent
 */
// Import cloudinary to generate signed URLs
import { cloudinaryUpload } from '../../config/cloudinary.config';

/**
 * Background process for AI analysis
 * This runs asynchronously after the response is sent
 */
async function processDocumentWithAI(
  documentId: string,
  fileUrl: string,
  mimeType: string,
  publicId: string
): Promise<void> {
  try {
    console.log(`Starting AI analysis for document ${documentId}`);
    
    // Generate a signed URL for download to bypass potential access restrictions
    // This handles cases where the raw file might be private/authenticated
    const resourceType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'raw';
    
    // We can assume format is part of publicId for raw files usually, but let's just use the publicId
    // For raw files, we might need to be careful with the extension
    
    // Fallback: If publicId is missing (unlikely), stick to fileUrl.
    let downloadUrl = fileUrl;
    
    console.log(`Downloading file from: ${downloadUrl}`);

    // Download file content
    let response = await fetch(downloadUrl);
    
    if (response.status === 401 || response.status === 403) {
        console.log('Download failed with 401/403, attempting to generte signed URL...');
        // Try generating a signed URL for 'authenticated' type (common for raw files restriction)
        // Note: This assumes we have the right publicId.
        const signedUrl = cloudinaryUpload.url(publicId, {
            resource_type: resourceType,
            type: 'authenticated',
            sign_url: true,
            secure: true
        });
        console.log(`Retrying with signed URL: ${signedUrl}`);
        response = await fetch(signedUrl);
        
        // If still fails, try 'private'
        if (!response.ok) {
             const privateUrl = cloudinaryUpload.url(publicId, {
                resource_type: resourceType,
                type: 'private',
                sign_url: true,
                secure: true
            });
            console.log(`Retrying with private signed URL: ${privateUrl}`);
            response = await fetch(privateUrl);
        }
    }

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Extract text from document using the new utility
    const extractedText = await extractTextFromDocument(
      fileBuffer,
      mimeType,
    );

    // Analyze with OpenRouterService instead of GeminiService
    const aiAnalysis = await OpenRouterService.analyzeLegalDocument(extractedText);

    // Update document with AI analysis results
    await DocumentModel.findOneAndUpdate(
      { id: documentId },
      {
        processingStatus: 'completed',
        aiAnalysis: aiAnalysis,
        extractedText: extractedText,
        summary: aiAnalysis.summary.refined,
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
