import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  UNVERIFIED = 'unverified',
}

export interface RefreshTokenEntry {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ enum: UserStatus, default: UserStatus.UNVERIFIED })
  status: UserStatus;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: null, select: false })
  emailVerificationToken: string | null;

  @Prop({ default: null, select: false })
  passwordResetToken: string | null;

  @Prop({ default: null, select: false })
  passwordResetExpiry: Date | null;

  @Prop({
    type: [
      {
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, required: true },
      },
    ],
    default: [],
    select: false,
  })
  refreshTokens: RefreshTokenEntry[];

  @Prop({ default: null })
  deletedAt: Date | null;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ userId: 1 }, { unique: true });
UserSchema.index({ status: 1 });
UserSchema.index({ deletedAt: 1 });
