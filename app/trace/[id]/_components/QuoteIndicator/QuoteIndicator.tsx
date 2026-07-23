type QuoteIndicatorProps = {
  quotes: string[]
  activeIndex: number
}

export function QuoteIndicator({ quotes, activeIndex }: QuoteIndicatorProps) {
  return (
    <div className="mt-10 flex items-center justify-end gap-2 px-16">
      {quotes.map((quote, index) => (
        <span
          key={quote}
          className={
            index === activeIndex ? 'h-[17px] w-1.5 bg-[#111]' : 'h-[9px] w-1.5 bg-[#c6c6c6]'
          }
        />
      ))}
    </div>
  )
}
