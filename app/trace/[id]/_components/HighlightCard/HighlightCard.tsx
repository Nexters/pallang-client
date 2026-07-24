import type { Highlight } from '../../_types/readerHighlights.type'
import { Icon } from '../Icon/Icon'

type HighlightCardProps = {
  highlight: Highlight
  quoteIndex: number
  isRevealed: boolean
  onClick: () => void
}

export function HighlightCard({ highlight, quoteIndex, isRevealed, onClick }: HighlightCardProps) {
  const quote = highlight.quotes[quoteIndex] ?? ''
  const isCovered = highlight.isSpoiler && !isRevealed

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-80 w-78 -rotate-3 rounded-[4px] border border-border-book bg-bg-book-card px-6 py-10 text-left drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
    >
      <p className="h-full overflow-hidden text-body-20md text-text-secondary">{quote}</p>
      {isCovered && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[4px] bg-bg-book-card/70 backdrop-blur-[9px]">
          <Icon name="caution" size={64} color="#3e3e3e" />
          <span className="flex flex-col gap-1 text-center text-black">
            <span className="text-[20px] leading-[1.4] font-bold tracking-[-0.8px]">
              스포일러가 포함되어있어요!
            </span>
            <span className="text-[14px] leading-[1.3] font-medium tracking-[-0.56px] opacity-70">
              누르면 확인 할 수 있어요
            </span>
          </span>
        </span>
      )}
    </button>
  )
}
