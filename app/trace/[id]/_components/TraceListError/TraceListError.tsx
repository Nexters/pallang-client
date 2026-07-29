import { Button } from '@/app/_global/_components/Button/Button'

type TraceListErrorProps = {
  onRetry: () => void
}

/** 흔적/대목 조회 실패 상태. 빈 목록("0개의 흔적")과 구분되도록 목록 헤더 대신 이 화면을 그린다 */
export function TraceListError({ onRetry }: TraceListErrorProps) {
  return (
    <section aria-label="흔적 목록 오류" className="flex flex-col items-center gap-6 px-4 py-19">
      <p className="text-center font-pretendard text-title-18md text-text-inverse">
        앗! 흔적들이 도착하지 않았어요!
        <br />
        다시 시도해주세요.
      </p>
      <Button className="h-[54px] w-[167px]" onClick={onRetry}>
        다시 시도하기
      </Button>
    </section>
  )
}
