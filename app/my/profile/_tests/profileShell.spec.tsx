import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { userQueries } from '@/app/_global/_queries/user.queries'

import { ProfileSettingsContent } from '../_components/ProfileSettingsContent/ProfileSettingsContent'

const { authState } = vi.hoisted(() => ({
  authState: { status: 'loading' },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.status === 'authenticated',
    signOut: vi.fn(),
  }),
}))

type SeedMe = {
  userId: number
  nickname: string
  email?: null | string
  profileImageUrl?: null | string
  snsProvider: 'APPLE' | 'KAKAO'
  opinionCount: number
}

function renderWith(seedMe?: SeedMe) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (seedMe) client.setQueryData(userQueries.me().queryKey, { data: seedMe })
  render(
    <QueryClientProvider client={client}>
      <ProfileSettingsContent />
    </QueryClientProvider>,
  )
}

/** 셸이 살아 있으면 타이틀과 뒤로가기가 함께 잡힌다 */
function queryShell() {
  return [
    screen.queryByRole('heading', { name: '프로필 설정' }),
    screen.queryByRole('button', { name: '뒤로 가기' }),
  ]
}

describe('프로필 설정 셸', () => {
  beforeEach(() => {
    authState.status = 'loading'
  })

  it('인증 판별 전에도 TopBar와 타이틀이 화면에 남는다', () => {
    renderWith()

    expect(queryShell().every(Boolean)).toBe(true)
    // 본문은 골격으로 채운다 — 폼이 먼저 그려지면 도착 시 값이 튄다
    expect(screen.queryByLabelText('닉네임')).not.toBeInTheDocument()
  })

  it('프로필이 도착하면 같은 셸 안에 폼이 들어선다', () => {
    authState.status = 'authenticated'
    renderWith({
      userId: 1,
      nickname: '기록광',
      email: 'pallang@example.com',
      profileImageUrl: null,
      snsProvider: 'KAKAO',
      opinionCount: 3,
    })

    expect(queryShell().every(Boolean)).toBe(true)
    expect(screen.getByLabelText('닉네임')).toHaveValue('기록광')
    expect(screen.getByText('가입 아이디')).toBeInTheDocument()
    expect(screen.getByText('pallang@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회원탈퇴' })).toBeInTheDocument()
  })

  it('email이 없으면 가입 아이디 블록을 통째로 그리지 않는다', () => {
    authState.status = 'authenticated'
    renderWith({
      userId: 1,
      nickname: '기록광',
      email: null,
      profileImageUrl: null,
      snsProvider: 'APPLE',
      opinionCount: 0,
    })

    expect(screen.getByLabelText('닉네임')).toHaveValue('기록광')
    expect(screen.queryByText('가입 아이디')).not.toBeInTheDocument()
  })
})
