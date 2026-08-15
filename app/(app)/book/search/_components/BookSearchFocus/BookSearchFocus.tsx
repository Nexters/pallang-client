import { BookSearchPageView } from '../BookSearchPageView/BookSearchPageView'

type BookSearchFocusProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * 서버 컴포넌트 — 검색 진입 여부만 읽어 화면에 넘기는 요청 시점 경계.
 * 홈의 검색 버튼은 `?focus=search`를 달고, '모두 보기' 링크는 달지 않는다.
 */
export async function BookSearchFocus({ searchParams }: BookSearchFocusProps) {
  const { focus } = await searchParams

  return <BookSearchPageView shouldFocusSearch={focus === 'search'} />
}
