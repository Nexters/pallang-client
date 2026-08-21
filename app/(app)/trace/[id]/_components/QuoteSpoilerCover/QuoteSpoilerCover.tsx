import CautionIcon from '@/app/_global/_components/Icon/assets/caution.svg'

/** 스포일러 대목을 덮는 가림막 — 카드 안을 통째로 덮는다.
    누르는 것 말고 다른 길은 없다: 카드 탭은 대목 이동이 아니라 이 해제만 한다. */
export function QuoteSpoilerCover({ onReveal }: { onReveal: () => void }) {
  return (
    <button
      type="button"
      onClick={onReveal}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-bg-book-card/70 text-label-strong backdrop-blur-[9px]"
    >
      {/* ponytail: #3e3e3e는 디자인 변수 미연결 색 — 토큰 추가 시 치환 */}
      <CautionIcon className="size-16 text-[#3e3e3e]" />
      <span className="flex flex-col gap-1 text-center">
        <span className="text-[20px] leading-[1.35] font-bold tracking-[-0.04em]">
          스포일러가 포함되어있어요!
        </span>
        <span className="text-body-14md leading-[1.3] tracking-[-0.04em] opacity-70">
          누르면 확인 할 수 있어요
        </span>
      </span>
    </button>
  )
}
