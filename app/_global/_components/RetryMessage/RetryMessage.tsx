import { cn } from '@/app/_global/_services/cn.service'

type RetryMessageProps = {
  message: string
  onRetry: () => void
  /**
   * 재시도가 도는 중인지. 이 줄이 서는 자리(`isFetchNextPageError`)는 재시도 중에도 계속 참이라
   * (이미 받은 페이지가 있으면 query status가 `error`로 남는다) 스스로 모양이 바뀌지 않는다.
   * 켜 두면 눌린 것이 보이고, 같은 요청이 두 번 나가지 않는다.
   */
  loading?: boolean
  className?: string
}

/**
 * 조회 실패 자리에 넣는 한 줄 안내 + 다시 시도. 화면 전체를 차지하는 실패는 일러스트가 있는
 * `FeedbackState`를 쓰고, 목록·본문 자리만 대체할 때 이걸 쓴다.
 */
export function RetryMessage({ message, onRetry, loading = false, className }: RetryMessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 py-10 text-body-14rg text-text-tertiary',
        className,
      )}
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        aria-busy={loading || undefined}
        className="text-body-14sb text-text-secondary underline disabled:text-text-tertiary"
      >
        {loading ? '불러오는 중…' : '다시 불러오기'}
      </button>
    </div>
  )
}
