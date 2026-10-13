import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BlockedUsersView } from '../_components/BlockedUsersView/BlockedUsersView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

type BlockedUser = {
  userId: number
  nickname: string
  profileImageUrl: string | null
  blockedAt: string
}

const NIGHT: BlockedUser = {
  userId: 7,
  nickname: '밤샘낭독가',
  profileImageUrl: null,
  blockedAt: '',
}
const DAWN: BlockedUser = {
  userId: 9,
  nickname: '새벽독서가',
  profileImageUrl: null,
  blockedAt: '',
}

type StubOptions = {
  users?: BlockedUser[]
  listStatus?: number
  /** DELETE 응답을 붙잡아 둔다 — 요청이 도는 동안의 화면을 보려면 응답이 오면 안 된다 */
  deferDelete?: boolean
}

/** 오간 요청을 순서대로 담는다. 해제가 성공하면 서버처럼 목록에서도 빼야 갱신이 눈에 보인다. */
function stubApi({ users = [NIGHT], listStatus = 200, deferDelete = false }: StubOptions = {}) {
  const requests: { url: string; method: string }[] = []
  let current = users
  const held: (() => void)[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      requests.push({ url, method })

      if (method === 'DELETE') {
        const unblockedId = Number(/users\/(\d+)\/block/.exec(url)?.[1])
        current = current.filter((user) => user.userId !== unblockedId)
        const response = new Response(JSON.stringify({ data: null }))
        if (!deferDelete) return Promise.resolve(response)
        return new Promise<Response>((resolve) => {
          held.push(() => {
            resolve(response)
          })
        })
      }

      if (listStatus !== 200) {
        return Promise.resolve(new Response('{}', { status: listStatus }))
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              users: current,
              pageInfo: {
                page: 0,
                size: 20,
                totalElements: current.length,
                totalPages: 1,
                hasNext: false,
              },
            },
          }),
        ),
      )
    }),
  )

  return {
    requests,
    deleteUrls: () => requests.filter((request) => request.method === 'DELETE').map((r) => r.url),
    releaseDelete: () => {
      held.forEach((resolve) => {
        resolve()
      })
    },
  }
}

function renderView(options?: StubOptions) {
  const api = stubApi(options)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <BlockedUsersView />
    </QueryClientProvider>,
  )
  return api
}

/** 다이얼로그의 확인 버튼 — 행 버튼은 닉네임이 붙어 이름이 겹치지 않는다 */
function confirmButton() {
  return within(screen.getByRole('dialog')).getByRole('button', { name: '차단 해제' })
}

describe('차단 유저 관리', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('행마다 닉네임이 붙은 이름으로 해제 버튼을 구분한다', async () => {
    renderView({ users: [NIGHT, DAWN] })

    expect(
      await screen.findByRole('button', { name: '밤샘낭독가님 차단 해제' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새벽독서가님 차단 해제' })).toBeInTheDocument()
  })

  it('해제 버튼을 누르면 확인 다이얼로그만 열리고 서버 요청은 아직 가지 않는다', async () => {
    const api = renderView()

    await userEvent.click(await screen.findByRole('button', { name: '밤샘낭독가님 차단 해제' }))

    expect(await screen.findByText('밤샘낭독가님의 차단을 해제하시겠어요?')).toBeInTheDocument()
    expect(api.deleteUrls()).toEqual([])
  })

  // 시안의 모달은 제목·설명·버튼뿐이다 — 마스코트가 올라오지 않는다
  it('확인 다이얼로그는 일러스트 없이 뜬다', async () => {
    renderView()

    await userEvent.click(await screen.findByRole('button', { name: '밤샘낭독가님 차단 해제' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('[data-slot="dialog-illustration"]')).toBeNull()
  })

  it('확정하면 해제를 요청하고 그 사용자만 목록에서 빠진다', async () => {
    const api = renderView({ users: [NIGHT, DAWN] })

    await userEvent.click(await screen.findByRole('button', { name: '밤샘낭독가님 차단 해제' }))
    await userEvent.click(confirmButton())

    expect(await screen.findByText('차단이 해제되었습니다.')).toBeInTheDocument()
    expect(api.deleteUrls()).toEqual(['/api/users/7/block'])
    await waitFor(() => {
      expect(screen.queryByText('밤샘낭독가')).not.toBeInTheDocument()
    })
    expect(screen.getByText('새벽독서가')).toBeInTheDocument()
  })

  it('요청이 도는 동안에는 확인 버튼이 잠기고 다이얼로그도 그대로 서 있는다', async () => {
    const api = renderView({ deferDelete: true })

    await userEvent.click(await screen.findByRole('button', { name: '밤샘낭독가님 차단 해제' }))
    await userEvent.click(confirmButton())

    await waitFor(() => {
      expect(confirmButton()).toBeDisabled()
    })
    // 먼저 닫히면 아직 남아 있는 행을 다시 눌러 중복 DELETE가 된다
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // 잠긴 버튼을 다시 눌러도 두 번째 요청은 나가지 않는다
    await userEvent.click(confirmButton())
    expect(api.deleteUrls()).toEqual(['/api/users/7/block'])

    api.releaseDelete()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('밤샘낭독가')).not.toBeInTheDocument()
  })

  it('요청이 도는 중에 다이얼로그를 닫아도 목록 행이 잠겨 다시 요청되지 않는다', async () => {
    const api = renderView({ deferDelete: true })

    await userEvent.click(await screen.findByRole('button', { name: '밤샘낭독가님 차단 해제' }))
    await userEvent.click(confirmButton())
    await waitFor(() => {
      expect(confirmButton()).toBeDisabled()
    })

    // 뒤로는 응답을 기다리게 두지 않고 바로 닫힌다 — 대신 행이 잠겨 있다
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '뒤로' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    const row = screen.getByRole('button', { name: '밤샘낭독가님 차단 해제' })
    expect(row).toBeDisabled()
    await userEvent.click(row)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.deleteUrls()).toEqual(['/api/users/7/block'])
  })

  it('다이얼로그에서 뒤로를 누르면 요청 없이 닫힌다', async () => {
    const api = renderView()

    await userEvent.click(await screen.findByRole('button', { name: '밤샘낭독가님 차단 해제' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '뒤로' }))

    expect(api.deleteUrls()).toEqual([])
    expect(screen.getByText('밤샘낭독가')).toBeInTheDocument()
  })

  it('차단한 사용자가 없으면 빈 상태 문구를 보여준다', async () => {
    renderView({ users: [] })

    expect(await screen.findByText('차단한 사용자가 없어요')).toBeInTheDocument()
  })

  it('목록을 불러오지 못하면 다시 불러오기를 준다', async () => {
    const api = renderView({ listStatus: 500 })

    expect(await screen.findByText('차단 목록을 불러오지 못했어요.')).toBeInTheDocument()
    const before = api.requests.length

    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))

    await waitFor(() => {
      expect(api.requests.length).toBeGreaterThan(before)
    })
  })
})
