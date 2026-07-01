import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UserStatus } from '../auth/schemas/user.schema';

// Helper that builds a fake Mongoose query chain ending in .exec()
const makeQuery = (resolveWith: any) => {
  const exec = jest.fn().mockResolvedValue(resolveWith);
  const chain: any = { exec, find: undefined, sort: undefined, skip: undefined, limit: undefined, select: undefined };
  chain.sort   = jest.fn().mockReturnValue(chain);
  chain.skip   = jest.fn().mockReturnValue(chain);
  chain.limit  = jest.fn().mockReturnValue(chain);
  chain.select = jest.fn().mockReturnValue(chain);
  return chain;
};

const makeUser = (overrides: Partial<any> = {}) => ({
  userId: 'user-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'student',
  status: UserStatus.ACTIVE,
  emailVerified: true,
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

describe('AdminService', () => {
  let service: AdminService;
  let userModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    countDocuments: jest.Mock;
    updateOne: jest.Mock;
  };
  let progressModel: {
    findOne: jest.Mock;
    aggregate: jest.Mock;
  };

  beforeEach(() => {
    userModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      updateOne: jest.fn(),
    };
    progressModel = {
      findOne: jest.fn(),
      aggregate: jest.fn(),
    };
    service = new AdminService(userModel as any, progressModel as any);
  });

  // ─── listUsers ────────────────────────────────────────────────────────────────

  describe('listUsers', () => {
    it('returns paginated users and meta', async () => {
      const users = [makeUser()];
      userModel.find.mockReturnValue(makeQuery(users));
      userModel.countDocuments.mockResolvedValue(1);

      const result = await service.listUsers(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toMatchObject({ page: 1, total: 1 });
    });

    it('passes the status filter to countDocuments and find when provided', async () => {
      userModel.find.mockReturnValue(makeQuery([]));
      userModel.countDocuments.mockResolvedValue(0);

      await service.listUsers(1, 20, 'active');

      expect(userModel.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
      expect(userModel.countDocuments).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('serializes users without sensitive fields', async () => {
      const user = makeUser({ passwordHash: 'secret', refreshTokens: [] });
      userModel.find.mockReturnValue(makeQuery([user]));
      userModel.countDocuments.mockResolvedValue(1);

      const result = await service.listUsers(1, 20);

      expect((result.data[0] as any).passwordHash).toBeUndefined();
      expect((result.data[0] as any).refreshTokens).toBeUndefined();
    });
  });

  // ─── getUser ──────────────────────────────────────────────────────────────────

  describe('getUser', () => {
    it('returns the user with their progress record', async () => {
      userModel.findOne.mockReturnValue(makeQuery(makeUser()));
      progressModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ totalQuizzesTaken: 5 }) });

      const result = await service.getUser('user-1');

      expect(result.userId).toBe('user-1');
      expect((result as any).progress).toMatchObject({ totalQuizzesTaken: 5 });
    });

    it('throws NotFoundException when user does not exist', async () => {
      userModel.findOne.mockReturnValue(makeQuery(null));

      await expect(service.getUser('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns null progress when no progress record exists', async () => {
      userModel.findOne.mockReturnValue(makeQuery(makeUser()));
      progressModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const result = await service.getUser('user-1');

      expect((result as any).progress).toBeNull();
    });
  });

  // ─── updateUserStatus ─────────────────────────────────────────────────────────

  describe('updateUserStatus', () => {
    it('calls updateOne with the correct status', async () => {
      userModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ matchedCount: 1 }) });

      await service.updateUserStatus('user-1', UserStatus.SUSPENDED);

      expect(userModel.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        { $set: { status: UserStatus.SUSPENDED } },
      );
    });

    it('throws NotFoundException when no matching user is found', async () => {
      userModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ matchedCount: 0 }) });

      await expect(service.updateUserStatus('ghost', UserStatus.ACTIVE)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getPlatformStats ─────────────────────────────────────────────────────────

  describe('getPlatformStats', () => {
    it('returns user counts and learning stats', async () => {
      userModel.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // active
        .mockResolvedValueOnce(5)   // suspended
        .mockResolvedValueOnce(15); // unverified
      progressModel.aggregate.mockResolvedValue([{ avg: 72.5, totalQuizzes: 300 }]);

      const result = await service.getPlatformStats();

      expect(result.users).toEqual({ total: 100, active: 80, suspended: 5, unverified: 15 });
      expect(result.learning.averageMasteryScore).toBe(73);
      expect(result.learning.totalQuizzesTaken).toBe(300);
    });

    it('returns zero mastery score when no progress data exists', async () => {
      userModel.countDocuments.mockResolvedValue(0);
      progressModel.aggregate.mockResolvedValue([]);

      const result = await service.getPlatformStats();

      expect(result.learning.averageMasteryScore).toBe(0);
      expect(result.learning.totalQuizzesTaken).toBe(0);
    });
  });
});
