import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { act, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceDetailOverlay } from '../_components/TraceDetailOverlay/TraceDetailOverlay'
import type { Trace } from '../_types/readerHighlights.type'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

const trace: Trace = {
  opinionId: 1,
  userId: 2,
  nickname: '밤의독서가',
  content: '흔적 본문',
  createdAt: '2026-07-27T00:00:00.000Z',
  likeCount: 3,
  commentCount: 0,
}

// TraceDetailOverlay가 쓰는 조회(댓글 목록, 내 정보)만 최소로 흉내낸다 — 전환 자체와는 무관하다.
function stubApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))
      if (url.includes('/users/me')) return json({ data: { userId: 10, nickname: '나' } })
      if (url.includes('/comments')) {
        return json({
          data: {
            comments: [],
            pageInfo: { page: 0, size: 100, totalElements: 0, totalPages: 1, hasNext: false },
          },
        })
      }
      return json({ data: {} })
    }),
  )
}

/**
 * TraceCollapseView의 배선(useExitTransition + useLastPresent + TraceDetailOverlay)을 그대로
 * 재현한 테스트 전용 래퍼. TraceCollapseView 전체를 띄우는 대신 최소 구성으로 검증한다.
 */
function OverlayHarness() {
  const [open, setOpen] = useState(true)
  // TraceCollapseView의 selectedTrace(Trace | undefined)를 흉내내 null로 정규화한다
  const shownTrace = useLastPresent(open ? trace : null)
  const detail = useExitTransition(open, MOTION_DURATION.slow)

  return (
    <>
      {detail.shouldRender && shownTrace && (
        <TraceDetailOverlay
          trace={shownTrace}
          state={detail.state}
          quote={{ text: '인용문', isSpoiler: false, decorations: [] }}
          onClose={() => {
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

function renderHarness() {
  stubApi()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <LoginGateProvider>
        <OverlayHarness />
      </LoginGateProvider>
    </QueryClientProvider>,
  )
}

describe('TraceDetailOverlay 슬라이드 전환', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('마운트 시점부터 열려 있으면 등장 전환 없이 open 상태다', () => {
    renderHarness()

    expect(screen.getByRole('dialog', { name: '의견 상세' })).toHaveAttribute('data-state', 'open')
  })

  it('닫아도 duration 동안 내용을 유지한 채 남아 있다가 사라진다', () => {
    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    // 퇴장 전환 중에도 내용이 남아 있어야 슬라이드 아웃이 빈 화면으로 보이지 않는다
    const overlay = screen.getByRole('dialog', { name: '의견 상세' })
    expect(overlay).toHaveAttribute('data-state', 'exiting')
    expect(screen.getByText('흔적 본문')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(MOTION_DURATION.slow - 1)
    })
    expect(screen.getByRole('dialog', { name: '의견 상세' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByRole('dialog', { name: '의견 상세' })).not.toBeInTheDocument()
  })
})
