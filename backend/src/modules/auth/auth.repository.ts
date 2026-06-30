import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { StudentProfile, StudentProfileDocument } from './schemas/student-profile.schema';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(StudentProfile.name) private readonly profileModel: Model<StudentProfileDocument>,
  ) {}

  async createUser(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async createProfile(data: Partial<StudentProfile>): Promise<StudentProfileDocument> {
    return this.profileModel.create(data);
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+passwordHash +refreshTokens +emailVerificationToken +passwordResetToken +passwordResetExpiry')
      .exec();
  }

  async findUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ userId, deletedAt: null })
      .exec();
  }

  async findUserByIdWithTokens(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ userId, deletedAt: null })
      .select('+refreshTokens')
      .exec();
  }

  async findUserByVerificationToken(tokenHash: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ emailVerificationToken: tokenHash, deletedAt: null })
      .select('+emailVerificationToken')
      .exec();
  }

  async findUserByResetToken(tokenHash: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: tokenHash,
        passwordResetExpiry: { $gt: new Date() },
        deletedAt: null,
      })
      .select('+passwordResetToken +passwordResetExpiry +refreshTokens')
      .exec();
  }

  async findProfileByStudentId(studentId: string): Promise<StudentProfileDocument | null> {
    return this.profileModel.findOne({ studentId }).exec();
  }

  async updateUser(userId: string, update: Partial<UserDocument>): Promise<void> {
    await this.userModel.updateOne({ userId }, { $set: update }).exec();
  }

  async pushRefreshToken(
    userId: string,
    entry: { tokenHash: string; expiresAt: Date; createdAt: Date },
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { userId },
        {
          $push: { refreshTokens: entry },
          // cap at 10 tokens (drop oldest if over limit)
        },
      )
      .exec();
    // Enforce max 10 tokens
    await this.userModel
      .updateOne({ userId }, {
        $push: {
          refreshTokens: {
            $each: [],
            $slice: -10,
          },
        },
      })
      .exec();
  }

  async removeRefreshToken(userId: string, tokenHash: string): Promise<void> {
    await this.userModel
      .updateOne({ userId }, { $pull: { refreshTokens: { tokenHash } } })
      .exec();
  }

  async clearAllRefreshTokens(userId: string): Promise<void> {
    await this.userModel
      .updateOne({ userId }, { $set: { refreshTokens: [] } })
      .exec();
  }

  async updateProfile(studentId: string, update: Partial<StudentProfile>): Promise<void> {
    await this.profileModel.updateOne({ studentId }, { $set: update }).exec();
  }

  async findUserByRefreshTokenHash(tokenHash: string, now: Date): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        deletedAt: null,
        refreshTokens: { $elemMatch: { tokenHash, expiresAt: { $gt: now } } },
      })
      .select('+refreshTokens')
      .exec();
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({
      email: email.toLowerCase(),
      deletedAt: null,
    });
    return count > 0;
  }
}
