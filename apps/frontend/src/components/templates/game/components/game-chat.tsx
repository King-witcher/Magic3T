import { Send } from 'lucide-react'
import type { RefObject } from 'react'
import { cn } from '@/lib/utils'
import { formatMinutes } from '@/utils/timeFormat'
import { useChatHandler } from '../hooks/useChatHandler'

interface GameChatProps {
  inputRef: RefObject<HTMLInputElement | null>
  className?: string
}

export function GameChat({ inputRef, className }: GameChatProps) {
  const { messages, scrollRef, handleSubmitMessage, handleChangeMessageField, currentMessage } =
    useChatHandler()

  return (
    <div
      className={cn(
        'flex flex-col w-full max-w-md',
        'backdrop-blur-md rounded-lg overflow-hidden',
        'border-2 border-gold-5/30',
        'bg-linear-to-b from-grey-3/80 to-grey-2/80',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gold-5/30 bg-grey-3/50">
        <h3 className="font-serif font-semibold text-gold-2 uppercase tracking-wide text-sm">
          Match Chat
        </h3>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-auto min-h-0" ref={scrollRef}>
        <div className="flex flex-col-reverse justify-end min-h-full p-4 gap-3">
          {messages.length === 0 ? (
            <p className="text-center text-grey-1 text-sm italic">No messages yet</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.time}
                className={cn(
                  'max-w-[80%] px-4 py-2 rounded-lg',
                  message.sender === 'you'
                    ? 'self-end bg-blue-600/30 border border-blue-400/30 text-blue-100'
                    : 'self-start bg-red-600/30 border border-red-400/30 text-red-100'
                )}
              >
                <p className="text-sm leading-relaxed">{message.message}</p>
                <span className="text-[0.65rem] opacity-60 mt-1 block">
                  {formatMinutes(message.time)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmitMessage} className="border-t border-gold-5/30 bg-grey-3/50">
        <div className="flex items-center gap-2 p-3">
          <input
            ref={inputRef}
            type="text"
            value={currentMessage}
            onChange={handleChangeMessageField}
            placeholder="Type a message..."
            maxLength={1024}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-hextech-black/60 border-2 border-gold-6/30',
              'text-gold-1 placeholder-grey-1/50',
              'focus:outline-none focus:border-gold-4/50',
              'transition-colors duration-200'
            )}
          />
          <button
            type="submit"
            disabled={!currentMessage.trim()}
            className={cn(
              'p-3 rounded-lg transition-all duration-200',
              'bg-gold-6/30 border-2 border-gold-5/50',
              'text-gold-3 hover:text-gold-1',
              'hover:bg-gold-5/30 hover:border-gold-4/70',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
