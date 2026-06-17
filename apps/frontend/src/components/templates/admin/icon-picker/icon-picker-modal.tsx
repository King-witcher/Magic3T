import { useEffect, useMemo, useState } from 'react'
import { IoCheckmarkCircle, IoSearch } from 'react-icons/io5'
import { Spinner } from '@/components/atoms/spinner'
import { Button, Input } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClientQuery } from '@/hooks/use-client-query'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { apiClient } from '@/services/clients/api-client'
import { getGameIconUrl } from '@/utils/utils'
import { IconCard } from './icon-card'

const INITIAL_VISIBLE = 60
const LOAD_STEP = 60

interface IconPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentIcon: number
  ownedIcons: number[]
  onSelect: (iconId: number) => void
}

export function IconPickerModal({
  open,
  onOpenChange,
  currentIcon,
  ownedIcons,
  onSelect,
}: IconPickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {open && (
          <IconPickerModalInner
            currentIcon={currentIcon}
            ownedIcons={ownedIcons}
            onSelect={onSelect}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface InnerProps {
  currentIcon: number
  ownedIcons: number[]
  onSelect: (iconId: number) => void
  onClose: () => void
}

function IconPickerModalInner({ currentIcon, ownedIcons, onSelect, onClose }: InnerProps) {
  const iconsQuery = useClientQuery(apiClient.admin, 'listIcons', undefined, {
    staleTime: 60 * 60 * 1000, // 1 hour — the catalogue is effectively static.
  })

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(currentIcon)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  const ownedSet = useMemo(() => new Set(ownedIcons), [ownedIcons])

  const filtered = useMemo(() => {
    const icons = iconsQuery.data?.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return icons
    return icons.filter(
      (icon) => icon.title.toLowerCase().includes(term) || String(icon.id) === term
    )
  }, [iconsQuery.data, search])

  // Reset the rendered window whenever the filter changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: window resets on search change
  useEffect(() => setVisibleCount(INITIAL_VISIBLE), [search])

  const visibleIcons = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const { lastElementRef } = useInfiniteScroll(
    async () => setVisibleCount((count) => count + LOAD_STEP),
    hasMore
  )

  const hasChanged = selected !== currentIcon

  function handleConfirm() {
    if (!hasChanged) return
    onSelect(selected)
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar ícone</DialogTitle>
        <DialogDescription>
          Escolha um ícone de invocador. Ícones com{' '}
          <IoCheckmarkCircle className="inline size-4 text-green-400 align-text-bottom" /> já
          pertencem ao usuário.
        </DialogDescription>
      </DialogHeader>

      {/* Preview + search */}
      <div className="flex items-center gap-4">
        <img
          src={getGameIconUrl(selected)}
          alt="Ícone selecionado"
          className="size-16 shrink-0 rounded-full border-2 border-gold-4/60 shadow-lg shadow-gold-5/30"
        />
        <div className="relative flex-1">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-grey-1/70 pointer-events-none" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar ícone por nome ou ID..."
            className="pl-10 h-11 py-0"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="h-[55vh] sm:h-96 overflow-y-auto -mr-2 pr-2">
        {iconsQuery.isError ? (
          <div className="flex justify-center py-16">
            <span className="text-red-400 text-sm font-serif">Falha ao carregar os ícones.</span>
          </div>
        ) : iconsQuery.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-9" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-grey-1 font-serif">Nenhum ícone encontrado.</div>
        ) : (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {visibleIcons.map((icon) => (
              <IconCard
                key={icon.id}
                icon={icon}
                isSelected={icon.id === selected}
                isOwned={ownedSet.has(icon.id)}
                onSelect={setSelected}
              />
            ))}
            {hasMore && (
              <div ref={lastElementRef} className="col-span-full flex justify-center py-4">
                <Spinner className="size-6" />
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!hasChanged}>
          Selecionar
        </Button>
      </DialogFooter>
    </>
  )
}
