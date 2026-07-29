import { type RefObject, useEffect, useRef } from 'react'

type UseLoadMoreOnVisibleOptions = {
  /** 목록 끝에 두는 sentinel 요소 */
  targetRef: RefObject<Element | null>
  /** 스크롤 컨테이너 — 생략하면 뷰포트를 기준으로 관찰한다 */
  rootRef?: RefObject<Element | null>
  /** 더 불러올 페이지가 없거나 이미 불러오는 중이면 false로 꺼둔다 */
  enabled: boolean
  onLoadMore: () => void
  /** sentinel이 보이기 전에 미리 불러오는 여유 거리 */
  rootMargin?: string
}

/** sentinel이 스크롤 영역에 들어오면 다음 페이지를 불러오는 무한 스크롤 트리거 */
export function useLoadMoreOnVisible({
  targetRef,
  rootRef,
  enabled,
  onLoadMore,
  rootMargin = '160px 0px',
}: UseLoadMoreOnVisibleOptions) {
  // 콜백 identity가 렌더마다 바뀌어도 observer를 다시 붙이지 않는다
  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  useEffect(() => {
    const target = targetRef.current
    if (!target || !enabled) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMoreRef.current()
      },
      { root: rootRef?.current ?? null, rootMargin },
    )

    observer.observe(target)
    return () => {
      observer.disconnect()
    }
  }, [targetRef, rootRef, enabled, rootMargin])
}
