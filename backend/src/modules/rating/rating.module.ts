import { Global, Module } from '@nestjs/common'
import { FirestoreModule } from '@/infra/firestore'

@Global()
@Module({
  imports: [FirestoreModule],
  providers: [],
  exports: [],
})
export class RatingModule {}
