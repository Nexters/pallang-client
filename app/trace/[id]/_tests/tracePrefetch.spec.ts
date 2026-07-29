import { QueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { opinionQueries } from '@/app/_global/_queries/opinion.queries'
import { passageQueries } from '@/app/_global/_queries/passage.queries'

import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'
import { TracePrefetchBoundary } from '../_components/TracePrefetchBoundary/TracePrefetchBoundary'
import { DEFAULT_OPINION_SORT_TYPE } from '../_data/readerHighlights.constant'
import { parseBookId, prefetchTraceScreen } from '../_services/tracePrefetch.service'

const { cookieState, notFoundMock } = vi.hoisted(() => ({
  cookieState: { token: null as string | null },
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

// 서버 컴포넌트가 읽는 요청 쿠키를 테스트가 제어한다
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        cookieState.token === null ? undefined : { name, value: cookieState.token },
    }),
}))

vi.mock('next/navigation', () => ({ notFound: notFoundMock }))

// 이 스펙이 보는 건 서버 경계(검증·프리페치·하이드레이션)뿐이라 클라이언트 화면은 자리표시자로 둔다
vi.mock('../_components/TraceCollapseView/TraceCollapseView', () => ({
  TraceCollapseView: () => null,
}))

const BOOK_ID = 1
const FIRST_PAGE = 7
const FIRST_PASSAGE_ID = 71

type RecordedCall = { url: string; authorization: string | null }

/** 대목 페이지 목록 / 페이지별 대목 / 대목별 흔적 API를 흉내내고, 나간 요청의 인증 헤더를 기록한다 */
function stubTraceApi(): RecordedCall[] {
  const calls: RecordedCall[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      calls.push({ url, authorization: new Headers(options?.headers).get('Authorization') })
      const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))

      if (/\/pages\/\d+\/passages/.test(url)) {
        return json({
          data: {
            passages: [
              { passageId: FIRST_PASSAGE_ID, quotedText: '첫 번째 대목', isSpoiler: false },
            ],
          },
        })
      }
      if (/\/passages\/\d+\/opinions/.test(url)) {
        return json({
          data: {
            opinions: [
              {
                opinionId: 1,
                userId: 1,
                nickname: '책책책을읽자',
                content: '첫 번째 흔적',
                likeCount: 0,
                createdAt: '2026-07-23T02:00:00.000Z',
              },
            ],
            pageInfo: { page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false },
          },
        })
      }
      return json({ data: { pageNumbers: [FIRST_PAGE, 9] } })
    }),
  )

  return calls
}

function readPrefetched(queryClient: QueryClient) {
  return {
    pageNumbers: queryClient.getQueryData(passageQueries.pageNumbers(BOOK_ID).queryKey),
    passages: queryClient.getQueryData(passageQueries.passagesByPage(BOOK_ID, FIRST_PAGE).queryKey),
    opinions: queryClient.getQueryData(
      opinionQueries.listByPassage(FIRST_PASSAGE_ID, DEFAULT_OPINION_SORT_TYPE).queryKey,
    ),
  }
}

describe('parseBookId', () => {
  it('양의 정수 문자열만 통과시킨다', () => {
    expect(parseBookId('12')).toBe(12)
  })

  it.each(['abc', '', '0', '-3', '1.5', '1e2', ' 1'])('%s는 무효로 본다', (id) => {
    expect(parseBookId(id)).toBeUndefined()
  })
})

describe('흔적 페이지 서버 프리페치', () => {
  beforeEach(() => {
    cookieState.token = 'server-access-token'
    notFoundMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('첫 화면에 필요한 세 쿼리를 서버에서 채운다', async () => {
    stubTraceApi()
    const queryClient = new QueryClient()

    await prefetchTraceScreen(queryClient, BOOK_ID)

    const prefetched = readPrefetched(queryClient)
    expect(prefetched.pageNumbers?.pages[0]?.data?.pageNumbers).toEqual([FIRST_PAGE, 9])
    expect(prefetched.passages?.data?.passages[0]?.passageId).toBe(FIRST_PASSAGE_ID)
    expect(prefetched.opinions?.pages[0]?.data?.opinions[0]?.content).toBe('첫 번째 흔적')
  })

  it('쿠키의 accessToken을 요청 스코프로 실어 보낸다', async () => {
    const calls = stubTraceApi()

    await prefetchTraceScreen(new QueryClient(), BOOK_ID)

    expect(calls).toHaveLength(3)
    expect(calls.every((call) => call.authorization === 'Bearer server-access-token')).toBe(true)
  })

  it('쿠키가 없으면 비인증으로 프리페치하고 화면 데이터는 그대로 채운다', async () => {
    cookieState.token = null
    const calls = stubTraceApi()
    const queryClient = new QueryClient()

    await prefetchTraceScreen(queryClient, BOOK_ID)

    expect(calls.every((call) => call.authorization === null)).toBe(true)
    expect(readPrefetched(queryClient).opinions?.pages[0]?.data?.opinions).toHaveLength(1)
  })

  it('조회가 실패해도 예외를 던지지 않고 빈 캐시로 넘어간다(클라이언트가 다시 조회한다)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response('{}', { status: 500 }))),
    )
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    await expect(prefetchTraceScreen(queryClient, BOOK_ID)).resolves.toBeUndefined()
    expect(readPrefetched(queryClient).pageNumbers).toBeUndefined()
  })
})

describe('TracePrefetchBoundary', () => {
  beforeEach(() => {
    cookieState.token = 'server-access-token'
    notFoundMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('유효하지 않은 [id]는 notFound로 처리한다', async () => {
    stubTraceApi()

    await expect(TracePrefetchBoundary({ params: Promise.resolve({ id: 'abc' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    )
    expect(notFoundMock).toHaveBeenCalled()
    // 프리페치까지 가지 않으므로 서버에서 나가는 요청도 없다
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('유효한 [id]는 숫자로 바꿔 화면에 내려준다', async () => {
    stubTraceApi()

    const boundary = (await TracePrefetchBoundary({
      params: Promise.resolve({ id: '1' }),
    })) as ReactElement<{ children: ReactElement<{ bookId: number }> }>

    expect(notFoundMock).not.toHaveBeenCalled()
    expect(boundary.props.children.type).toBe(TraceCollapseView)
    expect(boundary.props.children.props.bookId).toBe(BOOK_ID)
  })
})
