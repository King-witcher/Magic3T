import { ApiProperty } from '@nestjs/swagger'

export class GetMatchesQuery {
  @ApiProperty({
    description: 'The user ID to filter matches by',
    type: 'string',
    nullable: true,
  })
  userId?: string

  @ApiProperty({
    description: 'The cursor for pagination. If cursor is provided, userId will be ignored.',
    type: 'string',
    nullable: true,
  })
  cursor?: string
}
