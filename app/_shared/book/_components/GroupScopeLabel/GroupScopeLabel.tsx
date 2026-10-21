import { cn } from '@/app/_global/_services/cn.service'

type GroupScopeLabelProps = {
  /** 아직 모르면(책 상세에서 모임 정보를 불러오는 중) 빈 문자열 — '모임'만 먼저 선다 */
  groupName: string
  /** 굵게 세우는 범위 이름. 남의 모임이라 이름을 모르는 책(탐색 목록)은 '비공개 모임'만 세운다 */
  scope?: string
  /** 같은 책을 읽는 내 모임이 더 있으면 그 수 — 이름이 말줄임으로 잘려도 '외 N'은 남긴다 */
  moreCount?: number
  className?: string
}

/**
 * 모임 범위 표시 — `모임 · 모임 이름`.
 * 내 서재는 같은 책이 개인·모임 두 항목으로 나란히 올 수 있어, 어느 쪽 기록인지 책 정보만 보고 가를 수 있게 한다.
 * 탐색 목록은 공개 기록 없이 모임에서만 읽는 책을 가른다(누르면 흔적 대신 모임이나 안내로 간다).
 * 시안이 없어 책 정보 줄과 같은 크기(14px)에 범위 이름만 굵게 세운다.
 */
export function GroupScopeLabel({
  groupName,
  scope = '모임',
  moreCount = 0,
  className,
}: GroupScopeLabelProps) {
  return (
    <p
      className={cn(
        'flex w-full min-w-0 items-center gap-1 text-body-14md text-text-tertiary',
        className,
      )}
    >
      <span className="shrink-0 text-title-14bd text-text-primary">{scope}</span>
      {groupName && (
        <>
          <span aria-hidden="true">·</span>
          <span className="min-w-0 truncate">{groupName}</span>
          {moreCount > 0 && <span className="shrink-0">외 {moreCount}</span>}
        </>
      )}
    </p>
  )
}
