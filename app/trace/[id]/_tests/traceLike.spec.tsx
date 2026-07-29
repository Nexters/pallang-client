import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'

const { pushMock, authState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  authState: { isAuthenticated: true },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.isAuthenticated ? 'authenticated' : 'unauthenticated',
    isAuthenticated: authState.isAuthenticated,
    signOut: vi.fn(),
  }),
}))

// page는 서버 컴포넌트(프리페치 셸)라 브라우저 테스트에서는 그 안쪽 클라이언트 화면을 그대로 렌더한다.
const BOOK_ID = 1

const opinion = {
  opinionId: 1,
  userId: 1,
  nickname: '책책책을읽자',
  content: '첫 번째 흔적',
  likeCount: 4,
  createdAt: '2026-07-23T02:00:00.000Z',
}

type RenderOptions = {
  /** 좋아요 응답을 500으로 돌려준다 */
  shouldFail?: boolean
  /** 응답을 releaseLike() 호출 전까지 붙잡아 낙관적 갱신 상태를 관찰할 수 있게 한다 */
  holdLike?: boolean
}

/** 좋아요 토글을 상태를 가진 목으로 흉내낸다. 반환한 releaseLike로 응답 시점을 제어한다. */
async function renderPage({ shouldFail = false, holdLike = false }: RenderOptions = {}) {
  const likeState = { liked: false, likeCount: opinion.likeCount }
  let pendingLike: (() => void) | null = null

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))

      if (url.includes('/like')) {
        return new Promise<Response>((resolve) => {
          const respond = () => {
            if (shouldFail) {
              resolve(new Response(JSON.stringify({ detail: '실패' }), { status: 500 }))
              return
            }
            likeState.liked = !likeState.liked
            // 서버가 계산한 값 — 낙관적으로 더한 값(5)과 일부러 다르게 둬 응답 기준 갱신을 확인한다
            likeState.likeCount = likeState.liked ? 10 : opinion.likeCount
            resolve(new Response(JSON.stringify({ data: { opinionId: 1, ...likeState } })))
          }
          if (holdLike) {
            pendingLike = respond
            return
          }
          respond()
        })
      }
      if (/\/passages\/\d+\/opinions/.test(url)) {
        return json({
          data: {
            opinions: [opinion],
            pageInfo: { page: 0, size: 100, totalElements: 1, totalPages: 1, hasNext: false },
          },
        })
      }
      if (/\/pages\/\d+\/passages/.test(url)) {
        return json({
          data: { passages: [{ passageId: 71, quotedText: '인용문', isSpoiler: false }] },
        })
      }
      if (url.includes('/comments')) {
        return json({
          data: {
            comments: [],
            pageInfo: { page: 0, size: 100, totalElements: 0, totalPages: 1, hasNext: false },
          },
        })
      }
      return json({ data: { pageNumbers: [7] } })
    }),
  )

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  // 로그인 게이트는 루트 레이아웃이 제공하므로 화면만 렌더하는 테스트에서는 직접 감싼다
  render(
    <QueryClientProvider client={client}>
      <LoginGateProvider>
        <TraceCollapseView bookId={BOOK_ID} />
      </LoginGateProvider>
    </QueryClientProvider>,
  )
  await screen.findByText('첫 번째 흔적')

  return {
    releaseLike: () => {
      pendingLike?.()
      pendingLike = null
    },
  }
}

// 오버레이가 열려도 목록 아이템이 먼저 그려지므로 첫 번째가 목록의 좋아요 버튼이다
function likeButton() {
  const [listLike] = screen.getAllByRole('button', { name: '좋아요' })
  if (!listLike) throw new Error('좋아요 버튼을 찾지 못했다')
  return listLike
}

/** 좋아요 버튼의 상태(`aria-pressed`)와 표시 수가 기대값이 될 때까지 기다린다 */
async function expectLike(pressed: boolean, count: string) {
  await waitFor(() => {
    expect(likeButton()).toHaveAttribute('aria-pressed', String(pressed))
    expect(likeButton()).toHaveTextContent(count)
  })
}

function postLikeCalls() {
  return vi
    .mocked(fetch)
    .mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/like'))
}

describe('흔적 좋아요', () => {
  beforeEach(() => {
    authState.isAuthenticated = true
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('좋아요 버튼으로 좋아요를 켜고 끌 수 있다', async () => {
    await renderPage()
    await expectLike(false, '4')

    fireEvent.click(likeButton())
    await expectLike(true, '10')

    fireEvent.click(likeButton())
    await expectLike(false, '4')
    expect(postLikeCalls()).toHaveLength(2)
  })

  it('좋아요 수는 낙관적으로 먼저 오르고 서버 응답 값으로 맞춰진다', async () => {
    const { releaseLike } = await renderPage({ holdLike: true })

    fireEvent.click(likeButton())
    await expectLike(true, '5')

    releaseLike()
    await expectLike(true, '10')
    expect(postLikeCalls()).toHaveLength(1)
  })

  it('요청이 실패하면 이전 상태로 롤백된다', async () => {
    const { releaseLike } = await renderPage({ shouldFail: true, holdLike: true })

    fireEvent.click(likeButton())
    await expectLike(true, '5')

    releaseLike()
    await expectLike(false, '4')
    expect(postLikeCalls()).toHaveLength(1)
  })

  it('목록에서 누른 좋아요가 상세 오버레이에도 반영된다', async () => {
    await renderPage()

    fireEvent.click(likeButton())
    await expectLike(true, '10')

    fireEvent.click(screen.getByText('첫 번째 흔적'))
    const dialog = screen.getByRole('dialog', { name: '의견 상세' })
    const detailLike = within(dialog).getByRole('button', { name: '좋아요' })

    expect(detailLike).toHaveAttribute('aria-pressed', 'true')
    expect(detailLike).toHaveTextContent('공감 10')
  })

  it('비로그인 상태에서 좋아요를 누르면 좋아요 문구의 로그인 유도 팝업이 뜨고 요청은 나가지 않는다', async () => {
    authState.isAuthenticated = false
    await renderPage()

    fireEvent.click(likeButton())

    expect(screen.getByText(LOGIN_GATE_MESSAGE.like)).toBeInTheDocument()
    expect(postLikeCalls()).toHaveLength(0)
    expect(likeButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('상세 오버레이의 좋아요도 좋아요 문구로 막는다', async () => {
    authState.isAuthenticated = false
    await renderPage()

    fireEvent.click(screen.getByText('첫 번째 흔적'))
    const dialog = screen.getByRole('dialog', { name: '의견 상세' })
    fireEvent.click(within(dialog).getByRole('button', { name: '좋아요' }))

    expect(screen.getByText(LOGIN_GATE_MESSAGE.like)).toBeInTheDocument()
    expect(postLikeCalls()).toHaveLength(0)
  })
})
