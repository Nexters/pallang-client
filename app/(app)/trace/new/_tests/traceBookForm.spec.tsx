import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
// 브리프의 원 파일 목록에는 없던 의존성이다 — useLoginGate가 LoginGateProvider 밖에서 던지는
// 문제를 테스트가 provider 없이 렌더해 놓쳤던 것을 바로잡았다(bookSearchSheet.spec.tsx가
// useOverlayBackGuard에 대해 같은 문제를 이렇게 해결한 선례를 따른다).
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceBookForm } from '../_components/TraceBookForm/TraceBookForm'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'
import { useTraceNav } from '../_hooks/useTraceNav'

// vi.mock 팩토리는 import보다도 먼저(호이스팅되어) 실행된다 — 팩토리 안에서 참조할 목은
// vi.hoisted로 감싸야 "초기화 전 접근" 참조 오류 없이 값을 공유할 수 있다.
const { replaceMock, similarCheckMock, createOpinionMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  similarCheckMock: vi.fn(() => Promise.resolve({ data: { passages: [] } })),
  createOpinionMock: vi.fn(() => Promise.resolve({ data: { opinionId: 5, merged: false } })),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/book',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

// LoginGateProvider가 내부적으로 useAuth(AuthProvider)를 필요로 한다 — traceLike.spec.tsx가
// 같은 문제를 이렇게 해결한 선례를 따른다. 이 파일의 테스트는 401 분기를 거치지 않으므로
// 값 자체는 중요하지 않고, LoginGateProvider가 던지지 않고 마운트되게만 하면 된다.
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

// 실제 생성 함수 이름은 checkSimilarPassages·createOcrResult다(브리프의 similarCheckPassage·
// ocrPassage는 추정이었다) — grep으로 app/_global/_queries/passage.queries.ts를 확인해 맞췄다.
// 목을 그대로 export하면(스프레드로 감싸지 않아도) 같은 인스턴스로 호출 여부를 추적할 수 있다.
vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  createOcrResult: () => Promise.resolve({ data: { blocks: [] } }),
  checkSimilarPassages: similarCheckMock,
}))

vi.mock('@/app/_global/_apis/_generated/opinion/opinion', () => ({
  createOpinion: createOpinionMock,
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(null),
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () =>
    Promise.resolve({
      data: {
        books: [
          { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: 300 },
        ],
      },
    }),
  searchBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

// 흔적 보기 화면에서 씨앗으로 들어오면 첫 화면이 이미 selectBook을 던진 상태로 ③에 닿는다.
const SEED_BOOK = {
  bookId: 3,
  title: '싯다르타',
  author: '헤르만 헤세',
  coverImageUrl: null,
  pageCount: 200,
}

// dispatch는 effect에서만 부른다(렌더 중 부르면 Provider를 렌더 도중 갱신하게 된다)
function Seeded({
  pageNumber = 10,
  withBook = false,
}: {
  pageNumber?: number
  withBook?: boolean
}) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    if (withBook) dispatch({ type: 'selectBook', book: SEED_BOOK })
    dispatch({ type: 'setQuotedText', quotedText: '어떤 문장' })
    dispatch({ type: 'setPageDetail', pageNumber, isSpoiler: false })
    dispatch({ type: 'setContent', content: '좋았다' })
    dispatch({
      type: 'applyDecoration',
      decoration: { startOffset: 0, endOffset: 2, effectType: 'HIGHLIGHT', color: '#FFE81A' },
    })
  }, [dispatch, pageNumber, withBook])

  // 초안이 다 차기 전에는 TraceBookForm을 마운트하지 않는다 — 마운트 시점의 draft.book이
  // 시트를 열지 말지를 정하므로, 씨앗 경로를 흉내 내려면 책이 먼저 들어가 있어야 한다.
  if (!draft.quotedText) return null
  return <TraceBookForm />
}

// 하드웨어 뒤로가기를 흉내 낸다 — 이 플로우는 하드웨어 back도 닫기(X)와 같은
// requestExit 판정을 거치므로, 그 판정을 그대로 태워야 실제 동작과 같다
// (bookSearchSheet.spec.tsx의 BackProbe와 같은 패턴).
function BackProbe() {
  const { requestExit } = useTraceNav()
  return (
    <button
      type="button"
      onClick={() => {
        requestExit()
      }}
    >
      하드웨어 뒤로가기
    </button>
  )
}

function renderForm({ pageNumber = 10, withBook = false } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <TraceDraftProvider>
            <TraceOverlayProvider>
              <TraceNavProvider>
                <Seeded pageNumber={pageNumber} withBook={withBook} />
                <BackProbe />
              </TraceNavProvider>
            </TraceOverlayProvider>
          </TraceDraftProvider>
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

async function pickBook() {
  fireEvent.click(await screen.findByText('모순'))
  fireEvent.click(screen.getByRole('button', { name: '등록하기' }))
}

describe('책 등록 단계', () => {
  it('책이 없으면 검색 시트를 열어 둔다', async () => {
    renderForm()

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('책을 고르면 유사 대목 검사를 돌린다', async () => {
    similarCheckMock.mockClear()
    renderForm()
    await pickBook()

    await waitFor(() => {
      expect(similarCheckMock).toHaveBeenCalled()
    })
  })

  it('씨앗으로 책을 들고 오면 시트 없이 확인 화면이고 유사 대목 검사도 돈다', async () => {
    // 중복 대목이 생기던 경로다 — 시트를 한 번도 열지 않아 선택 콜백이 돌지 않는다.
    similarCheckMock.mockClear()
    renderForm({ withBook: true })

    expect(await screen.findByText('헤르만 헤세')).toBeTruthy()
    expect(screen.queryByPlaceholderText('책 제목을 입력해 주세요.')).toBeNull()
    await waitFor(() => {
      expect(similarCheckMock).toHaveBeenCalledWith({
        bookId: 3,
        pageNumber: 10,
        quotedText: '어떤 문장',
      })
    })
  })

  it('시트를 열었다 그냥 닫아도 유사 대목 검사를 다시 돌리지 않는다', async () => {
    similarCheckMock.mockClear()
    renderForm({ withBook: true })

    await screen.findByText('헤르만 헤세')
    await waitFor(() => {
      expect(similarCheckMock).toHaveBeenCalledTimes(1)
    })

    similarCheckMock.mockClear()
    fireEvent.click(screen.getByRole('button', { name: '편집하기' }))
    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('책 제목을 입력해 주세요.')).toBeNull()
    })
    expect(similarCheckMock).not.toHaveBeenCalled()
  })

  it('책을 고르면 확인 화면에 책·의견이 보인다', async () => {
    renderForm()
    await pickBook()

    expect(await screen.findByText('양귀자')).toBeTruthy()
    expect(screen.getByText('좋았다')).toBeTruthy()
  })

  it('책을 고르지 않고 시트를 닫아도 편집하기로 다시 열 수 있다', async () => {
    // 책 카드는 고른 책이 있을 때만 내용을 채우지만, 카드 자체와 '편집하기'는 늘 남아야 한다 —
    // 없으면 시트를 그냥 닫은 사용자에게 책을 고를 길이 사라진다.
    renderForm()

    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('책 제목을 입력해 주세요.')).toBeNull()
    })
    fireEvent.click(screen.getByRole('button', { name: '편집하기' }))

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('편집하기를 누르면 검색 시트가 다시 열린다', async () => {
    renderForm()
    await pickBook()

    fireEvent.click(await screen.findByRole('button', { name: '편집하기' }))

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('의견 헤딩에 닉네임이 들어간다', async () => {
    renderForm()
    await pickBook()

    expect(await screen.findByText('나님이 기록한 의견')).toBeTruthy()
  })

  it('검색 시트가 열려 있으면 하드웨어 뒤로가기가 시트만 닫는다', async () => {
    // 가드가 없으면 이탈 확인 다이얼로그가 시트 위에 겹쳐 뜬다 — 시트를 닫으려던 사용자가
    // 플로우를 나갈지 묻는 질문을 받는다.
    renderForm()

    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    // 프로브는 시트(모달) 바깥 형제라 base-ui가 aria-hidden 처리해 둔다.
    fireEvent.click(screen.getByRole('button', { name: '하드웨어 뒤로가기', hidden: true }))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('책 제목을 입력해 주세요.')).toBeNull()
    })
    expect(screen.queryByText('남긴 문장과 의견은 저장되지 않아요.')).toBeNull()
  })

  it('페이지가 책 쪽수를 넘으면 저장하지 않고 이유를 알린다', async () => {
    // 재시도해도 계속 실패하는 실패다 — "잠시 후 다시 시도"로 뭉개면 손쓸 방법이 없다.
    // ①에는 아직 책이 없어 상한을 볼 수 없으니, 쪽수를 아는 이 화면이 막는다.
    createOpinionMock.mockClear()
    // 씨앗 책은 pageCount가 200이다.
    renderForm({ withBook: true, pageNumber: 500 })

    fireEvent.click(await screen.findByRole('button', { name: '기록 완료' }))

    expect(await screen.findByText(/쪽수를 넘어요/)).toBeTruthy()
    expect(createOpinionMock).not.toHaveBeenCalled()
  })

  it('기록 완료를 누르면 흔적을 저장하고 완료로 간다', async () => {
    replaceMock.mockClear()
    createOpinionMock.mockClear()
    renderForm()
    await pickBook()

    fireEvent.click(await screen.findByRole('button', { name: '기록 완료' }))

    await waitFor(() => {
      expect(createOpinionMock).toHaveBeenCalled()
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/done')
    })
  })
})
