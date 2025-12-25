import httpStatus from 'http-status';
import fs from 'fs';
import mongoose from 'mongoose';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DocumentServices } from './document.service';
import { GeminiService } from '../gemini/gemini.service';
import {
  uploadBufferToCloudinary,
  uploadFileToCloudinary,
} from '../../utils/file.upload.utils';
import { DocumentModel } from './document.model';
import { Case } from '../case/case.model';
import AppError from '../../errors/appError';

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
  // DEBUG: Log all incoming request details
  console.log('=== UPLOAD DEBUG START ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    hasBuffer: !!req.file.buffer,
    hasPath: !!req.file.path,
  } : 'NO FILE');
  console.log('Request user:', req.user);
  console.log('=== UPLOAD DEBUG END ===');

  const { userId } = req.user;
  const { caseId: caseIdParam } = req.params;
  const { folderName } = req.body;
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
  const isValidObjectId = mongoose.Types.ObjectId.isValid(caseIdParam);

  if (!isValidObjectId) {
    // It's a custom ID (e.g., CS-2025-0047). Find the real _id.
    console.log(`Resolving custom case ID: ${caseIdParam}`);
    const caseData = await Case.findOne({ id: caseIdParam });
    if (!caseData) {
      throw new AppError(httpStatus.NOT_FOUND, `Case not found: ${caseIdParam}`);
    }
    resolvedCaseId = caseData._id.toString();
    console.log(`Resolved to ObjectId: ${resolvedCaseId}`);
  }

  // Step 1: Initiate document record with 'pending' status
  console.log('Initiating document upload with:', { caseId: resolvedCaseId, folderName: folderName || 'General', fileName: file.originalname, uploaderId: userId });
  
  const documentInit = await DocumentServices.initiateDocumentUpload({
    caseId: resolvedCaseId,
    folderName: folderName || 'General',
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    uploaderId: userId,
  });

  console.log('Document initiated:', documentInit);
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

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Document uploaded successfully. AI analysis in progress.',
      data: {
        document,
        processingStatus: 'processing',
        message: 'AI analysis is running in the background. Poll for updates.',
      },
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
  const { folderName } = req.body;
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
    folderName,
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

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Documents retrieved successfully',
    data: result,
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
    message: 'Document status retrieved',
    data: {
      processingStatus: document.processingStatus,
      processingError: document.processingError,
      aiAnalysis: document.aiAnalysis,
      isComplete: document.processingStatus === 'completed',
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

export const DocumentControllers = {
  uploadDocument,
  uploadDocumentLegacy,
  getDocuments,
  getDocument,
  getDocumentStatus,
  deleteDocument,
  reanalyzeDocument,
};
