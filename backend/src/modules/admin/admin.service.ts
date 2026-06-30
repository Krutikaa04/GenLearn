import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../auth/schemas/user.schema';
import { StudentProgress, StudentProgressDocument } from '../analytics/schemas/progress.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(StudentProgress.name)
    private readonly progressModel: Model<StudentProgressDocument>,
  ) {}

  async listUsers(page: number, pageSize: number, status?: string) {
    const filter: Record<string, any> = { deletedAt: null };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('-passwordHash -refreshTokens -emailVerificationToken -passwordResetToken -passwordResetExpiry')
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: items.map((u) => this.serializeUser(u)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getUser(userId: string) {
    const user = await this.userModel
      .findOne({ userId, deletedAt: null })
      .select('-passwordHash -refreshTokens -emailVerificationToken -passwordResetToken -passwordResetExpiry')
      .exec();
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });

    const progress = await this.progressModel.findOne({ studentId: userId }).exec();

    return { ...this.serializeUser(user), progress: progress ?? null };
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const result = await this.userModel
      .updateOne({ userId, deletedAt: null }, { $set: { status } })
      .exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
  }

  async getPlatformStats() {
    const [totalUsers, activeUsers, suspendedUsers, unverifiedUsers] = await Promise.all([
      this.userModel.countDocuments({ deletedAt: null }),
      this.userModel.countDocuments({ status: UserStatus.ACTIVE, deletedAt: null }),
      this.userModel.countDocuments({ status: UserStatus.SUSPENDED, deletedAt: null }),
      this.userModel.countDocuments({ status: UserStatus.UNVERIFIED, deletedAt: null }),
    ]);

    const avgMastery = await this.progressModel.aggregate([
      { $group: { _id: null, avg: { $avg: '$overallMasteryScore' }, totalQuizzes: { $sum: '$totalQuizzesTaken' } } },
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers, unverified: unverifiedUsers },
      learning: {
        averageMasteryScore: avgMastery[0]?.avg ? Math.round(avgMastery[0].avg) : 0,
        totalQuizzesTaken: avgMastery[0]?.totalQuizzes ?? 0,
      },
    };
  }

  private serializeUser(user: UserDocument) {
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: (user as any).createdAt,
    };
  }
}
