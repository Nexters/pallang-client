import type { ReactNode } from 'react'

type QuotePanelProps = {
  quote: string
  isCovered: boolean
  onClick: () => void
  children?: ReactNode
}

export function QuotePanel({ quote, isCovered, onClick, children }: QuotePanelProps) {
  return (
    <div className="relative h-[270px] bg-bg-book-card">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col px-6 py-8 text-left"
      >
        <p className="min-h-0 flex-1 overflow-hidden text-body-20md text-text-secondary">{quote}</p>
        {children}
      </button>
      {isCovered && (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-bg-book-card/70 backdrop-blur-[9px]"
        >
          <span className="text-title-16sb text-text-secondary">스포일러가 포함되어있어요!</span>
          <span className="text-body-14rg text-text-secondary opacity-70">
            누르면 확인 할 수 있어요
          </span>
        </button>
      )}
    </div>
  )
}
