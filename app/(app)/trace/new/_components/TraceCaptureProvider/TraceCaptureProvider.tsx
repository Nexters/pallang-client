'use client'

import { type ReactNode, useMemo, useRef } from 'react'

import type { Photo } from '@/app/_global/_hooks/useCamera'

import { TraceCaptureContext, type TraceCaptureHandoff } from '../../_data/traceCapture.store'

/**
 * '사진으로 입력'을 누른 그 손짓으로 시작한 촬영을 사진 화면까지 들고 간다.
 *
 * 카메라를 여는 일은 반드시 사용자의 탭 안에서 시작해야 한다 — 웹 경로는 `<input type="file">`이고,
 * 브라우저는 조작 권한(user activation, "방금 사용자가 누른 흔적")이 살아 있을 때만 선택창을 열어준다.
 * 권한이 없으면 예외도 로그도 없이 무시하고, change·cancel 어느 이벤트도 오지 않아 촬영 약속이
 * 영영 끝나지 않는다(화면이 "사진을 불러오는 중"에 멈춘다). route를 먼저 옮기고 다음 화면의
 * mount effect에서 열면 이 권한이 이미 끊긴 뒤다.
 *
 * 그런데 촬영 결과를 쓰는 화면은 route 하나 뒤에 있다. 그래서 탭에서 시작한 약속을 여기 맡겨
 * route 전환 너머로 건넨다. ref에 둔다 — 맡기고 꺼내는 일이 렌더를 유발할 이유가 없다
 * (TraceOverlayProvider의 스택과 같은 이유).
 */
export function TraceCaptureProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<Promise<null | Photo> | null>(null)

  const value = useMemo<TraceCaptureHandoff>(
    () => ({
      hand: (capture) => {
        pendingRef.current = capture
        // 사진 화면이 이어받기 전에 실패하면 아무도 안 듣는 rejection이 된다. 미리 한 번
        // 붙잡아 두되 결과를 삼키지는 않는다 — 이어받은 쪽이 await하면 같은 실패를 그대로 받는다.
        capture.catch(() => undefined)
      },
      take: () => {
        const pending = pendingRef.current
        pendingRef.current = null
        return pending
      },
    }),
    [],
  )

  return <TraceCaptureContext value={value}>{children}</TraceCaptureContext>
}
