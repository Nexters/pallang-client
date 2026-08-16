import { cn } from '@/app/_global/_services/cn.service'

type OpinionSheetTitleProps = {
  traceCount: number
  replyCount: number
  /** 답글 화면이 덮고 있는지 — 두 제목 중 어느 쪽을 보일지 가른다 */
  isReplyOpen: boolean
}

/**
 * 의견 시트의 제목 — 두 제목을 겹쳐 두고 크로스페이드한다.
 * 즉시 스왑하면 본문 슬라이드(240ms)와 시점이 어긋나 헤더만 먼저 바뀐 것으로 보인다.
 * 비활성 레이어는 aria-hidden으로 빼서 다이얼로그의 접근성 이름에는 보이는 제목 하나만 남는다.
 */
export function OpinionSheetTitle({ traceCount, replyCount, isReplyOpen }: OpinionSheetTitleProps) {
  return (
    <span className="relative block">
      <span
        aria-hidden={isReplyOpen || undefined}
        className={cn(
          'block transition-opacity duration-fast ease-standard',
          isReplyOpen && 'opacity-0',
        )}
      >
        의견 ({traceCount})
      </span>
      <span
        aria-hidden={!isReplyOpen || undefined}
        className={cn(
          'absolute inset-0 transition-opacity duration-fast ease-standard',
          !isReplyOpen && 'opacity-0',
        )}
      >
        답글 ({replyCount})
      </span>
    </span>
  )
}
