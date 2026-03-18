import { Timer } from './timer'

describe(Timer, () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call the callback after the specified duration', () => {
    const mock = vi.fn()
    const timer = new Timer(1000, mock)
    timer.start()

    expect(mock).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(1000)
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it('should not call the callback if paused', () => {
    const mock = vi.fn()
    const timer = new Timer(1000, mock)
    timer.start()
    timer.pause()

    expect(mock).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(2000)
    expect(mock).toHaveBeenCalledTimes(0)
  })

  it('should update the remaining time correctly', () => {
    const mock = vi.fn()
    const timer = new Timer(1000, mock)
    timer.start()

    expect(timer.remaining).toBe(1000)
    vi.advanceTimersByTime(500)
    expect(timer.remaining).toBe(500)
  })

  it('should dispatch timeout event when time is up', () => {
    const mock = vi.fn()
    const timer = new Timer(1000, mock)
    timer.on('timeout', () => {})
    timer.start()

    expect(mock).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(1000)
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
