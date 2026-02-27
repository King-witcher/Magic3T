export type WithId<T extends string = string> = {
  /** Temporary id field that points to original document id. This field only exists locally and is not saved on Firestore. */
  _id: T
}
