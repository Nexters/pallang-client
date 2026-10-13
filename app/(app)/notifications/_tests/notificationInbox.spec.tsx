import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NotificationResponse } from '@/app/_global/_queries/notification.queries'
import { notificationQueries } from '@/app/_global/_queries/notification.queries'

import { NotificationInboxView } from '../_components/NotificationInboxView/NotificationInboxView'

const { routerMock } = vi.hoisted(() => ({
  routerMock: {
    back: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}))

const NOTIFICATION: NotificationResponse = {
  notificationId: 42,
  type: 'OPINION_COMMENTED',
  title: '회원님의 의견에 댓글이 달렸어요',
  body: '“문장이 여기에 표시됩니다.”',
  opinionId: 7,
  bookId: 11,
  commentId: 3,
  isRead: false,
  createdAt: '2026-08-20T12:30:00',
}

const READ_NOTIFICATION: NotificationResponse = {
  ...NOTIFICATION,
  notificationId: 43,
  type: 'OPINION_LIKED',
  title: '회원님의 의견을 5명이 좋아해요',
  body: '빵충 사육 준수 사항 · 30p',
  isRead: true,
}

function renderView(notifications: NotificationResponse[] = [NOTIFICATION]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(notificationQueries.list().queryKey, {
    pages: [
      {
        data: {
          notifications,
          pageInfo: {
            page: 0,
            size: 20,
            totalElements: notifications.length,
            totalPages: 1,
            hasNext: false,
          },
        },
      },
    ],
    pageParams: [0],
  })

  render(
    <QueryClientProvider client={client}>
      <NotificationInboxView />
    </QueryClientProvider>,
  )
}

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('알림함', () => {
  beforeEach(() => {
    // useLoadMoreOnVisible이 쓰는 IntersectionObserver는 happy-dom에 없다
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
        takeRecords = () => []
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('알림 목록과 전체 개수를 보여준다', () => {
    renderView([NOTIFICATION, READ_NOTIFICATION])

    expect(screen.getByRole('heading', { name: '알림' })).toBeInTheDocument()
    expect(screen.getByText('회원님의 의견에 댓글이 달렸어요')).toBeInTheDocument()
    expect(screen.getByText('“문장이 여기에 표시됩니다.”')).toBeInTheDocument()
    expect(screen.getByText('댓글')).toBeInTheDocument()
    expect(screen.getByText('좋아요')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '2개의 알림',
      ),
    ).toBeVisible()
  })

  it('읽지 않은 알림에만 새 알림 표시를 단다', () => {
    renderView([NOTIFICATION, READ_NOTIFICATION])

    expect(screen.getAllByText('읽지 않음')).toHaveLength(1)
  })

  it('톱니 아이콘은 알림 설정 화면으로 이동한다', () => {
    renderView()

    expect(screen.getByRole('link', { name: '알림 설정' })).toHaveAttribute(
      'href',
      '/my/notification-settings',
    )
  })

  it('분류 필터 API가 생기기 전까지 전체 탭만 노출한다', () => {
    renderView()

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]).toHaveTextContent('전체')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('읽지 않은 알림을 누르면 읽음 처리하고 관련 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()
    renderView()

    await user.click(screen.getByRole('button', { name: /회원님의 의견에 댓글이 달렸어요/ }))

    expect(routerMock.push).toHaveBeenCalledWith('/trace/11?opinionId=7')
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/notifications/42/read', expect.any(Object))
    })
  })

  it('이미 읽은 알림을 누르면 읽음 처리 없이 이동만 한다', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()
    renderView([READ_NOTIFICATION])

    await user.click(screen.getByRole('button', { name: /회원님의 의견을 5명이 좋아해요/ }))

    expect(routerMock.push).toHaveBeenCalledWith('/trace/11?opinionId=7')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('모두 읽음을 누르면 전체 읽음 처리 API를 호출한다', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()
    renderView()

    await user.click(screen.getByRole('button', { name: '모두 읽음' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/notifications/read-all', expect.any(Object))
    })
  })

  it('알림이 없으면 빈 화면을 보여주고 모두 읽음을 숨긴다', () => {
    renderView([])

    expect(screen.getByText('아직 알림이 없어요.')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '0개의 알림',
      ),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: '모두 읽음' })).not.toBeInTheDocument()
  })
})
