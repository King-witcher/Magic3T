import { Injectable } from '@nestjs/common'
import { Namespace } from 'socket.io'
import { unexpected } from '@/common'
import { NamespacesMap } from '@/shared/websocket/namespaces-map'

@Injectable()
export class WebsocketCountingService {
  private namespaces: Map<keyof NamespacesMap, Namespace> = new Map()

  countUsers(ns: keyof NamespacesMap): number {
    const namespace = this.namespaces.get(ns)
    if (!namespace) unexpected(`WebsocketCountingService server not set for namespace ${ns}.`)
    const rooms = namespace.adapter.rooms
    return rooms.size
  }

  setServer(ns: keyof NamespacesMap, namespace: Namespace) {
    if (this.namespaces.has(ns))
      unexpected(`WebsocketCountingService server already set for namespace ${ns}.`)
    this.namespaces.set(ns, namespace)
  }
}
