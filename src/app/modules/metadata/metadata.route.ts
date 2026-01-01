import express from 'express';
import { PRACTICE_AREAS, LANGUAGES } from './metadata.constant';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';

const router = express.Router();

router.get('/practice-areas', (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Practice areas retrieved successfully',
    data: PRACTICE_AREAS,
  });
});

router.get('/languages', (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Languages retrieved successfully',
    data: LANGUAGES,
  });
});

export const MetadataRoutes = router;
