import { Admin } from '@magic3t/api-types'
import { useState } from 'react'
import { IoArrowDown, IoArrowUp, IoChevronDown, IoSwapVertical } from 'react-icons/io5'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const SORT_OPTIONS: { value: Admin.ListUsersSort; label: string }[] = [
  { value: 'nickname', label: 'Ordem alfabética' },
  { value: 'createdAt', label: 'Data de criação' },
  { value: 'elo', label: 'Elo' },
]

const SORT_LABELS: Record<Admin.ListUsersSort, string> = {
  nickname: 'Alfabética',
  createdAt: 'Criação',
  elo: 'Elo',
}

interface Props {
  sort: Admin.ListUsersSort
  order: Admin.ListUsersOrder
  onSortChange: (sort: Admin.ListUsersSort) => void
  onOrderChange: (order: Admin.ListUsersOrder) => void
}

export function SortControl({ sort, order, onSortChange, onOrderChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 px-4 h-11 rounded',
              'bg-hextech-black/80 border-2 border-gold-6/50',
              'text-gold-2 font-serif text-sm uppercase tracking-wider',
              'hover:border-gold-4/70 hover:text-gold-1 transition-colors',
              'focus:outline-none focus:border-gold-4'
            )}
          >
            <IoSwapVertical className="size-4 text-gold-4" />
            <span className="hidden sm:inline text-grey-1">Ordenar:</span>
            <span>{SORT_LABELS[sort]}</span>
            <IoChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSortChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2 rounded text-left',
                'font-serif text-sm transition-colors',
                'hover:bg-blue-4/20',
                sort === option.value ? 'text-gold-1 bg-gold-6/15' : 'text-gold-3'
              )}
            >
              {option.label}
              {sort === option.value && <span className="text-gold-4">●</span>}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Tooltip text={order === 'asc' ? 'Crescente' : 'Decrescente'}>
        <button
          type="button"
          onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
          className={cn(
            'flex items-center justify-center size-11 shrink-0 rounded',
            'bg-hextech-black/80 border-2 border-gold-6/50',
            'text-gold-3 hover:text-gold-1 hover:border-gold-4/70 transition-colors',
            'focus:outline-none focus:border-gold-4'
          )}
        >
          {order === 'asc' ? <IoArrowUp className="size-5" /> : <IoArrowDown className="size-5" />}
        </button>
      </Tooltip>
    </div>
  )
}
