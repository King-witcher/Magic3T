import { BanUserCommand } from '@magic3t/api-types'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDefined, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class BanUserCommandClass implements BanUserCommand {
  @IsDefined()
  @IsString()
  @ApiProperty({
    type: 'string',
    description: 'The reason for the ban',
  })
  reason: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({
    type: 'number',
    description: 'Duration of the ban in seconds. If not provided or null, the ban is permanent.',
    nullable: true,
  })
  duration?: number | null
}
