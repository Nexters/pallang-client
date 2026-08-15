import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BlockedUsersView } from '../_components/BlockedUsersView/BlockedUsersView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const BLOCKED_USER = { userId: 7, nickname: '밤샘낭독가', profileImageUrl: null, blockedAt: '' }

/** 차단 해제로 간 요청 url — 확인 전에는 비어 있어야 한다 */
function stubApi() {
  const unblocked: string[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === 'DELETE') {
        unblocked.push(url)
        return Promise.resolve(new Response(JSON.stringify({ data: null })))
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              users: [BLOCKED_USER],
              pageInfo: { page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false },
            },
          }),
        ),
      )
    }),
  )

  return unblocked
}

async function renderView() {
  const unblocked = stubApi()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <BlockedUsersView />
    </QueryClientProvider>,
  )
  await screen.findByText('밤샘낭독가')
  return unblocked
}

/** 목록 행의 해제 버튼 — 다이얼로그 확인 버튼과 라벨이 같아 목록 안에서 좁힌다 */
function rowUnblockButton() {
  return within(screen.getByRole('list')).getByRole('button', { name: '차단 해제' })
}

describe('차단 유저 관리', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('해제 버튼을 누르면 확인 다이얼로그만 열리고 서버 요청은 아직 가지 않는다', async () => {
    const unblocked = await renderView()

    fireEvent.click(rowUnblockButton())

    expect(await screen.findByText('밤샘낭독가님의 차단을 해제하시겠어요?')).toBeInTheDocument()
    expect(unblocked).toEqual([])
  })

  // 시안(218:12135)의 모달은 제목·설명·버튼뿐이다 — 마스코트가 올라오지 않는다
  it('확인 다이얼로그는 일러스트 없이 뜬다', async () => {
    await renderView()

    fireEvent.click(rowUnblockButton())

    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('[data-slot="dialog-illustration"]')).toBeNull()
  })

  it('다이얼로그에서 확인하면 해제를 요청하고 스낵바로 알린다', async () => {
    const unblocked = await renderView()

    fireEvent.click(rowUnblockButton())
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: '차단 해제' }))

    expect(await screen.findByText('차단을 해제했어요.')).toBeInTheDocument()
    expect(unblocked).toEqual(['/api/users/7/block'])
  })

  it('다이얼로그에서 뒤로를 누르면 요청 없이 닫힌다', async () => {
    const unblocked = await renderView()

    fireEvent.click(rowUnblockButton())
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: '뒤로' }))

    expect(unblocked).toEqual([])
    expect(screen.getByText('밤샘낭독가')).toBeInTheDocument()
  })
})
