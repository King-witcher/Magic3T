import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { useClientQuery } from '@/hooks/use-client-query'
import { cvars, SystemCvarId } from '@/lib/console'
import { apiClient } from '@/services/clients/api-client'

export enum ServerStatus {
  Off = 0,
  Loading = 1,
  On = 2,
}

interface ServiceStatusData {
  serverStatus: ServerStatus
}

interface Props {
  children?: ReactNode
}

const ServiceStatusContext = createContext<ServiceStatusData>({
  serverStatus: ServerStatus.Off,
})

export function ServiceStatusProvider({ children }: Props) {
  const pollRate = cvars.useNumber(SystemCvarId.ClStatusPoll)
  const statusQuery = useClientQuery(apiClient, 'getStatus', undefined, {
    refetchInterval: pollRate,
  })

  const serverStatus =
    statusQuery.data?.status === 'available'
      ? ServerStatus.On
      : statusQuery.isFetching
        ? ServerStatus.Loading
        : ServerStatus.Off

  // useEffect(() => {
  //   switch (serverStatus) {
  //     case ServerStatus.Off:
  //       return push({
  //         content: <IoCloudOffline size="16px" />,
  //         tooltip: 'Servidor de jogo inativo',
  //       })
  //     case ServerStatus.Loading:
  //       return push({
  //         content: <IoMoon size="16px" />,
  //         tooltip:
  //           'O servidor de jogo pegou no sono. Aguarde por cerca de três minutos enquanto ele toma um café.',
  //       })
  //     case ServerStatus.On:
  //       return push({
  //         content: <IoCloud size="16px" />,
  //         tooltip: 'Servidor de jogo ativo',
  //       })
  //   }
  // }, [serverStatus])

  const value = useMemo(() => {
    return {
      serverStatus,
    }
  }, [serverStatus])

  return <ServiceStatusContext.Provider value={value}>{children}</ServiceStatusContext.Provider>
}

export const useServiceStatus = () => useContext(ServiceStatusContext)
