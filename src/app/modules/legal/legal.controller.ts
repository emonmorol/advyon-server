import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { getAllLegalsFromDB, getSingleLegalFromDB } from './legal.service.impl';

const getAllLegals = catchAsync(async (req, res) => {
    const { result, meta } = await getAllLegalsFromDB(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Legal sections retrieved successfully',
        meta,
        data: result,
    });
});

const getSingleLegal = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await getSingleLegalFromDB(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Legal section retrieved successfully',
        data: result,
    });
});

export const LegalController = {
    getAllLegals,
    getSingleLegal,
};
