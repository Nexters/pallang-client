'use client'

import { useSearchParams } from 'next/navigation'

import { toSearchParamsRecord } from '@/app/_global/_services/searchParams.service'
import { parseMeetingCreateBookId } from '@/app/_shared/meeting/_data/meetingCreateSeed.model'

import { MeetingCreateView } from '../MeetingCreateView/MeetingCreateView'

/**
 * 미리 채울 책(?bookId)을 URL에서 읽는 경계. 서버가 아니라 클라이언트에서 읽어 페이지가 통째로 프리렌더된다
 * (흔적 작성의 TraceSeedBoundary와 같은 이유). useSearchParams는 프리렌더에서만 suspend하고,
 * 그 경로(URL 직접 로드)는 page의 Suspense 폴백이 하이드레이션까지 자리를 지킨다.
 */
export function MeetingCreateBoundary() {
  const seedBookId = parseMeetingCreateBookId(toSearchParamsRecord(useSearchParams()))
  // 다른 책을 들고 다시 들어오면 화면을 갈아 끼운다 — 앞 책으로 고치던 값(edited)이 남지 않게
  return <MeetingCreateView key={seedBookId ?? 'empty'} seedBookId={seedBookId} />
}
