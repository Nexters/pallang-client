import { notFound } from 'next/navigation'

import { parseLibraryGroupId } from '@/app/_shared/book/_data/libraryEntry.model'

import { BookDetailView } from '../BookDetailView/BookDetailView'

type BookDetailBoundaryProps = {
  params: Promise<{ bookId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * 서버 컴포넌트 — 책 상세의 요청 시점 경계.
 * params를 여기서만 읽으므로(page는 Suspense로 감싸기만 한다) cacheComponents 환경에서
 * 페이지 셸은 그대로 프리렌더되고 이 안쪽만 요청 시점에 스트리밍된다.
 *
 * 이름의 `Boundary`는 에러 바운더리가 아니다 — reset도 retry도 없다. 조회 실패는 여기서 잡지 않고
 * `BookDetailView`가 클라이언트에서 가른다.
 */
export async function BookDetailBoundary({ params, searchParams }: BookDetailBoundaryProps) {
  const { bookId } = await params

  // Number()는 '0x0c'(→12)·'1e2'(→100)·' 12 '를 통과시켜 같은 책이 여러 URL로 열리고,
  // '-1'은 검증을 통과한 뒤 4xx가 나는 요청만 쏜다. 앞자리 0('012')도 같은 책의 다른 URL이다.
  // 셸이 이미 200으로 나간 뒤라 not-found 화면은 뜨지만 응답 코드는 200이다.
  if (!/^[1-9]\d*$/.test(bookId)) notFound()

  // 내 서재 항목이 (책, 모임) 단위라 어느 항목에서 들어왔는지가 탭 목록의 범위다.
  // groupId가 없거나 무효면 전역 항목 — 책을 못 여는 건 아니라 not-found로 보내지 않는다.
  const groupId = parseLibraryGroupId(await searchParams)

  return <BookDetailView bookId={Number(bookId)} groupId={groupId} />
}
