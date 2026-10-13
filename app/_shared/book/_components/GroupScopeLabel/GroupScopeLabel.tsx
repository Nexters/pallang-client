import { cn } from '@/app/_global/_services/cn.service'

type GroupScopeLabelProps = {
  /** 아직 모르면(책 상세에서 모임 정보를 불러오는 중) 빈 문자열 — '모임'만 먼저 선다 */
  groupName: string
  className?: string
}

/**
 * 내 서재의 모임 항목 표시 — `모임 · 모임 이름`.
 * 같은 책이 개인·모임 두 항목으로 나란히 올 수 있어, 어느 쪽 기록인지 책 정보만 보고 가를 수 있게 한다.
 * 시안이 없어 책 정보 줄과 같은 크기(14px)에 '모임'만 굵게 세운다.
 */
export function GroupScopeLabel({ groupName, className }: GroupScopeLabelProps) {
  return (
    <p
      className={cn(
        'flex w-full min-w-0 items-center gap-1 text-body-14md text-text-tertiary',
        className,
      )}
    >
      <span className="shrink-0 text-title-14bd text-text-primary">모임</span>
      {groupName && (
        <>
          <span aria-hidden="true">·</span>
          <span className="min-w-0 truncate">{groupName}</span>
        </>
      )}
    </p>
  )
}
