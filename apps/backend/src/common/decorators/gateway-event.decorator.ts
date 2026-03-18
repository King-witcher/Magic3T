import { OnEvent } from '@nestjs/event-emitter'
import { NAMESPACE_METADATA } from '@nestjs/websockets/constants'
import { unexpected } from '../errors'

/**
 * Decorator that automatically applies @OnEvent with the namespace prefix
 * Reads the namespace from the @WebSocketGateway decorator on the class
 * Usage: @GatewayEvent('userMatched')
 * Result: @OnEvent('queue.userMatched') if class namespace is 'queue'
 */
export const GatewayEvent = (eventName: string): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    descriptor: PropertyDescriptor
  ) => {
    // Get the namespace from the class metadata
    const namespace = Reflect.getMetadata(NAMESPACE_METADATA, target.constructor) as
      | string
      | undefined

    if (!propertyKey) {
      unexpected(`@GatewayEvent can only be applied to methods.`)
    }

    if (!namespace) {
      unexpected(
        `@GatewayEvent requires the class to be decorated with @WebSocketGateway. ` +
          `Event name: "${String(propertyKey)}"`
      )
    }

    // Combine namespace with event name
    const fullEventName = `${namespace}.${eventName}`

    // Apply @OnEvent with the full event name
    OnEvent(fullEventName)(target, propertyKey, descriptor)

    return descriptor
  }
}
