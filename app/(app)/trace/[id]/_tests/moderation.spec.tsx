import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'

const { authState } = vi.hoisted(() => ({ authState: { isAuthenticated: true } }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.isAuthenticated ? 'authenticated' : 'unauthenticated',
    isAuthenticated: authState.isAuthenticated,
    signOut: vi.fn(),
  }),
}))

const BOOK_ID = 1
const MY_USER_ID = 10

/** 다음 신고 요청부터 4xx로 거부할 횟수 — 이미 신고한 글 경로를 확인하는 데 쓴다 */
const apiFailures = { report: 0 }

const opinionSeed = [
  {
    opinionId: 1,
    userId: 2,
    nickname: '다른사람',
    content: '남의 흔적',
    likeCount: 0,
    commentCount: 3,
    createdAt: '2026-07-27T00:00:00.000Z',
  },
  {
    opinionId: 2,
    userId: MY_USER_ID,
    nickname: '나',
    content: '내 흔적',
    likeCount: 0,
    commentCount: 0,
    createdAt: '2026-07-26T00:00:00.000Z',
  },
]

const commentBase = {
  replies: [],
  replyCount: 0,
  hasMoreReplies: false,
  isDeleted: false,
  createdAt: '2026-07-27T01:00:00.000Z',
  updatedAt: '2026-07-27T01:00:00.000Z',
}

const commentSeed = [
  { ...commentBase, commentId: 1, userId: 2, nickname: '다른사람', content: '남의 댓글' },
  { ...commentBase, commentId: 2, userId: MY_USER_ID, nickname: '나', content: '내 댓글' },
  {
    ...commentBase,
    commentId: 3,
    userId: 2,
    nickname: '다른사람',
    content: '지워진 댓글',
    isDeleted: true,
  },
]

/** 신고·차단 요청 기록 — url과 본문으로 서버에 간 값을 검증한다 */
type RecordedCall = { url: string; body: unknown }

function stubApi() {
  const recorded: { reports: RecordedCall[]; blocks: string[] } = { reports: [], blocks: [] }

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))

      if (url.includes('/users/me')) {
        if (!authState.isAuthenticated) {
          return Promise.resolve(new Response('{}', { status: 401 }))
        }
        return json({ data: { userId: MY_USER_ID, nickname: '나' } })
      }

      if (/\/(opinions|comments)\/\d+\/reports/.test(url) && method === 'POST') {
        if (apiFailures.report > 0) {
          apiFailures.report -= 1
          return Promise.resolve(
            new Response(
              JSON.stringify({ title: 'ALREADY_REPORTED', detail: '이미 신고한 글입니다.' }),
              { status: 409 },
            ),
          )
        }
        recorded.reports.push({ url, body: JSON.parse(options?.body as string) })
        return json({ data: { reportId: 1 } })
      }

      const blockMatch = /\/users\/(\d+)\/block/.exec(url)
      if (blockMatch && method === 'POST') {
        recorded.blocks.push(url)
        return json({ data: null })
      }

      if (/\/passages\/\d+\/opinions/.test(url)) {
        return json({
          data: {
            opinions: opinionSeed,
            pageInfo: { page: 0, size: 20, totalElements: 2, totalPages: 1, hasNext: false },
          },
        })
      }

      if (/\/opinions\/\d+\/comments/.test(url)) {
        return json({
          data: {
            comments: commentSeed,
            pageInfo: { page: 0, size: 5, totalElements: 3, totalPages: 1, hasNext: false },
          },
        })
      }

      if (/\/pages\/\d+\/passages/.test(url)) {
        return json({
          data: { passages: [{ passageId: 71, quotedText: '대목 인용문', isSpoiler: false }] },
        })
      }

      return json({ data: { pageNumbers: [7] } })
    }),
  )

  return recorded
}

async function renderView() {
  const recorded = stubApi()
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
  await screen.findByText('남의 흔적')
  return { client, recorded }
}

/** getAll* 결과의 첫 요소 — 인덱싱의 undefined를 명시적으로 걷어낸다 */
function firstOf(elements: HTMLElement[]): HTMLElement {
  const [first] = elements
  if (!first) throw new Error('요소를 찾지 못했다')
  return first
}

/** 남의 흔적의 ⋯ 메뉴를 열고 항목을 하나 고른다 */
async function openMenuItem(name: '신고하기' | '차단하기') {
  // 내 흔적의 메뉴가 숨겨질 때까지 기다려야 ⋯이 남의 흔적 것 하나로 좁혀진다
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: '더보기' })).toHaveLength(1)
  })
  fireEvent.click(screen.getByRole('button', { name: '더보기' }))
  fireEvent.click(await screen.findByRole('menuitem', { name }))
}

describe('흔적·댓글 신고와 사용자 차단', () => {
  beforeEach(() => {
    authState.isAuthenticated = true
    apiFailures.report = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('⋯ 메뉴는 남의 흔적에만 보인다 — 내 흔적에는 없다', async () => {
    await renderView()

    // 내 정보가 도착하면 내 흔적(userId 10)의 메뉴가 사라져 남의 흔적 것 하나만 남는다
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '더보기' })).toHaveLength(1)
    })
    const mine = screen.getByText('내 흔적').closest('li')
    expect(within(mine as HTMLElement).queryByRole('button', { name: '더보기' })).toBeNull()
  })

  it('댓글의 ⋯ 메뉴는 남의 댓글에만 보인다 — 내 댓글과 삭제된 댓글에는 없다', async () => {
    await renderView()
    fireEvent.click(firstOf(screen.getAllByRole('button', { name: '댓글 보기' })))
    await screen.findByText('남의 댓글')

    const section = screen.getByLabelText('댓글 목록')
    await waitFor(() => {
      // 남의 댓글 1개에만 메뉴가 붙는다 — 내 댓글은 수정/삭제, 삭제된 댓글은 본문 자체가 없다
      expect(within(section).getAllByRole('button', { name: '더보기' })).toHaveLength(1)
    })
    expect(screen.getByText('삭제된 댓글입니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
  })

  it('신고 모달은 사유를 골라야 제출할 수 있고, 성공하면 스낵바로 알린다', async () => {
    const { recorded } = await renderView()
    await openMenuItem('신고하기')

    const submit = await screen.findByRole('button', { name: '신고 하기' })
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: '홍보성 (스팸·광고)' }))
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    expect(await screen.findByText('신고가 접수됐어요.')).toBeInTheDocument()
    expect(recorded.reports).toEqual([{ url: '/api/opinions/1/reports', body: { reason: 'SPAM' } }])
  })

  it('서버 enum에 짝이 없는 사유는 ETC로 보내고 라벨을 상세에 싣는다', async () => {
    const { recorded } = await renderView()
    await openMenuItem('신고하기')

    fireEvent.click(screen.getByRole('radio', { name: '스포일러 미표시' }))
    fireEvent.click(screen.getByRole('button', { name: '신고 하기' }))

    await screen.findByText('신고가 접수됐어요.')
    expect(recorded.reports).toEqual([
      { url: '/api/opinions/1/reports', body: { reason: 'ETC', detail: '스포일러 미표시' } },
    ])
  })

  it('기타 사유는 상세를 써야 제출할 수 있고, 본문에 상세가 실린다', async () => {
    const { recorded } = await renderView()
    await openMenuItem('신고하기')

    // 상세 입력은 항상 보이지만 기타를 고르기 전에는 잠겨 있다
    const detailInput = await screen.findByLabelText('신고 상세 내용')
    expect(detailInput).toBeDisabled()

    const submit = screen.getByRole('button', { name: '신고 하기' })
    fireEvent.click(screen.getByRole('radio', { name: '기타' }))
    expect(submit).toBeDisabled()

    fireEvent.change(detailInput, {
      target: { value: '무단 도용이에요' },
    })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    await screen.findByText('신고가 접수됐어요.')
    expect(recorded.reports).toEqual([
      { url: '/api/opinions/1/reports', body: { reason: 'ETC', detail: '무단 도용이에요' } },
    ])
  })

  it('이미 신고한 글이면(4xx) 실패 스낵바로 알린다', async () => {
    apiFailures.report = 1
    await renderView()
    await openMenuItem('신고하기')

    fireEvent.click(screen.getByRole('radio', { name: '홍보성 (스팸·광고)' }))
    fireEvent.click(screen.getByRole('button', { name: '신고 하기' }))

    expect(await screen.findByText('이미 신고했거나 신고할 수 없는 글이에요.')).toBeInTheDocument()
  })

  it('차단을 확인하면 서버에 차단을 요청하고 흔적·댓글 목록을 다시 받아온다', async () => {
    const { recorded } = await renderView()
    const opinionListCalls = () =>
      vi
        .mocked(fetch)
        .mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/opinions?')).length
    const callsBefore = opinionListCalls()

    await openMenuItem('차단하기')
    expect(await screen.findByText('다른사람님을 차단할까요?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '차단' }))

    expect(await screen.findByText('차단했어요.')).toBeInTheDocument()
    expect(recorded.blocks).toEqual(['/api/users/2/block'])
    // 차단한 사용자의 글은 서버가 걸러 준다 — 다시 받아와야 화면에서 사라진다
    await waitFor(() => {
      expect(opinionListCalls()).toBeGreaterThan(callsBefore)
    })
  })

  it('비로그인이면 신고하기가 로그인 게이트에 막힌다', async () => {
    authState.isAuthenticated = false
    await renderView()

    // 비로그인은 내 글을 알 수 없어 모든 흔적에 메뉴가 보인다 — 첫 번째(남의 흔적)를 연다
    const menus = await screen.findAllByRole('button', { name: '더보기' })
    fireEvent.click(firstOf(menus))
    fireEvent.click(await screen.findByRole('menuitem', { name: '신고하기' }))

    expect(await screen.findByText(LOGIN_GATE_MESSAGE.report)).toBeInTheDocument()
    // 게이트에 막히면 신고 시트는 열리지 않는다
    expect(screen.queryByRole('button', { name: '신고하기' })).toBeNull()
  })
})
