import { Logger } from '@nestjs/common'
import {
  CollectionReference,
  Firestore,
  FirestoreDataConverter,
  UpdateData,
} from 'firebase-admin/firestore'
import { FirestoreService } from '@/infra/firestore/firestore.service'
import { GetResult, ListResult } from '../types'

/**
 * Encapsulates common Firestore operations for a specific collection.
 */
export abstract class BaseFirestoreRepository<T extends {}> {
  protected readonly logger = new Logger(BaseFirestoreRepository.name, {
    timestamp: true,
  })
  protected readonly converter: FirestoreDataConverter<T, T>
  protected readonly collection: CollectionReference<T, T>

  protected constructor(
    protected firestore: Firestore,
    private databaseService: FirestoreService,
    protected collectionName: string
  ) {
    this.converter = databaseService.getDefaultConverter<T>()
    this.collection = firestore.collection(collectionName).withConverter(this.converter)
  }

  /**
   * Gets a row by its id.
   */
  async getById(id: string): Promise<GetResult<T> | null> {
    const snapshot = await this.collection.doc(id).get()
    this.logger.verbose(`read "${id}" from ${this.collection.id}.`)
    const data = snapshot.data()
    if (data === undefined || !snapshot.exists) return null

    return {
      id: snapshot.id,
      createdAt: snapshot.createTime!.toDate(),
      updatedAt: snapshot.updateTime!.toDate(),
      data: data,
    }
  }

  /**
   * Lists all rows in the collection.
   */
  async listAll(): Promise<ListResult<T>> {
    const snapshot = await this.collection.get()
    this.logger.verbose(`read all ${snapshot.size} from ${this.collection.id}.`)
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        createdAt: doc.createTime!.toDate(),
        updatedAt: doc.updateTime!.toDate(),
        data: data,
      }
    })
  }

  /**
   * Generate a new id and store the doc in Firestore. Returns the id set in Firestore.
   * @param doc Document to be created.
   */
  async create(doc: T): Promise<string> {
    const id = this.databaseService.getTemporalId()
    await this.collection.doc(id).set(doc)
    this.logger.verbose(`create "${id}" on ${this.collection.id}.`)
    return id
  }

  /**
   * Save the document in Firestore in the corresponding id.
   */
  async set(id: string, doc: T) {
    await this.collection.doc(id).set(doc)
    this.logger.verbose(`update "${id}" on ${this.collection.id}.`)
  }

  // TODO: UpdateData here breaks encapsulation over Firestore
  /**
   * Update a document in Firestore.
   */
  async update(id: string, updateData: UpdateData<T>) {
    await this.collection.doc(id).update(updateData)
    this.logger.verbose(`update "${id}" on ${this.collection.id}.`)
  }
}
