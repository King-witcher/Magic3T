import { BanType } from '@magic3t/database-types'
import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsDefined, IsEnum, IsOptional, IsString } from 'class-validator'

export class BanUserCommand {
  @ApiProperty({ enum: ['temporary', 'permanent'] })
  @IsDefined()
  @IsEnum(['temporary', 'permanent'])
  type: BanType

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string

  @ApiProperty({ required: false, description: 'Expiration date for temporary bans (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
