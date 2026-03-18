import { faker } from '@faker-js/faker'
import { Channel } from './channel'

describe(Channel, () => {
  it('should send and receive messages', async () => {
    const channel = new Channel<string>()
    const message = faker.lorem.sentence()

    channel.send(message)
    const result = await channel.receive()

    expect(result).toBe(message)
  })

  it('should queue receivers when there are no messages', async () => {
    const channel = new Channel<string>()
    const message = faker.lorem.sentence()

    const result = channel.receive()
    channel.send(message)

    expect(await result).toBe(message)
  })

  it('should respect FIFO for multiple receivers', async () => {
    const channel = new Channel<string>()
    const message1 = faker.lorem.sentence()
    const message2 = faker.lorem.sentence()
    const result1 = channel.receive()
    const result2 = channel.receive()

    channel.send(message1)
    channel.send(message2)

    expect(await result2).toBe(message2)
    expect(await result1).toBe(message1)
  })
})
