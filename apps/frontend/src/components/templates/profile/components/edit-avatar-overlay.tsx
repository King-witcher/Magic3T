import { LuPencil } from 'react-icons/lu'

interface EditAvatarOverlayProps {
  onClick: () => void
}

export function EditAvatarOverlay({ onClick }: EditAvatarOverlayProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-0 z-10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer bg-hextech-black/60 group"
      aria-label="Change icon"
    >
      <LuPencil className="text-gold-2 size-8 drop-shadow-lg group-hover:scale-110 transition-transform duration-200" />
    </button>
  )
}
