'use client'

import { type RefObject, useEffect, useRef } from 'react'

type UseDismissOnOutsideOptions = {
  /** 열려 있는 조각의 뿌리 — 이 안에서 시작한 포인터는 바깥으로 세지 않는다 */
  ref: RefObject<Element | null>
  /** 닫혀 있는 동안에는 false로 꺼둔다 — 리스너를 아예 붙이지 않는다 */
  enabled: boolean
  onDismiss: () => void
}

/**
 * 바깥 탭·스크롤이 일어나면 닫는, base-ui를 쓰지 않는 팝오버용 닫힘 훅.
 *
 * enabled가 true로 바뀐 뒤에야 리스너를 붙이므로, 여는 pointerdown이 그대로 이어져
 * 열자마자 스스로 닫히는 일이 없다.
 * 스크롤은 캡처 단계로 듣는다 — 스크롤 이벤트는 버블링하지 않아 안쪽 컨테이너가 움직여도 받아야 한다.
 */
export function useDismissOnOutside({ ref, enabled, onDismiss }: UseDismissOnOutsideOptions) {
  // 콜백 identity가 렌더마다 바뀌어도 리스너를 다시 붙이지 않는다
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!enabled) return undefined

    const dismissOnOutside = (event: PointerEvent) => {
      const eventTarget = event.target instanceof Element ? event.target : null
      if (ref.current?.contains(eventTarget)) return
      onDismissRef.current()
    }
    const dismiss = () => {
      onDismissRef.current()
    }

    document.addEventListener('pointerdown', dismissOnOutside)
    document.addEventListener('scroll', dismiss, true)
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutside)
      document.removeEventListener('scroll', dismiss, true)
    }
  }, [ref, enabled])
}
