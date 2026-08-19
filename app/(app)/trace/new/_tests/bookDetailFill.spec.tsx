import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { BookDetailFiller } from '../_components/BookDetailFiller/BookDetailFiller'
import { TraceBookForm } from '../_components/TraceBookForm/TraceBookForm'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'
import type { SelectedBook } from '../_types/traceDraft.type'

// vi.mock 팩토리는 import보다 먼저 실행된다 — 팩토리가 참조할 목은 vi.hoisted로 올린다
// (traceBookForm.spec.tsx와 같은 방식).
const { createOpinionMock, searchInternalMock, searchState } = vi.hoisted(() => {
  const searchState = {
    books: [] as { author: string; bookId: number; pageCount: number; title: string }[],
  }
  return {
    createOpinionMock: vi.fn(() => Promise.resolve({ data: { opinionId: 5, merged: false } })),
    searchInternalMock: vi.fn(() =>
      Promise.resolve({
        data: { books: searchState.books, pageInfo: { page: 0, hasNext: false } },
      }),
    ),
    searchState,
  }
})

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/book',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

// LoginGateProvider가 useAuth(AuthProvider)를 필요로 한다. 이 파일은 401 분기를 타지 않아
// 값 자체는 중요하지 않고, 던지지 않고 마운트되기만 하면 된다.
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  createOcrResult: () => Promise.resolve({ data: { blocks: [] } }),
  checkSimilarPassages: () => Promise.resolve({ data: { passages: [] } }),
}))

vi.mock('@/app/_global/_apis/_generated/opinion/opinion', () => ({
  createOpinion: createOpinionMock,
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(null),
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  // 시트에서 고르는 경로에 쓰는 책 — 목록 응답이라 저자·쪽수가 처음부터 갖춰져 있다.
  getRecentBooks: () =>
    Promise.resolve({
      data: {
        books: [
          { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: 300 },
        ],
      },
    }),
  searchBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: searchInternalMock,
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

// 흔적 보기 화면이 넘기는 씨앗의 책. 그 화면의 책 정보는 PageNumbers 응답에서 오는데
// 제목·표지뿐이라(단일 도서 조회 API가 없다) 저자·쪽수가 비어 있다.
const SEED_BOOK: SelectedBook = {
  bookId: 3,
  title: '싯다르타',
  author: '',
  coverImageUrl: null,
  pageCount: null,
}

const FOUND_BOOK = { bookId: 3, title: '싯다르타', author: '헤르만 헤세', pageCount: 200 }

const SEED_PASSAGE_ID = 42

// dispatch는 effect에서만 부른다(렌더 중 부르면 Provider를 렌더 도중 갱신하게 된다).
// 순서는 TraceSourceView가 씨앗을 소비하는 순서 그대로다 — setPageDetail이 합칠 대목을
// 비우므로 setMergeTarget이 반드시 뒤에 온다.
function Seeded({ book, pageNumber }: { book: SelectedBook | null; pageNumber: number }) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    if (book) dispatch({ type: 'selectBook', book })
    dispatch({ type: 'setQuotedText', quotedText: '어떤 문장' })
    dispatch({ type: 'setPageDetail', pageNumber, isSpoiler: false })
    dispatch({
      type: 'applyDecoration',
      decoration: { startOffset: 0, endOffset: 2, effectType: 'HIGHLIGHT', color: '#FFE81A' },
    })
    dispatch({ type: 'setContent', content: '좋았다' })
    if (book) dispatch({ type: 'setMergeTarget', passageId: SEED_PASSAGE_ID })
  }, [book, dispatch, pageNumber])

  // 마운트 시점의 draft.book이 검색 시트를 열지 말지를 정한다 — 초안이 차기 전에는 띄우지 않는다.
  if (!draft.quotedText) return null
  return <TraceBookForm />
}

// 채우기가 초안에 어떻게 내려앉았는지는 카드만으로 다 볼 수 없다 — 초안을 직접 읽는다
function DraftProbe() {
  const { draft } = useTraceDraft()
  return (
    <output data-testid="draft-probe">
      {JSON.stringify({
        author: draft.book?.author ?? null,
        pageCount: draft.book?.pageCount ?? null,
        passageId: draft.passageId,
      })}
    </output>
  )
}

type ProbedDraft = {
  author: null | string
  pageCount: null | number
  passageId: null | number
}

function readProbe(): ProbedDraft {
  return JSON.parse(screen.getByTestId('draft-probe').textContent) as ProbedDraft
}

type SeedOptions = { book: SelectedBook | null; pageNumber: number }

// layout.tsx와 같은 구성이다 — 채우기는 화면이 아니라 초안 옆(layout)에 산다.
function renderFlow({ book = SEED_BOOK, pageNumber = 10 }: Partial<SeedOptions> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <TraceDraftProvider>
            <BookDetailFiller />
            <TraceOverlayProvider>
              <TraceNavProvider>
                <Seeded book={book} pageNumber={pageNumber} />
                <DraftProbe />
              </TraceNavProvider>
            </TraceOverlayProvider>
          </TraceDraftProvider>
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
  return { ...rendered, queryClient }
}

describe('씨앗으로 들어온 책의 세부 채우기', () => {
  beforeEach(() => {
    searchInternalMock.mockClear()
    createOpinionMock.mockClear()
    searchState.books = [FOUND_BOOK]
  })

  it('저자가 빈 책이면 제목으로 내부 검색해 카드의 저자 줄을 채운다', async () => {
    renderFlow()

    expect(await screen.findByText('헤르만 헤세')).toBeTruthy()
    // 기다리는 동안에도 카드는 비지 않는다 — 제목은 내내 그대로다.
    expect(screen.getByText('싯다르타')).toBeTruthy()
    expect(searchInternalMock).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '싯다르타' }),
    )
  })

  it('채워진 쪽수가 페이지 초과 검사를 되살린다', async () => {
    // 씨앗 책은 쪽수를 모른 채 들어와 이 검사가 조용히 통째로 빠져 있었다.
    renderFlow({ pageNumber: 500 })

    await screen.findByText('헤르만 헤세')
    fireEvent.click(screen.getByRole('button', { name: '기록 완료' }))

    expect(await screen.findByText(/쪽수를 넘어요/)).toBeTruthy()
    expect(createOpinionMock).not.toHaveBeenCalled()
  })

  it('세부를 채워도 씨앗이 정해 준 합칠 대목은 남는다', async () => {
    // selectBook으로 채우면 passageId가 지워진다 — 합칠 대상을 잃고 흔적이 따로 저장된다.
    renderFlow()

    await waitFor(() => {
      expect(readProbe()).toEqual({
        author: '헤르만 헤세',
        pageCount: 200,
        passageId: SEED_PASSAGE_ID,
      })
    })
  })

  it('시트에서 고른 책은 이미 세부를 갖췄으므로 조회하지 않는다', async () => {
    renderFlow({ book: null })

    fireEvent.click(await screen.findByText('모순'))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    expect(await screen.findByText('양귀자')).toBeTruthy()
    expect(searchInternalMock).not.toHaveBeenCalled()
  })

  it('내부 검색에 그 책이 없으면 초안을 그대로 두고 다시 묻지 않는다', async () => {
    searchState.books = []
    const { queryClient } = renderFlow()

    await waitFor(() => {
      expect(searchInternalMock).toHaveBeenCalledTimes(1)
      expect(queryClient.isFetching()).toBe(0)
    })
    // 못 찾으면 '덜 찼다'는 조건이 그대로 남는다 — 앱으로 돌아올 때마다 다시 묻지 않는지 본다.
    await act(async () => {
      window.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
    })
    expect(searchInternalMock).toHaveBeenCalledTimes(1)
    // 막지도 알리지도 않는다 — 카드는 제목만 단 채 그대로다.
    expect(await screen.findByText('싯다르타')).toBeTruthy()
    expect(readProbe()).toEqual({ author: '', pageCount: null, passageId: SEED_PASSAGE_ID })

    // 시트를 여닫아 다시 렌더돼도 두 번 묻지 않는다.
    fireEvent.click(screen.getByRole('button', { name: '편집하기' }))
    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')

    expect(searchInternalMock).toHaveBeenCalledTimes(1)
  })

  it('찾은 책의 저자가 비어 있어도 되묻지 않는다', async () => {
    // 채운 뒤에도 '저자가 없다'는 조건이 그대로 남는 경우다 — 시도를 책에 걸어 두지 않으면
    // 채우기 → 리렌더 → 다시 채우기로 끝없이 돈다.
    searchState.books = [{ ...FOUND_BOOK, author: '' }]
    renderFlow()

    await waitFor(() => {
      expect(readProbe().pageCount).toBe(200)
    })
    expect(searchInternalMock).toHaveBeenCalledTimes(1)
  })
})
