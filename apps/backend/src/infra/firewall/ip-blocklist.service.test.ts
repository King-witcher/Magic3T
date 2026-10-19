import { faker } from '@faker-js/faker'
import {
  BAN_DURATION,
  IpBlocklistService,
  STRIKE_THRESHOLD,
  STRIKE_WINDOW,
} from './ip-blocklist.service'

describe(IpBlocklistService, () => {
  let blocklist: IpBlocklistService
  let ip: string

  beforeEach(() => {
    vi.useFakeTimers()
    blocklist = new IpBlocklistService()
    ip = faker.internet.ip()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should ban an IP until the ban expires', () => {
    blocklist.ban(ip, 'test')
    expect(blocklist.isBanned(ip)).toBe(true)

    vi.advanceTimersByTime(BAN_DURATION + 1)
    expect(blocklist.isBanned(ip)).toBe(false)
  })

  it('should ban an IP after too many distinct nonexistent paths', () => {
    for (let i = 1; i < STRIKE_THRESHOLD; i++) blocklist.strike(ip, `/path-${i}`)
    expect(blocklist.isBanned(ip)).toBe(false)

    blocklist.strike(ip, '/one-too-many')
    expect(blocklist.isBanned(ip)).toBe(true)
  })

  it('should not ban an IP that keeps requesting the same path', () => {
    for (let i = 0; i < STRIKE_THRESHOLD * 2; i++) blocklist.strike(ip, '/removed-endpoint')
    expect(blocklist.isBanned(ip)).toBe(false)
  })

  it('should forget strikes after the strike window', () => {
    for (let i = 1; i < STRIKE_THRESHOLD; i++) blocklist.strike(ip, `/path-${i}`)

    vi.advanceTimersByTime(STRIKE_WINDOW + 1)
    blocklist.strike(ip, '/one-too-many')
    expect(blocklist.isBanned(ip)).toBe(false)
  })
})
