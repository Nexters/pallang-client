import { cn } from '@/app/_global/_services/cn.service'

type RetryMessageProps = {
  message: string
  onRetry: () => void
  className?: string
}

/**
 * 조회 실패 자리에 넣는 한 줄 안내 + 다시 시도. 화면 전체를 차지하는 실패는 일러스트가 있는
 * `FeedbackState`를 쓰고, 목록·본문 자리만 대체할 때 이걸 쓴다.
 */
export function RetryMessage({ message, onRetry, className }: RetryMessageProps) {
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
        className="text-body-14sb text-text-secondary underline"
      >
        다시 불러오기
      </button>
    </div>
  )
}
