import { useNavigate } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ProfileSearch() {
  const [searchNickname, setSearchNickname] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = searchNickname.trim()
    if (trimmed) {
      navigate({
        to: '/users/$nickname',
        params: { nickname: trimmed.replaceAll(' ', '') },
      })
      setSearchNickname('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Section Title */}
      <h2 className="font-serif font-bold text-xl text-gold-3 uppercase tracking-wide border-b border-gold-5/50 pb-2">
        Find Player
      </h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter nickname..."
          value={searchNickname}
          onChange={(e) => setSearchNickname(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="primary" size="md" disabled={!searchNickname.trim()}>
          <FaSearch className="size-4" />
        </Button>
      </form>
    </div>
  )
}
