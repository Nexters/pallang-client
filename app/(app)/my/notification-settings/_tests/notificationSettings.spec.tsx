import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NotificationSettingsView } from '../_components/NotificationSettingsView/NotificationSettingsView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

const PREFERENCES = {
  pushEnabled: true,
  activityCommentEnabled: true,
  activityLikeEnabled: true,
  groupInviteJoinEnabled: true,
  groupCommentEnabled: true,
  groupLikeEnabled: true,
  groupScheduleEnabled: true,
}

type StubOptions = {
  preferences?: typeof PREFERENCES
  getStatus?: number
  updateStatus?: number
}

function renderView({
  preferences = PREFERENCES,
  getStatus = 200,
  updateStatus = 200,
}: StubOptions = {}) {
  const requests: { method: string; body?: string }[] = []
  let currentPreferences = preferences
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      requests.push({ method, body: typeof options?.body === 'string' ? options.body : undefined })
      const status = method === 'PUT' ? updateStatus : getStatus
      if (method === 'PUT' && status === 200 && typeof options?.body === 'string') {
        currentPreferences = JSON.parse(options.body) as typeof PREFERENCES
      }
      const body = method === 'PUT' ? { data: null } : { data: currentPreferences }
      return Promise.resolve(new Response(JSON.stringify(body), { status }))
    }),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <NotificationSettingsView />
    </QueryClientProvider>,
  )
  return requests
}

describe('알림 설정', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('조회한 푸시와 활동·모임 알림 상태를 토글에 보여준다', async () => {
    renderView({ preferences: { ...PREFERENCES, activityCommentEnabled: false } })

    expect(await screen.findByRole('heading', { name: '알림 설정' })).toBeInTheDocument()
    const switches = await screen.findAllByRole('switch')
    expect(switches).toHaveLength(7)
    expect(screen.getByRole('switch', { name: '활동 알림 의견 및 댓글' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('이름이 같은 항목도 묶음 제목으로 구분된다', async () => {
    renderView()

    expect(
      await screen.findByRole('switch', { name: '활동 알림 의견 및 댓글' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: '모임 알림 의견 및 댓글' })).toBeInTheDocument()
  })

  it('토글을 끄면 전체 설정을 저장하고 스낵바로 알려준다', async () => {
    const user = userEvent.setup()
    const requests = renderView()

    const toggle = await screen.findByRole('switch', { name: '활동 알림 의견 및 댓글' })
    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(await screen.findByRole('status')).toHaveTextContent(
      '의견 및 댓글 알림을 비활성화했습니다.',
    )
    expect(JSON.parse(requests.find((request) => request.method === 'PUT')?.body ?? '')).toEqual({
      ...PREFERENCES,
      activityCommentEnabled: false,
    })
  })

  it('푸시 알림을 끄거나 켜면 모든 하위 알림도 함께 변경한다', async () => {
    const user = userEvent.setup()
    const requests = renderView()

    const pushToggle = await screen.findByRole('switch', { name: '푸시 알림' })
    await user.click(pushToggle)

    await waitFor(() => {
      expect(
        screen
          .getAllByRole('switch')
          .every((toggle) => toggle.getAttribute('aria-checked') === 'false'),
      ).toBe(true)
    })
    expect(screen.getByRole('switch', { name: '활동 알림 의견 및 댓글' })).toBeDisabled()
    expect(screen.getByRole('switch', { name: '모임 알림 일정 변경' })).toBeDisabled()
    expect(JSON.parse(requests.find((request) => request.method === 'PUT')?.body ?? '')).toEqual({
      pushEnabled: false,
      activityCommentEnabled: false,
      activityLikeEnabled: false,
      groupInviteJoinEnabled: false,
      groupCommentEnabled: false,
      groupLikeEnabled: false,
      groupScheduleEnabled: false,
    })

    await user.click(pushToggle)

    await waitFor(() => {
      expect(
        screen
          .getAllByRole('switch')
          .every((toggle) => toggle.getAttribute('aria-checked') === 'true'),
      ).toBe(true)
    })
    expect(screen.getByRole('switch', { name: '활동 알림 의견 및 댓글' })).toBeEnabled()
    expect(screen.getByRole('switch', { name: '모임 알림 일정 변경' })).toBeEnabled()
  })

  it('스낵바의 취소를 누르면 바꾼 토글을 되돌린다', async () => {
    const user = userEvent.setup()
    renderView()

    const toggle = await screen.findByRole('switch', { name: '푸시 알림' })
    await user.click(toggle)
    await user.click(await screen.findByRole('button', { name: '취소' }))

    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })
  })
})
