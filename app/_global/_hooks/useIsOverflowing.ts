import { type RefObject, useEffect, useState } from 'react'

type UseIsOverflowingOptions = {
  /** 넘침을 잴 요소 — `line-clamp`처럼 높이가 잘려 있는 쪽을 가리킨다 */
  targetRef: RefObject<HTMLElement | null>
  /**
   * 잘려 있는 동안만 true로 둔다. 펼치고 나면 잘린 높이가 사라져
   * `scrollHeight === clientHeight`가 되므로, 계속 재면 넘침이 없다고 뒤집힌다.
   */
  enabled: boolean
}

/**
 * 요소의 내용이 보이는 높이를 넘는지 — `더보기` 같은 펼치기 어피던스를 띄울지 가른다.
 *
 * `ResizeObserver`로 재는 이유는 폭이 바뀌면 줄바꿈이 달라져 넘침 여부도 바뀌기 때문이다.
 * 한 번만 재면 기기 회전(Capacitor 웹뷰에서 실제로 일어난다)이나 뷰포트 변화 뒤에
 * 옛 측정값이 남아 `더보기`가 잘못 뜨거나 사라진다.
 * `observe()`가 최초 한 번을 바로 물어다 주므로 첫 측정도 여기서 함께 끝난다.
 */
export function useIsOverflowing({ targetRef, enabled }: UseIsOverflowingOptions): boolean {
  const [overflowing, setOverflowing] = useState(false)

  // SSR/PPR 환경이라 useLayoutEffect를 쓰지 않는다 — 한 프레임 늦게 뜨는 편을 택한다
  useEffect(() => {
    const target = targetRef.current
    if (!target || !enabled) return

    const observer = new ResizeObserver(() => {
      setOverflowing(target.scrollHeight > target.clientHeight)
    })
    observer.observe(target)
    return () => {
      observer.disconnect()
    }
  }, [targetRef, enabled])

  return overflowing
}
