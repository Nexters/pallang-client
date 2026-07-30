'use client'

import { useState } from 'react'

/**
 * 퇴장 애니메이션이 도는 동안 마지막으로 존재했던 값을 유지한다.
 * 값이 사라지는 순간 화면의 내용까지 같이 비면 퇴장 전환이 빈 상자로 보인다.
 *
 * 빈 문자열처럼 '없음'을 뜻하는 falsy 값은 호출부에서 null로 정규화해서 넘긴다
 * (예: useLastPresent(message || null)). 이 훅은 null만 '없음'으로 본다.
 */
export function useLastPresent<T>(value: T | null): T | null {
  const [lastPresent, setLastPresent] = useState<T | null>(value)

  // 렌더 도중의 setState — React가 권하는 "이전 렌더 정보로 상태 조정하기" 패턴이다.
  // effect로 미루면 값이 사라진 프레임이 한 번 그려진다.
  if (value !== null && value !== lastPresent) {
    setLastPresent(value)
  }

  return value ?? lastPresent
}
