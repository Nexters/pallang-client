import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LikedOpinionCard } from '../_components/LikedOpinionCard/LikedOpinionCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const OPINION = {
  opinionId: 11,
  bookId: 3,
  bookTitle: '모순',
  author: '양귀자',
  bookCoverImageUrl: null,
  passageId: 91,
  quotedText: '책장 냄새가 이렇게',
  pageNumber: 128,
  content: '두꺼운 책을 멀리한지 꽤 되어서 걱정됬는데, 걱정이 무색할 정도로 술술 읽혔습니다.',
  nickname: '밤샘낭독가',
  likeCount: 4,
  createdAt: '2026-08-01T00:00:00Z',
  likedAt: '2026-08-02T00:00:00Z',
}

/** 하트 버튼 이름은 행마다 다르다 — 어느 카드의 하트인지 이름만으로 갈라야 한다 */
const HEART_LABEL = `${OPINION.nickname}님의 흔적 좋아요`

/** 서버처럼 토글이 상태를 뒤집어야 되돌리기까지 이어서 볼 수 있다 */
function stubApi() {
  const requests: { url: string; method: string }[] = []
  let liked = true

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      requests.push({ url, method: options?.method ?? 'GET' })
      liked = !liked
      return Promise.resolve(
        new Response(JSON.stringify({ data: { liked, likeCount: liked ? 4 : 3 } })),
      )
    }),
  )

  return requests
}

function pressHeart() {
  return userEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
}

function expectHeartPressed(pressed: boolean) {
  return waitFor(() => {
    expect(screen.getByRole('button', { name: HEART_LABEL })).toHaveAttribute(
      'aria-pressed',
      String(pressed),
    )
  })
}

describe('좋아요 카드', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('되돌리기는 토글이 아니라 복구다 — 이미 켜져 있으면 아무 요청도 보내지 않는다', async () => {
    const requests = stubApi()
    const unliked: { undo: () => void }[] = []
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <LikedOpinionCard
          opinion={OPINION}
          onUnlike={(target) => {
            unliked.push(target)
          }}
        />
      </QueryClientProvider>,
    )

    await pressHeart()
    await expectHeartPressed(false)

    // 안내를 둔 채 하트를 직접 다시 눌러 복구한 경우
    await pressHeart()
    await expectHeartPressed(true)

    await act(async () => {
      unliked[0]?.undo()
      await Promise.resolve()
    })

    // 상대 토글이면 여기서 좋아요가 도로 꺼지고 요청이 한 번 더 나간다
    await expectHeartPressed(true)
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(2)
  })

  it('하트를 다시 켜면 되돌릴 것이 없다고 알린다', async () => {
    stubApi()
    const relikes: number[] = []
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <LikedOpinionCard
          opinion={OPINION}
          onUnlike={vi.fn()}
          onRelike={(id) => relikes.push(id)}
        />
      </QueryClientProvider>,
    )

    await pressHeart()
    await expectHeartPressed(false)
    await pressHeart()

    expect(relikes).toEqual([OPINION.opinionId])
  })
})
