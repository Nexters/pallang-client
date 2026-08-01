import { parseTraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { BookPicker } from '../BookPicker/BookPicker'

type TraceSeedBoundaryProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * 서버 컴포넌트 — 흔적 보기 화면이 넘긴 씨앗을 읽는 요청 시점 경계.
 * searchParams를 여기서만 읽으므로 page 셸은 그대로 프리렌더된다.
 */
export async function TraceSeedBoundary({ searchParams }: TraceSeedBoundaryProps) {
  return <BookPicker seed={parseTraceSeed(await searchParams)} />
}
