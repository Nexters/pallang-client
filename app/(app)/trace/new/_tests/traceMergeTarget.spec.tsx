import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceBookForm } from '../_components/TraceBookForm/TraceBookForm'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'

// 원래 이 스펙(develop #228)은 꾸미기 단계의 '다음'이 유사 검사를 건너뛰는지를 봤다.
// 흔적 남기기가 ①생각 작성 → ②꾸미기 → ③책 등록으로 바뀌며 유사 검사와 합치기 다이얼로그가
// ③(TraceBookForm)으로 옮겨갔다 — 겨누는 자리만 옮기고 지키는 규칙은 그대로다:
// **합칠 대목이 이미 정해져 있으면 다시 묻지 않는다.**
const { replaceMock, similarCheckMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  similarCheckMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/book',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  createOcrResult: () => Promise.resolve({ data: { blocks: [] } }),
  checkSimilarPassages: similarCheckMock,
}))

vi.mock('@/app/_global/_apis/_generated/opinion/opinion', () => ({
  createOpinion: () => Promise.resolve({ data: { opinionId: 5, merged: false } }),
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(null),
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () => Promise.resolve({ data: { books: [] } }),
  searchBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

const QUOTE = '문장이 오래 남았다'

const BOOK = { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: null }

/** 책까지 고른 채 ③에 서 있는 초안. mergeTargetId가 있으면 합칠 대목이 이미 정해진 상태다. */
function Harness({ mergeTargetId }: { mergeTargetId: number | null }) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    dispatch({ type: 'selectBook', book: BOOK })
    dispatch({ type: 'setQuotedText', quotedText: QUOTE })
    dispatch({ type: 'setPageDetail', pageNumber: 122, isSpoiler: false })
    dispatch({ type: 'setContent', content: '좋았다' })
    dispatch({
      type: 'applyDecoration',
      decoration: { startOffset: 0, endOffset: 2, effectType: 'WAVY', color: '#06D6A0' },
    })
    if (mergeTargetId !== null) {
      dispatch({ type: 'setMergeTarget', passageId: mergeTargetId })
    }
  }, [dispatch, mergeTargetId])

  // 마운트 시점의 draft.book이 검색 시트를 열지 말지를 정한다 — 책이 먼저 들어가 있어야 한다
  if (!draft.book) return null
  return <TraceBookForm />
}

function renderBookStep(mergeTargetId: number | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AppBackProvider>
        <LoginGateProvider>
          <TraceDraftProvider>
            <TraceOverlayProvider>
              <TraceNavProvider>
                <Harness mergeTargetId={mergeTargetId} />
              </TraceNavProvider>
            </TraceOverlayProvider>
          </TraceDraftProvider>
        </LoginGateProvider>
      </AppBackProvider>
    </QueryClientProvider>,
  )
}

describe('합칠 대목 자동 선택', () => {
  beforeEach(() => {
    replaceMock.mockClear()
    similarCheckMock.mockReset()
    // 묻는 경로를 타면 반드시 후보가 잡히도록 둔다 — 건너뛴 것과 구분된다
    similarCheckMock.mockResolvedValue({
      data: { passages: [{ passageId: 42, quotedText: QUOTE }] },
    })
  })

  it('합칠 대목이 이미 정해져 있으면 유사 검사도 합치기 묻기도 건너뛴다', async () => {
    renderBookStep(42)

    // 확인 화면이 떴다 = 이 화면의 effect가 다 돌았다
    expect(await screen.findByText('양귀자')).toBeTruthy()
    expect(similarCheckMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/의견을 하나로 모을까요\?/)).toBeNull()
  })

  it('합칠 대목이 정해지지 않았으면 종전대로 비슷한 대목을 찾아 묻는다', async () => {
    renderBookStep(null)

    expect(await screen.findByText(/의견을 하나로 모을까요\?/)).toBeInTheDocument()
    await waitFor(() => {
      expect(similarCheckMock).toHaveBeenCalled()
    })
  })
})
