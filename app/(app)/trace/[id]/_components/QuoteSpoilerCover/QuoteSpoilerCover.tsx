import CautionIcon from '@/app/_global/_components/Icon/assets/caution.svg'
import { cn } from '@/app/_global/_services/cn.service'

import styles from '../QuoteStage/QuoteStage.module.css'

type QuoteSpoilerCoverProps = {
  /** 접힘 상태에서는 글자가 작아지고 굵기도 한 단계 낮아진다 */
  isCollapsed: boolean
  onReveal: () => void
}

/** 스포일러 대목을 덮는 가림막 — 카드 안에 있어 카드의 회전·크기 변화를 그대로 따라간다.
    누르는 것 말고 다른 길은 없다: 카드 탭은 대목 이동이 아니라 이 해제만 한다. */
export function QuoteSpoilerCover({ isCollapsed, onReveal }: QuoteSpoilerCoverProps) {
  return (
    <button
      type="button"
      onClick={onReveal}
      className={cn(
        styles['cover'],
        'absolute inset-x-0 bottom-0 flex flex-col items-center justify-center rounded-[inherit] bg-bg-book-card/70',
        // 흐림은 쪽 선택기 유리와 같은 세기를 쓴다
        'backdrop-blur-[9px]',
      )}
    >
      {/* ponytail: #3e3e3e는 디자인 변수 미연결 색 — 토큰 추가 시 치환 */}
      <CautionIcon className={cn(styles['coverIcon'], 'text-[#3e3e3e]')} />
      <span className="flex flex-col gap-1 text-center">
        {/* 가변 폰트가 아니라 굵기는 보간되지 않는다 — 전환이 끝난 시점에만 바꾼다 */}
        <span
          className={cn(
            styles['coverTitle'],
            'leading-[1.35] tracking-[-0.04em]',
            isCollapsed ? 'font-semibold' : 'font-bold',
          )}
        >
          스포일러가 포함되어있어요!
        </span>
        <span
          className={cn(
            'text-body-14md leading-[1.3] tracking-[-0.04em] opacity-70',
            isCollapsed && 'font-normal',
          )}
        >
          누르면 확인 할 수 있어요
        </span>
      </span>
    </button>
  )
}
