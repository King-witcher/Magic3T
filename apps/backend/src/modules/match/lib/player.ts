import { Choice } from '@magic3t/common-types'
import { Timer } from '@/common'

export class Player {
  choices: Choice[] = []
  timer: Timer
  surrender = false

  constructor(timelimit: number, onTimeout: () => void) {
    this.timer = new Timer(timelimit, onTimeout)
  }

  public get count() {
    return this.choices.length
  }
}
