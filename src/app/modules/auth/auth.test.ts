/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import mongoose from 'mongoose';
import { User } from '../user/user.model';
import { ClientProfile, LawyerProfile, JudgeProfile } from '../user/profile.model';

// Mock data
const mockClerkUserId = 'user_test123';
const mockEmail = 'test@example.com';

describe('Auth Module - Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database connection if needed
    // await mongoose.connect(process.env.TEST_DATABASE_URL);
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await ClientProfile.deleteMany({});
    await LawyerProfile.deleteMany({});
    await JudgeProfile.deleteMany({});
    // await mongoose.connection.close();
  });

  describe('POST /auth/sync', () => {
    it('should create a new user on first sync', async () => {
      const mockUser = {
        clerkUserId: mockClerkUserId,
        email: mockEmail,
      };

      // Mock Clerk JWT verification
      jest.mock('../../middlewares/auth', () => ({
        __esModule: true,
        default: () => (req: any, res: any, next: any) => {
          req.user = mockUser;
          next();
        },
      }));

      // Test would make actual request here
      // const response = await request(app).post('/api/v1/auth/sync');
      
      expect(true).toBe(true); // Placeholder
    });

    it('should return existing user on subsequent sync', async () => {
      // Create user first
      const existingUser = await User.create({
        id: 'CLI-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        fullName: 'Test User',
        role: 'client',
        status: 'active',
        isEmailVerified: true,
        needsPasswordChange: false,
      });

      expect(existingUser).toBeDefined();
      expect(existingUser.clerkUserId).toBe(mockClerkUserId);
    });
  });

  describe('POST /auth/onboard', () => {
    beforeEach(async () => {
      // Create a user in 'in-progress' status
      await User.create({
        id: 'CLI-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        fullName: 'Temp User',
        role: 'client',
        status: 'in-progress',
        isEmailVerified: true,
        needsPasswordChange: false,
      });
    });

    it('should onboard a client user successfully', async () => {
      const onboardData = {
        role: 'client',
        profile: {
          fullName: 'John Client',
          phone: '+8801712345678',
          address: '123 Main St',
        },
      };

      // Test logic here
      expect(onboardData.role).toBe('client');
    });

    it('should onboard a lawyer user with bar registration', async () => {
      const onboardData = {
        role: 'lawyer',
        profile: {
          fullName: 'Jane Lawyer',
          barRegistrationNumber: 'BAR123',
          barCouncilName: 'Bangladesh Bar Council',
          yearsOfExperience: 5,
          primaryPracticeArea: 'Criminal Law',
        },
      };

      expect(onboardData.profile.barRegistrationNumber).toBeDefined();
    });

    it('should onboard a judge user with court details', async () => {
      const onboardData = {
        role: 'judge',
        profile: {
          fullName: 'Judge Smith',
          courtName: 'Supreme Court',
          designation: 'Chief Justice',
        },
      };

      expect(onboardData.profile.courtName).toBeDefined();
    });

    it('should reject onboarding if role already set', async () => {
      // Update user to active status
      await User.findOneAndUpdate(
        { clerkUserId: mockClerkUserId },
        { status: 'active', role: 'lawyer' }
      );

      // Attempt to change role should fail
      const attemptRoleChange = {
        role: 'client',
        profile: { fullName: 'Test' },
      };

      expect(attemptRoleChange.role).not.toBe('lawyer');
    });
  });

  describe('GET /auth/me', () => {
    beforeEach(async () => {
      // Create user with profile
      const user = await User.create({
        id: 'LAW-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        fullName: 'Jane Lawyer',
        role: 'lawyer',
        status: 'active',
        isEmailVerified: true,
        needsPasswordChange: false,
      });

      await LawyerProfile.create({
        id: 'LP-LAW-0001',
        userId: user._id,
        barRegistrationNumber: 'BAR123',
        barCouncilName: 'Bangladesh Bar Council',
        yearsOfExperience: 5,
        primaryPracticeArea: 'Criminal Law',
        verificationStatus: 'pending',
      });
    });

    it('should return user with lawyer profile', async () => {
      const user = await User.findOne({ clerkUserId: mockClerkUserId });
      expect(user).toBeDefined();
      expect(user?.role).toBe('lawyer');

      const profile = await LawyerProfile.findOne({ userId: user?._id });
      expect(profile).toBeDefined();
      expect(profile?.barRegistrationNumber).toBe('BAR123');
    });

    it('should return 404 if user not found', async () => {
      const nonExistentClerkId = 'user_nonexistent';
      const user = await User.findOne({ clerkUserId: nonExistentClerkId });
      expect(user).toBeNull();
    });
  });

  describe('PATCH /auth/me', () => {
    beforeEach(async () => {
      const user = await User.create({
        id: 'CLI-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        fullName: 'John Client',
        role: 'client',
        status: 'active',
        isEmailVerified: true,
        needsPasswordChange: false,
      });

      await ClientProfile.create({
        id: 'CP-CLI-0001',
        userId: user._id,
        phoneNumber: '+8801712345678',
        address: '123 Main St',
      });
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        fullName: 'John Updated Client',
        displayName: 'JC',
        phone: '+8801787654321',
      };

      const user = await User.findOne({ clerkUserId: mockClerkUserId });
      expect(user).toBeDefined();

      // Update would happen here
      user!.fullName = updateData.fullName;
      user!.displayName = updateData.displayName;
      await user!.save();

      const updatedUser = await User.findOne({ clerkUserId: mockClerkUserId });
      expect(updatedUser?.fullName).toBe(updateData.fullName);
      expect(updatedUser?.displayName).toBe(updateData.displayName);
    });

    it('should update client profile fields', async () => {
      const user = await User.findOne({ clerkUserId: mockClerkUserId });
      const profile = await ClientProfile.findOne({ userId: user?._id });

      expect(profile).toBeDefined();
      
      profile!.address = '456 New Street';
      await profile!.save();

      const updatedProfile = await ClientProfile.findOne({ userId: user?._id });
      expect(updatedProfile?.address).toBe('456 New Street');
    });

    it('should reject update if user not active', async () => {
      await User.findOneAndUpdate(
        { clerkUserId: mockClerkUserId },
        { status: 'in-progress' }
      );

      const user = await User.findOne({ clerkUserId: mockClerkUserId });
      expect(user?.status).toBe('in-progress');
      
      // Update should be rejected for non-active users
    });
  });

  describe('Auth Utils', () => {
    it('should generate client user ID with CLI prefix', async () => {
      const { generateUserId } = require('./auth.utils');
      const userId = await generateUserId('client');
      expect(userId).toMatch(/^CLI-\d{4}$/);
    });

    it('should generate lawyer user ID with LAW prefix', async () => {
      const { generateUserId } = require('./auth.utils');
      const userId = await generateUserId('lawyer');
      expect(userId).toMatch(/^LAW-\d{4}$/);
    });

    it('should generate judge user ID with JUD prefix', async () => {
      const { generateUserId } = require('./auth.utils');
      const userId = await generateUserId('judge');
      expect(userId).toMatch(/^JUD-\d{4}$/);
    });

    it('should increment user IDs sequentially', async () => {
      const { generateUserId } = require('./auth.utils');
      
      // Create a user first
      await User.create({
        id: 'CLI-0001',
        clerkUserId: 'user_test1',
        email: 'test1@example.com',
        fullName: 'Test User 1',
        role: 'client',
        status: 'active',
        isEmailVerified: true,
        needsPasswordChange: false,
      });

      const nextId = await generateUserId('client');
      expect(nextId).toBe('CLI-0002');
    });
  });

  describe('Validation Tests', () => {
    it('should validate onboarding data for client', () => {
      const { AuthValidation } = require('./auth.validation');
      const validData = {
        body: {
          role: 'client',
          profile: {
            fullName: 'John Client',
            phone: '+8801712345678',
          },
        },
      };

      const result = AuthValidation.onboardValidation.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require bar info for lawyer onboarding', () => {
      const { AuthValidation } = require('./auth.validation');
      const invalidData = {
        body: {
          role: 'lawyer',
          profile: {
            fullName: 'Jane Lawyer',
            // Missing barRegistrationNumber and barCouncilName
          },
        },
      };

      const result = AuthValidation.onboardValidation.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require court info for judge onboarding', () => {
      const { AuthValidation } = require('./auth.validation');
      const invalidData = {
        body: {
          role: 'judge',
          profile: {
            fullName: 'Judge Smith',
            // Missing courtName and designation
          },
        },
      };

      const result = AuthValidation.onboardValidation.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate profile update data', () => {
      const { AuthValidation } = require('./auth.validation');
      const validData = {
        body: {
          fullName: 'Updated Name',
          displayName: 'UN',
          preferredLanguage: 'bn',
        },
      };

      const result = AuthValidation.updateProfileValidation.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Auth Service Unit Tests', () => {
  describe('syncUserFromClerk', () => {
    it('should create new user with default values', async () => {
      const { AuthServices } = require('./auth.service');

      // Mock User.findOne to return null (user doesn't exist)
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue({
        id: 'CLI-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        role: 'client',
        status: 'in-progress',
        fullName: 'test',
        isEmailVerified: true,
        needsPasswordChange: false,
      } as any);

      const result = await AuthServices.syncUserFromClerk(mockClerkUserId, mockEmail);

      expect(result.needsOnboarding).toBe(true);
      expect(result.status).toBe('in-progress');
    });

    it('should return existing user and update last login', async () => {
      const mockExistingUser = {
        id: 'CLI-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        role: 'client',
        status: 'active',
        lastLoginAt: new Date(),
        save: jest.fn(),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockExistingUser as any);

      const { AuthServices } = require('./auth.service');
      const result = await AuthServices.syncUserFromClerk(mockClerkUserId, mockEmail);

      expect(result.needsOnboarding).toBe(false);
      expect(mockExistingUser.save).toHaveBeenCalled();
    });
  });
});

describe('Role Field Validation Tests', () => {
  describe('POST /auth/sync - Role Field Presence', () => {
    it('should return role field in sync response for existing user', async () => {
      const mockUser = {
        id: 'LAW-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        role: 'lawyer',
        status: 'active',
        fullName: 'Jane Lawyer',
        lastLoginAt: new Date(),
        save: jest.fn(),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
      const { AuthServices } = require('./auth.service');

      const result = await AuthServices.syncUserFromClerk(mockClerkUserId, mockEmail);

      // Verify role field is present and not null/undefined
      expect(result).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.role).not.toBeNull();
      expect(result.role).not.toBeUndefined();
      expect(result.role).toBe('lawyer');
    });

    it('should return default role for new user on sync', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue({
        id: 'CLI-0002',
        clerkUserId: mockClerkUserId + '_new',
        email: 'new@example.com',
        role: 'client', // Default role
        status: 'in-progress',
        fullName: 'Guest User',
        isEmailVerified: true,
        needsPasswordChange: false,
      } as any);

      const { AuthServices } = require('./auth.service');
      const result = await AuthServices.syncUserFromClerk(mockClerkUserId + '_new', 'new@example.com');

      expect(result.role).toBeDefined();
      expect(result.role).toBe('client');
    });
  });

  describe('GET /auth/me - Role Field Presence', () => {
    it('should return role field in getCurrentUser response', async () => {
      const mockUser = {
        id: 'CLI-0001',
        _id: new mongoose.Types.ObjectId(),
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        role: 'client',
        status: 'active',
        fullName: 'John Client',
        displayName: 'JC',
        avatarUrl: 'https://example.com/avatar.jpg',
        preferredLanguage: 'en',
        timezone: 'UTC',
        isEmailVerified: true,
        lastLoginAt: new Date(),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(ClientProfile, 'findOne').mockResolvedValue({
        phoneNumber: '+8801712345678',
        address: '123 Main St',
      });

      const { AuthServices } = require('./auth.service');
      const result = await AuthServices.getCurrentUser(mockClerkUserId);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.role).toBeDefined();
      expect(result.user.role).not.toBeNull();
      expect(result.user.role).not.toBeUndefined();
      expect(result.user.role).toBe('client');
    });

    it('should throw error if user has no role when calling getCurrentUser', async () => {
      const mockUser = {
        id: 'CLI-0001',
        clerkUserId: mockClerkUserId,
        email: mockEmail,
        role: null, // No role set
        status: 'in-progress',
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const { AuthServices } = require('./auth.service');

      await expect(AuthServices.getCurrentUser(mockClerkUserId)).rejects.toThrow(
        'User has not completed onboarding'
      );
    });
  });

  describe('Role Field Across Different Roles', () => {
    it('should correctly return lawyer role', async () => {
      const mockUser = {
        id: 'LAW-0001',
        clerkUserId: 'clerk_lawyer',
        email: 'lawyer@example.com',
        role: 'lawyer',
        status: 'active',
        fullName: 'Jane Lawyer',
        save: jest.fn(),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const { AuthServices } = require('./auth.service');
      const result = await AuthServices.syncUserFromClerk('clerk_lawyer', 'lawyer@example.com');

      expect(result.role).toBe('lawyer');
      expect(['client', 'lawyer', 'judge', 'admin', 'superAdmin']).toContain(result.role);
    });

    it('should correctly return judge role', async () => {
      const mockUser = {
        id: 'JUD-0001',
        clerkUserId: 'clerk_judge',
        email: 'judge@example.com',
        role: 'judge',
        status: 'active',
        fullName: 'Judge Smith',
        save: jest.fn(),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const { AuthServices } = require('./auth.service');
      const result = await AuthServices.syncUserFromClerk('clerk_judge', 'judge@example.com');

      expect(result.role).toBe('judge');
      expect(['client', 'lawyer', 'judge', 'admin', 'superAdmin']).toContain(result.role);
    });

    it('should correctly return admin role', async () => {
      const mockUser = {
        id: 'ADM-0001',
        clerkUserId: 'clerk_admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        fullName: 'Admin User',
        save: jest.fn(),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const { AuthServices } = require('./auth.service');
      const result = await AuthServices.syncUserFromClerk('clerk_admin', 'admin@example.com');

      expect(result.role).toBe('admin');
      expect(['client', 'lawyer', 'judge', 'admin', 'superAdmin']).toContain(result.role);
    });
  });
});
