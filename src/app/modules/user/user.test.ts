import mongoose from 'mongoose';
import { UserServices } from './user.service';
import { User } from './user.model';
import { ClientProfile } from './profile.model';

// Mock models
jest.mock('./user.model');
jest.mock('./profile.model');
jest.mock('./user.utils', () => ({
  generateClientId: jest.fn().mockResolvedValue('C-0001'),
  generateLawyerId: jest.fn().mockResolvedValue('L-0001'),
  generateJudgeId: jest.fn().mockResolvedValue('J-0001'),
  generateAdminId: jest.fn().mockResolvedValue('A-0001'),
}));

describe('User Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a client user and profile', async () => {
      const payload = {
        password: 'password123',
        user: {
          email: 'client@example.com',
          fullName: 'Client User',
          role: 'client',
        },
        client: {
          phoneNumber: '1234567890',
        },
      };

      const mockUser = {
        id: 'C-0001',
        _id: 'user_object_id',
        ...payload.user,
      };

      (User.create as jest.Mock).mockResolvedValue([mockUser]);
      (ClientProfile.create as jest.Mock).mockResolvedValue([
        { ...payload.client, userId: 'C-0001' },
      ]);

      // Mock session
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

      const result = await UserServices.createUser(null, payload);

      expect(User.create).toHaveBeenCalled();
      expect(ClientProfile.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });
});
