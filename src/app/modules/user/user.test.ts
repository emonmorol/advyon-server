import mongoose from 'mongoose';
import { UserServices } from './user.service';
import { User } from './user.model';
import { ClientProfile, LawyerProfile, JudgeProfile } from './profile.model';

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

  describe('getMyProfile - Role Field Validation', () => {
    it('should return role field in profile for client user', async () => {
      const mockUser = {
        id: 'CLI-0001',
        email: 'client@example.com',
        fullName: 'John Client',
        displayName: 'JC',
        role: 'client',
        status: 'active',
        avatarUrl: 'https://example.com/avatar.jpg',
        preferredLanguage: 'en',
        timezone: 'UTC',
        isEmailVerified: true,
      };

      const mockClientProfile = {
        phoneNumber: '+8801712345678',
        address: '123 Main St',
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(ClientProfile, 'findOne').mockResolvedValue(mockClientProfile);

      const result = await UserServices.getMyProfile('CLI-0001');

      // Verify role field is present
      expect(result).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.role).not.toBeNull();
      expect(result.role).not.toBeUndefined();
      expect(result.role).toBe('client');

      // Verify other essential fields
      expect(result.id).toBe('CLI-0001');
      expect(result.email).toBe('client@example.com');
      expect(result.fullName).toBe('John Client');
    });

    it('should return role field in profile for lawyer user', async () => {
      const mockUser = {
        id: 'LAW-0001',
        email: 'lawyer@example.com',
        fullName: 'Jane Lawyer',
        displayName: 'JL',
        role: 'lawyer',
        status: 'active',
        avatarUrl: 'https://example.com/lawyer.jpg',
        preferredLanguage: 'en',
        timezone: 'UTC',
        isEmailVerified: true,
      };

      const mockLawyerProfile = {
        phoneNumber: '+8801712345679',
        address: '456 Law St',
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(LawyerProfile, 'findOne').mockResolvedValue(mockLawyerProfile);

      const result = await UserServices.getMyProfile('LAW-0001');

      expect(result.role).toBeDefined();
      expect(result.role).not.toBeNull();
      expect(result.role).not.toBeUndefined();
      expect(result.role).toBe('lawyer');
    });

    it('should return role field in profile for judge user', async () => {
      const mockUser = {
        id: 'JUD-0001',
        email: 'judge@example.com',
        fullName: 'Judge Smith',
        displayName: 'JS',
        role: 'judge',
        status: 'active',
        avatarUrl: 'https://example.com/judge.jpg',
        preferredLanguage: 'en',
        timezone: 'UTC',
        isEmailVerified: true,
      };

      const mockJudgeProfile = {
        phoneNumber: '+8801712345680',
        address: '789 Court St',
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(JudgeProfile, 'findOne').mockResolvedValue(mockJudgeProfile);

      const result = await UserServices.getMyProfile('JUD-0001');

      expect(result.role).toBeDefined();
      expect(result.role).not.toBeNull();
      expect(result.role).not.toBeUndefined();
      expect(result.role).toBe('judge');
    });

    it('should throw 404 if user not found', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await expect(UserServices.getMyProfile('NON-EXISTENT')).rejects.toThrow('User not found');
    });

    it('should handle null role gracefully if user exists', async () => {
      const mockUser = {
        id: 'USR-0001',
        email: 'user@example.com',
        fullName: 'User Without Role',
        displayName: 'UWR',
        role: null, // User has no role set
        status: 'in-progress',
        isEmailVerified: true,
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const result = await UserServices.getMyProfile('USR-0001');

      // The role field should be present (even if null) in the response
      expect(result).toBeDefined();
      expect(result).toHaveProperty('role');
      // Note: Depending on business logic, we may want to throw an error if role is null
    });

    it('should return valid role from enum values', async () => {
      const validRoles = ['client', 'lawyer', 'judge', 'admin', 'superAdmin'];

      for (const role of validRoles) {
        const mockUser = {
          id: `${role.substring(0, 3).toUpperCase()}-0001`,
          email: `${role}@example.com`,
          fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          displayName: role.charAt(0).toUpperCase(),
          role: role,
          status: 'active',
          isEmailVerified: true,
        };

        jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

        const result = await UserServices.getMyProfile(mockUser.id);

        expect(result.role).toBeDefined();
        expect(validRoles).toContain(result.role);
        expect(result.role).toBe(role);
      }
    });
  });

  describe('Role Field Integration Tests', () => {
    it('should ensure role is never undefined in /users/me/profile response', async () => {
      const mockUser = {
        id: 'CLI-0001',
        email: 'client@example.com',
        fullName: 'Client User',
        displayName: 'CU',
        role: 'client',
        status: 'active',
        isEmailVerified: true,
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const result = await UserServices.getMyProfile('CLI-0001');

      // Multiple assertions to ensure role is always present
      expect('role' in result).toBe(true);
      expect(result.hasOwnProperty('role')).toBe(true);
      expect(result.role).not.toBeUndefined();
      expect(result.role).not.toBe(null);
    });

    it('should return minimal required fields including role', async () => {
      const mockUser = {
        id: 'CLI-0001',
        email: 'client@example.com',
        fullName: 'Client User',
        displayName: 'CU',
        role: 'client',
        status: 'active',
        isEmailVerified: true,
        avatarUrl: null,
        preferredLanguage: null,
        timezone: null,
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const result = await UserServices.getMyProfile('CLI-0001');

      // Frontend expects these fields for sidebar rendering
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('status');
    });
  });
});
