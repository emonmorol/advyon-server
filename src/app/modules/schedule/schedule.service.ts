import { Schedule } from './schedule.model';
import { ISchedule } from './schedule.interface';
import { FilterQuery } from 'mongoose';

const createEvent = async (payload: ISchedule): Promise<ISchedule> => {
  const result = await Schedule.create(payload);
  return result;
};

const getAllEvents = async (query: Record<string, unknown>): Promise<ISchedule[]> => {
  const { caseId, startDate, endDate, userId } = query;
  
  const filter: FilterQuery<ISchedule> = {};
  
  if (caseId) filter.caseId = caseId;
  if (userId) filter.participants = userId; // Basic participation check
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }

  const result = await Schedule.find(filter)
    .populate('caseId', 'title ref')
    .populate('participants', 'name email profileImage')
    .sort({ date: 1, startTime: 1 });
    
  return result;
};

const getEventById = async (id: string): Promise<ISchedule | null> => {
  const result = await Schedule.findById(id)
    .populate('caseId', 'title ref')
    .populate('participants', 'name email');
  return result;
};

const updateEvent = async (id: string, payload: Partial<ISchedule>): Promise<ISchedule | null> => {
  const result = await Schedule.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteEvent = async (id: string): Promise<ISchedule | null> => {
  const result = await Schedule.findByIdAndDelete(id);
  return result;
};

// Phase 4: Get today's schedule
const getTodaySchedule = async (userId: string): Promise<ISchedule[]> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const result = await Schedule.find({
    participants: userId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  })
    .populate('caseId', 'title ref')
    .sort({ startTime: 1 });
    
  return result;
};

export const ScheduleService = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getTodaySchedule
};
