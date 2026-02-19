import { BanRow } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { DatabaseService } from '@/infra/database/database.service'
import { BaseFirestoreRepository } from '@/infra/database/repositories/base-repository'
import { FirebaseService } from '@/infra/firebase'

@Injectable()
export class BanRepository extends BaseFirestoreRepository<BanRow> {
  protected logger = new Logger(BanRepository.name)

  constructor(firebaseService: FirebaseService, databaseService: DatabaseService) {
    super(firebaseService.firestore, databaseService, 'bans')
  }

  /**
   * Get all active bans for a specific user
   */
  async getActiveBansForUser(userId: string): Promise<BanRow | null> {
    const now = new Date()
    const query = this.collection
      .where('banned_user_id', '==', userId)
      .where('is_permanent', '==', true)
      .limit(1)

    const permanentSnapshot = await query.get()
    if (!permanentSnapshot.empty) {
      return permanentSnapshot.docs[0].data() as BanRow
    }

    // Check for active temporary bans
    const tempQuery = this.collection
      .where('banned_user_id', '==', userId)
      .where('is_permanent', '==', false)
      .where('expires_at', '>', now)
      .limit(1)

    const tempSnapshot = await tempQuery.get()
    if (!tempSnapshot.empty) {
      return tempSnapshot.docs[0].data() as BanRow
    }

    return null
  }

  /**
   * Get all bans for a user (including expired ones)
   */
  async getAllBansForUser(userId: string): Promise<BanRow[]> {
    const query = this.collection.where('banned_user_id', '==', userId)
    const snapshot = await query.get()

    return snapshot.docs.map((doc) => doc.data() as BanRow)
  }

  /**
   * Get all active bans (temporary and permanent)
   */
  async getAllActiveBans(): Promise<BanRow[]> {
    const now = new Date()

    // Get permanent bans
    const permanentQuery = this.collection.where('is_permanent', '==', true)
    const permanentSnapshot = await permanentQuery.get()
    const permanentBans = permanentSnapshot.docs.map((doc) => doc.data() as BanRow)

    // Get active temporary bans
    const tempQuery = this.collection
      .where('is_permanent', '==', false)
      .where('expires_at', '>', now)
    const tempSnapshot = await tempQuery.get()
    const tempBans = tempSnapshot.docs.map((doc) => doc.data() as BanRow)

    return [...permanentBans, ...tempBans]
  }

  /**
   * Ban a user (temporary or permanent)
   */
  async banUser(
    bannedUserId: string,
    bannedUserNickname: string,
    creatorId: string,
    isPermanent: boolean,
    reason: string,
    durationMs?: number
  ): Promise<string> {
    const expiresAt = !isPermanent && durationMs ? new Date(Date.now() + durationMs) : null

    const banRow: BanRow = {
      banned_user_id: bannedUserId,
      banned_user_nickname: bannedUserNickname,
      creator_id: creatorId,
      is_permanent: isPermanent,
      reason,
      banned_at: new Date(),
      expires_at: expiresAt,
    }

    const id = await this.create(banRow)
    this.logger.log(
      `User ${bannedUserId} banned by ${creatorId}. Permanent: ${isPermanent}, Expires: ${expiresAt}`
    )

    return id
  }

  /**
   * Unban a user (removes all bans)
   */
  async unbanUser(userId: string): Promise<void> {
    const query = this.collection.where('banned_user_id', '==', userId)
    const snapshot = await query.get()

    const batch = this.firestore.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    this.logger.log(`User ${userId} unbanned (removed ${snapshot.docs.length} ban records)`)
  }

  /**
   * Remove a specific ban record
   */
  async removeBan(banId: string): Promise<void> {
    await this.collection.doc(banId).delete()
    this.logger.log(`Ban record ${banId} removed`)
  }
}
