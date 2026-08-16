'use client'

import { useBookDetailFill } from '../../_hooks/useBookDetailFill'

/**
 * 그리는 것이 없는 컴포넌트. 초안의 빈 책 세부를 채우는 일만 한다.
 *
 * 훅을 부르려면 클라이언트 컴포넌트가 하나 필요한데, 화면 컴포넌트 중 하나에 얹으면 그 화면에
 * 머무는 동안에만 살아 있게 된다(단계마다 route가 갈려 리마운트된다). 초안과 수명을 같이해야
 * 해서 layout에 둔다 — 셸에 아무것도 더하지 않도록 null을 돌려준다.
 */
export function BookDetailFiller() {
  useBookDetailFill()
  return null
}
