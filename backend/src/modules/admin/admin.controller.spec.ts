import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserStatus } from '../auth/schemas/user.schema';

const mockStats = {
  users: { total: 100, active: 80, suspended: 10, unverified: 10 },
  learning: { averageMasteryScore: 70, totalQuizzesTaken: 500 },
};

const mockUserList = {
  data: [{ userId: 'u1', firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com' }],
  total: 1,
  meta: { page: 1, pageSize: 20, total: 1 },
};

const mockUserDetail = {
  userId: 'u1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@test.com',
  progress: null,
};

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getPlatformStats: jest.fn(),
            listUsers: jest.fn(),
            getUser: jest.fn(),
            updateUserStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AdminController);
    service = module.get(AdminService) as jest.Mocked<AdminService>;
  });

  describe('getStats', () => {
    it('returns platform stats wrapped in data', async () => {
      service.getPlatformStats.mockResolvedValue(mockStats);
      const result = await controller.getStats();
      expect(result).toEqual({ data: mockStats });
      expect(service.getPlatformStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('listUsers', () => {
    it('delegates to service with page and pageSize', async () => {
      service.listUsers.mockResolvedValue(mockUserList as any);
      const result = await controller.listUsers(2, 10, undefined);
      expect(service.listUsers).toHaveBeenCalledWith(2, 10, undefined);
      expect(result).toBe(mockUserList);
    });

    it('caps pageSize at 100', async () => {
      service.listUsers.mockResolvedValue(mockUserList as any);
      await controller.listUsers(1, 200, undefined);
      expect(service.listUsers).toHaveBeenCalledWith(1, 100, undefined);
    });

    it('passes status filter to service', async () => {
      service.listUsers.mockResolvedValue(mockUserList as any);
      await controller.listUsers(1, 20, 'active');
      expect(service.listUsers).toHaveBeenCalledWith(1, 20, 'active');
    });
  });

  describe('getUser', () => {
    it('returns user wrapped in data', async () => {
      service.getUser.mockResolvedValue(mockUserDetail as any);
      const result = await controller.getUser('u1');
      expect(result).toEqual({ data: mockUserDetail });
      expect(service.getUser).toHaveBeenCalledWith('u1');
    });

    it('propagates NotFoundException from service', async () => {
      service.getUser.mockRejectedValue(new NotFoundException());
      await expect(controller.getUser('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserStatus', () => {
    it('calls service with userId and status, returns void', async () => {
      service.updateUserStatus.mockResolvedValue(undefined as any);
      const dto = { status: UserStatus.SUSPENDED };
      const result = await controller.updateUserStatus('u1', dto as any);
      expect(service.updateUserStatus).toHaveBeenCalledWith('u1', UserStatus.SUSPENDED);
      expect(result).toBeUndefined();
    });

    it('propagates NotFoundException when user not found', async () => {
      service.updateUserStatus.mockRejectedValue(new NotFoundException());
      await expect(
        controller.updateUserStatus('ghost', { status: UserStatus.ACTIVE } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
