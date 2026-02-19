import { Global, Module } from '@nestjs/common'
import { FirestoreModule } from '@/infra/firestore'
import { RatingService } from './rating.service'

@Global()
@Module({
  imports: [FirestoreModule],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
