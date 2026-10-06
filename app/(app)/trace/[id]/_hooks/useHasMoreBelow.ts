import { type RefObject, useEffect, useState } from 'react'

import { hasMoreBelow } from '../_services/quoteScroll.service'

/** 스크롤 영역 아래에 가려진 내용이 남았는지 따라간다.
    스크롤뿐 아니라 크기 변화(폰트 로드로 줄바꿈이 바뀌는 경우 등)에도 다시 잰다 —
    영역 자체와 안쪽 내용의 높이를 함께 지켜봐야 넘침 여부가 바뀌는 순간을 놓치지 않는다. */
export function useHasMoreBelow(ref: RefObject<HTMLElement | null>): boolean {
  const [isMoreBelow, setIsMoreBelow] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      setIsMoreBelow(hasMoreBelow(element))
    }

    measure()
    element.addEventListener('scroll', measure, { passive: true })
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(element)
    if (element.firstElementChild) resizeObserver.observe(element.firstElementChild)

    return () => {
      element.removeEventListener('scroll', measure)
      resizeObserver.disconnect()
    }
  }, [ref])

  return isMoreBelow
}
