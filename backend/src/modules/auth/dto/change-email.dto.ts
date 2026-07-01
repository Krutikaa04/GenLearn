import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ example: 'new-address@example.com' })
  @IsEmail()
  newEmail: string;
}
