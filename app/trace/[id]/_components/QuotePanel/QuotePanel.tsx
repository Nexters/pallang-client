/** 의견 상세에서 인용문만 보여주는 고정 패널. 흔적 목록 화면의 전환형 패널은 QuoteStage가 담당한다 */
export function QuotePanel({ quote }: { quote: string }) {
  return (
    <div className="flex h-[270px] shrink-0 flex-col bg-bg-book-card px-6 py-8">
      <p className="min-h-0 flex-1 overflow-hidden text-body-20md text-text-secondary">{quote}</p>
    </div>
  )
}
