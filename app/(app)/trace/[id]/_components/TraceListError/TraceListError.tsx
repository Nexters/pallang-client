import { Button } from '@/app/_global/_components/Button/Button'

/** 흔적/대목 조회 실패 상태. 빈 목록("0개의 흔적")과 구분되도록 목록 헤더 대신 이 화면을 그린다.
    어두운 패널 자리를 통째로 대신하므로 handle도 정렬 바도 세우지 않는다(시안 229:24224) */
export function TraceListError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      aria-label="흔적 목록 오류"
      // py-19: 목록이 있어야 할 자리를 비워두지 않고 안내를 패널 가운데쯤으로 띄운다
      className="flex flex-col items-center gap-6 px-4 py-19"
    >
      <p className="text-center font-pretendard text-title-18md text-text-inverse">
        앗! 흔적들이 도착하지 않았어요!
        <br />
        다시 시도해주세요.
      </p>
      {/* 54×167은 시안의 고정 치수 — 문구 길이에 따라 버튼이 늘었다 줄었다 하지 않게 못 박는다 */}
      <Button className="h-[54px] w-[167px]" onClick={onRetry}>
        다시 시도하기
      </Button>
    </section>
  )
}
