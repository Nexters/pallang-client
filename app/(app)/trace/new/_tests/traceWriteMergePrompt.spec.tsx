import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceWriteForm } from '../_components/TraceWriteForm/TraceWriteForm'
import { useTraceDraft } from '../_hooks/useTraceDraft'

// 중복(유사 대목) 물음은 대목을 얻은 직후에 나와야 한다 — 사진·직접 입력을 마치고 처음 닿는
// 화면이 ①이다. 여기서 묻지 않으면 사용자가 페이지·꾸밈·책까지 다 채운 ③에 가서야 "이미 있는
// 문장"이라는 말을 듣는다.
const { similarCheckMock } = vi.hoisted(() => ({ similarCheckMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/write',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
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

const QUOTE = '문장이 오래 남았다'

const BOOK = { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: null }

/** 대목을 막 얻은 참. 책은 흔적 보기·책 상세에서 물고 들어와 이미 정해져 있고, 페이지는 아직 없다. */
function Harness({ withBook }: { withBook: boolean }) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    if (withBook) dispatch({ type: 'selectBook', book: BOOK })
    dispatch({ type: 'setQuotedText', quotedText: QUOTE })
    dispatch({ type: 'setSource', source: 'manual' })
  }, [dispatch, withBook])

  if (!draft.quotedText) return null
  return <TraceWriteForm />
}

function renderWriteStep(withBook: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AppBackProvider>
        <LoginGateProvider>
          <TraceDraftProvider>
            <TraceOverlayProvider>
              <TraceNavProvider>
                <Harness withBook={withBook} />
              </TraceNavProvider>
            </TraceOverlayProvider>
          </TraceDraftProvider>
        </LoginGateProvider>
      </AppBackProvider>
    </QueryClientProvider>,
  )
}

describe('대목을 얻은 직후의 중복 물음', () => {
  beforeEach(() => {
    similarCheckMock.mockReset()
    similarCheckMock.mockResolvedValue({
      data: { passages: [{ passageId: 42, quotedText: QUOTE }] },
    })
  })

  it('책이 이미 정해져 있으면 ①에서 바로 묻는다', async () => {
    renderWriteStep(true)

    expect(await screen.findByText(/의견을 하나로 모을까요\?/)).toBeInTheDocument()
  })

  it('페이지를 아직 모르면 페이지를 빼고 묻는다', async () => {
    // 0을 대신 넣으면 서버가 인접 페이지(±1)로 -1~1쪽만 뒤져 어떤 후보도 걸리지 않는다
    renderWriteStep(true)

    await waitFor(() => {
      expect(similarCheckMock).toHaveBeenCalledWith({ bookId: 7, quotedText: QUOTE })
    })
  })

  it('책이 없으면 묻지 않는다 — 물을 근거(bookId)가 없다', async () => {
    renderWriteStep(false)

    // 화면이 다 그려졌다 = 이 화면의 effect가 다 돌았다
    expect(await screen.findByLabelText('스포일러')).toBeInTheDocument()
    expect(similarCheckMock).not.toHaveBeenCalled()
  })
})

describe('① 상단의 책 줄', () => {
  beforeEach(() => {
    similarCheckMock.mockReset()
    similarCheckMock.mockResolvedValue({ data: { passages: [] } })
  })

  it('책이 이미 정해져 있으면 보여준다', async () => {
    renderWriteStep(true)

    expect(await screen.findByLabelText('책 편집하기')).toBeInTheDocument()
  })

  it('책을 아직 안 골랐으면 자리를 차지하지 않는다', async () => {
    // 평소 경로에서 책은 ③에서 고른다 — 여기에 빈 카드를 두면 "아직 고른 책이 없어요"가
    // ①·② 두 화면 내내 붙어 있게 된다.
    renderWriteStep(false)

    expect(await screen.findByLabelText('스포일러')).toBeInTheDocument()
    expect(screen.queryByLabelText('책 편집하기')).toBeNull()
  })
})
