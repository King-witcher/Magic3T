import { Injectable } from '@nestjs/common'
import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  WithFieldValue,
} from 'firebase-admin/firestore'

const epoch = new Date(2000, 7, 31).getTime()

// This sequence is inverted to make Firestore automatically sort matches by the latest.
const chars = 'zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA9876543210'.split('')

function convertToBase62(number: number) {
  let _number = number
  let result = ''
  while (_number) {
    result = chars[_number % chars.length] + result
    _number = Math.floor(_number / chars.length)
  }
  return result
}

@Injectable()
export class FirestoreService {
  private readonly nonceArray: string[]
  private nonce = 0

  constructor() {
    this.nonceArray = [...chars]

    let i = this.nonceArray.length - 1
    while (i--) {
      const rand = Math.floor(Math.random() * i)

      const temp = this.nonceArray[i]
      this.nonceArray[i] = this.nonceArray[rand]
      this.nonceArray[rand] = temp
    }
  }

  getDefaultConverter<T extends {}>(): FirestoreDataConverter<T, T> {
    // Convert all Timestamps from firebase to Date objects
    function convert(data: T) {
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof Timestamp) {
          data[key] = value.toDate()
        } else if (value instanceof Object) {
          convert(data[key])
        }
      }
    }

    return {
      fromFirestore(snap: QueryDocumentSnapshot<T>): T {
        const data = snap.data()
        convert(data)
        return data
      },

      toFirestore: (data: T): WithFieldValue<T> => {
        return data
      },
    }
  }

  /**
   * Gets a 6+ char time sortable unique id.
   */
  getTemporalId() {
    const lannaDate = Math.floor((Date.now() - epoch) / 1000)
    return convertToBase62(lannaDate) + this.nonceArray[this.nonce++ % this.nonceArray.length]
  }
}
