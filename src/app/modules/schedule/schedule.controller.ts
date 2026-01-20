import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { ScheduleService } from './schedule.service';

const createEvent = catchAsync(async (req: Request, res: Response) => {
  // If user is authenticated, add them as creator
  const userId = req.user?.userId;
  const payload = { ...req.body, createdBy: userId };
  
  const result = await ScheduleService.createEvent(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event created successfully',
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  // Filter by user if not admin? For now, list all or filter by query
  const result = await ScheduleService.getAllEvents(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Events retrieved successfully',
    data: result,
  });
});

const getEventById = catchAsync(async (req: Request, res: Response) => {
  const result = await ScheduleService.getEventById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event retrieved successfully',
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await ScheduleService.updateEvent(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await ScheduleService.deleteEvent(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  });
});

export const ScheduleController = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
