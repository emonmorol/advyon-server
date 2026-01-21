import express from 'express';
import { PRACTICE_AREAS, LANGUAGES } from './metadata.constant';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Metadata
 *   description: System metadata (Practice Areas, Languages)
 */

/**
 * @swagger
 * /metadata/practice-areas:
 *   get:
 *     summary: Get practice areas
 *     description: Retrieves a list of available legal practice areas.
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of practice areas
 */
router.get('/practice-areas', (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Practice areas retrieved successfully',
    data: PRACTICE_AREAS,
  });
});

/**
 * @swagger
 * /metadata/languages:
 *   get:
 *     summary: Get languages
 *     description: Retrieves a list of supported languages.
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of languages
 */
router.get('/languages', (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Languages retrieved successfully',
    data: LANGUAGES,
  });
});

export const MetadataRoutes = router;
