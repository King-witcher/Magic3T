import { EventNames, EventParams, EventsMap } from '@socket.io/component-emitter'

export type GatewayResponse<
  EmitEventsMap extends EventsMap,
  Event extends EventNames<EmitEventsMap>,
> = {
  event: Event
  data: EventParams<EmitEventsMap, Event>
}
