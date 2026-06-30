import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from '../../auth/schemas/user.schema';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: [UserStatus.ACTIVE, UserStatus.SUSPENDED] })
  @IsEnum([UserStatus.ACTIVE, UserStatus.SUSPENDED])
  status: UserStatus.ACTIVE | UserStatus.SUSPENDED;
}
