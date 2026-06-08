import { faker } from '@faker-js/faker'
import { Choice } from '@magic3t/common-types'
import { delay } from '@/common'
import { Match, MatchClassEventType } from './match'

function createMatch(): Match {
  return new Match({
    timelimit: 400,
  })
}

describe(Match, () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have turn = order after start', () => {
    const match = createMatch()
    match.start()

    expect(match.turn).toBe('order')
  })

  it.skip('should handle properly when someone wins the match by Magic3T tuple', () => {
    const mock = vi.fn()
    const match = createMatch()
    match.on(MatchClassEventType.Finish, mock)
    match.start()

    match.handleChoice('order', 5)
    match.handleChoice('chaos', 7)
    match.handleChoice('order', 1)
    match.handleChoice('chaos', 8)

    expect(mock).toHaveBeenCalledTimes(0)

    match.handleChoice('order', 9)

    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(match, 'order')
    expect(match.winner).toBe('order')
    expect(match.finished).toBe(true)
    expect(match.turn).toBeNull()
    expect(match.getFinalScore('order')).toBe(1)
    expect(match.getFinalScore('chaos')).toBe(0)
  })

  it.skip('should handle properly when the match draws', async () => {
    vi.useRealTimers()
    const mock = vi.fn()
    const match = createMatch()
    match.on(MatchClassEventType.Finish, mock)
    match.start()

    match.handleChoice('order', 2)
    await delay(10)
    match.handleChoice('chaos', 5)
    await delay(10)
    match.handleChoice('order', 8)
    match.handleChoice('chaos', 7)
    match.handleChoice('order', 3)
    match.handleChoice('chaos', 4)
    match.handleChoice('order', 6)
    match.handleChoice('chaos', 1)
    match.handleChoice('order', 9)

    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(match, null)
    expect(match.winner).toBe(null)
    expect(match.finished).toBe(true)
    expect(match.turn).toBeNull()
    expect(match.getFinalScore('order')).toBeLessThan(0.7)
    expect(match.getFinalScore('chaos')).toBeLessThan(0.7)
    expect(match.getFinalScore('order')).toBeGreaterThan(0.3)
    expect(match.getFinalScore('chaos')).toBeGreaterThan(0.3)
  })

  describe('start', () => {
    it('should dispatch a start event', () => {
      const mock = vi.fn()
      const match = createMatch()
      match.on(MatchClassEventType.Start, mock)

      match.start()

      expect(mock).toHaveBeenCalledTimes(1)
    })

    it('should throw if called twice', () => {
      const match = createMatch()
      match.start()

      expect(() => match.start()).toThrowError('panic: called start() twice')
    })
  })

  describe('handleChoice', () => {
    it.fails("should fail if it is not the team's turn", () => {
      const match = createMatch()
      match.start()

      match.handleChoice('chaos', 4)
    })

    it('should dispatch a choice event', () => {
      const mock = vi.fn()
      const match = createMatch()
      match.on(MatchClassEventType.Choice, mock)
      match.start()
      const choice = faker.number.int({ min: 1, max: 9 }) as Choice

      match.handleChoice('order', choice)

      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith('order', choice, expect.any(Number))
    })

    it('should switch turns after a choice', () => {
      const match = createMatch()
      match.start()

      const choice = faker.number.int({ min: 1, max: 9 }) as Choice
      match.handleChoice('order', choice)

      expect(match.turn).toBe('chaos')
    })
  })
})
