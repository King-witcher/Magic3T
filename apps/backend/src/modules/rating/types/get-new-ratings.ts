export type GetNewRatingsParams = {
  first: {
    rating: number
    k: number
    challenger: boolean
  }
  second: {
    rating: number
    k: number
    challenger: boolean
  }
  scoreOfFirst: number
}

export type GetNewRatingsResult = {
  first: {
    rating: number
    k: number
    challenger: boolean
  }
  second: {
    rating: number
    k: number
    challenger: boolean
  }
}
