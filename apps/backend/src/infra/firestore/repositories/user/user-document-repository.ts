import { UserDocument } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { FirebaseService } from '@/infra/firebase/firebase.service'
import { FirestoreService } from '@/infra/firestore/firestore.service'
import { ListResult } from '../../types/query-types'
import { BaseFirestoreRepository } from '../base-repository'

@Injectable()
export class UserDocumentRepository extends BaseFirestoreRepository<UserDocument> {
  constructor(databaseService: FirestoreService, firebaseService: FirebaseService) {
    super(firebaseService.firestore, databaseService, 'users')
  }

  async getAll(): Promise<ListResult<UserDocument>> {
    const snapshot = await this.collection.get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        createdAt: doc.createTime.toDate(),
        updatedAt: doc.updateTime.toDate(),
        data: data,
      }
    })
  }
}
