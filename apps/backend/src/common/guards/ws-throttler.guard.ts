import { Injectable } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler'
import { Socket } from 'socket.io'
import { unexpected } from '../errors'

/**
 * Guard de throttling para WebSockets.
 *
 * Implementa controle de taxa (rate limiting) para conexões WebSocket.
 * Quando um cliente ultrapassa o limite configurado, é bloqueado temporariamente.
 *
 * @extends ThrottlerGuard
 */
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } = requestProps

    const ctxType = context.getType<'ws' | 'http'>()

    // Extrai o cliente WebSocket do contexto
    const client = context.switchToWs().getClient<Socket>()

    if (ctxType !== 'ws') return true

    // Obtém o endereço IP remoto do socket para identificar o cliente
    const tracker = client.handshake.address
    if (!tracker) {
      unexpected('message should have a remote address')
    }

    // Gera uma chave única para armazenar o contador de requisições deste cliente
    const key = generateKey(context, tracker, throttler.name || 'default')

    // Incrementa o contador de requisições e obtém informações sobre o estado atual do throttling
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name || 'default'
      )

    // Verifica se o cliente foi bloqueado por exceder o limite de requisições
    if (isBlocked) {
      console.warn(`Client ${tracker} is blocked for throttling. Key: ${key}`)
      // Lança uma exceção de throttling com detalhes sobre o bloqueio
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      })
    }

    // Permite que a requisição prossiga se não foi bloqueado
    return true
  }
}
