import { BanUserCommand, UnbanUserCommand } from '@magic3t/api-types'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDefined, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'

export class BanUserCommandClass implements BanUserCommand {
  @ApiProperty({
    description: 'The ID of the user to ban',
    example: 'user123',
  })
  @IsDefined()
  @IsString()
  userId: string

  @ApiProperty({
    description: 'Whether the ban is permanent (true) or temporary (false)',
    example: false,
  })
  @IsDefined()
  @IsBoolean()
  isPermanent: boolean

  @ApiProperty({
    description: 'Duration in milliseconds for temporary bans (7 days = 604800000)',
    example: 604800000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  durationMs?: number

  @ApiProperty({
    description: 'The reason for the ban',
    example: 'Abusive behavior towards other players',
  })
  @IsDefined()
  @IsString()
  @MinLength(5)
  reason: string
}

export class UnbanUserCommandClass implements UnbanUserCommand {
  @ApiProperty({
    description: 'The ID of the user to unban',
    example: 'user123',
  })
  @IsDefined()
  @IsString()
  userId: string
}
