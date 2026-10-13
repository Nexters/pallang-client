import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { markWithdrawalCompleted } from '@/app/_global/_services/withdrawal.service'

import { MyPageContent } from '../_components/MyPageContent/MyPageContent'
import type { MyUser } from '../_types/myUser.type'

const { authState, signOutMock } = vi.hoisted(() => ({
  authState: { status: 'authenticated' },
  signOutMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.status === 'authenticated',
    signOut: signOutMock,
  }),
}))

const ME: MyUser = { nickname: '밤샘낭독가', opinionCount: 125, profileImageUrl: null }

/** me 조회 응답을 정한다. status를 주면 그 코드로 실패시킨다. */
function stubMe({ status = 200, me = ME }: { status?: number; me?: MyUser } = {}) {
  const calls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      calls.push(url)
      if (status !== 200) return Promise.resolve(new Response('{}', { status }))
      return Promise.resolve(new Response(JSON.stringify({ data: me })))
    }),
  )
  return calls
}

function renderContent() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <LoginGateProvider>
        <MyPageContent />
      </LoginGateProvider>
    </QueryClientProvider>,
  )
}

describe('마이페이지 홈', () => {
  beforeEach(() => {
    authState.status = 'authenticated'
    signOutMock.mockReset()
    signOutMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.sessionStorage.clear()
  })

  // 이 화면은 bg-bg-default(흰색)를 깔고 있어 기본 tone('dark' = 흰 바)을 쓰면
  // 흰 바가 흰 배경에 얹혀 탈퇴 완료 안내가 사실상 보이지 않는다
  it('탈퇴 완료 안내는 밝은 배경에 얹는 어두운 바로 뜬다', async () => {
    markWithdrawalCompleted()
    authState.status = 'unauthenticated'
    stubMe()
    renderContent()

    const snackbar = await screen.findByRole('status')

    expect(snackbar).toHaveTextContent('성공적으로 탈퇴됐습니다!')
    expect(snackbar).toHaveClass('bg-bg-black')
    expect(snackbar).not.toHaveClass('bg-bg-default')
  })

  // me()는 retry: false라 5xx·네트워크 끊김 한 번에 실패로 굳는다.
  // 그때 비로그인 화면으로 떨어뜨리면 로그인한 사용자에게서 내 서재·로그아웃이 사라진다.
  it('프로필 조회가 실패해도 로그인 상태의 메뉴를 유지한다', async () => {
    stubMe({ status: 500 })
    renderContent()

    expect(await screen.findByText('프로필을 불러오지 못했어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '내 서재' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
    expect(screen.queryByText('안녕하세요!')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '로그인 하기' })).not.toBeInTheDocument()
  })

  it('프로필 조회 실패는 다시 불러오기로 회복된다', async () => {
    let shouldFail = true
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        if (shouldFail) return Promise.resolve(new Response('{}', { status: 500 }))
        return Promise.resolve(new Response(JSON.stringify({ data: ME })))
      }),
    )
    renderContent()
    await screen.findByText('프로필을 불러오지 못했어요.')

    shouldFail = false
    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByText('밤샘낭독가')).toBeInTheDocument()
  })

  // signOut은 실패를 다시 던진다 — void로 버리면 unhandled rejection만 남고
  // 사용자는 아무 안내도 받지 못한다
  it('로그아웃에 실패하면 스낵바로 알린다', async () => {
    signOutMock.mockRejectedValue(new Error('토큰 정리 실패'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    stubMe()
    renderContent()
    await screen.findByText('밤샘낭독가')

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    const snackbar = await screen.findByRole('status')
    expect(snackbar).toHaveTextContent('로그아웃하지 못했어요')
    expect(snackbar).toHaveClass('bg-bg-black')
  })

  it('로그아웃이 도는 동안 버튼을 잠가 중복 요청을 막는다', async () => {
    let release = () => undefined
    signOutMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = () => {
            resolve()
            return undefined
          }
        }),
    )
    stubMe()
    renderContent()
    await screen.findByText('밤샘낭독가')

    const logout = screen.getByRole('button', { name: '로그아웃' })
    await userEvent.click(logout)

    await waitFor(() => {
      expect(logout).toBeDisabled()
    })
    await userEvent.click(logout)
    expect(signOutMock).toHaveBeenCalledTimes(1)

    release()
    await waitFor(() => {
      expect(logout).toBeEnabled()
    })
  })

  // 카카오 CDN URL은 만료된다 — 404가 나면 웹뷰가 이미지 대신 오류 표시를 낸다
  it('프로필 이미지가 깨지면 기본 이미지로 내려앉는다', async () => {
    stubMe({ me: { ...ME, profileImageUrl: 'https://cdn.kakao.test/expired.jpg' } })
    renderContent()
    await screen.findByText('밤샘낭독가')

    const avatar = document.querySelector('img[src="https://cdn.kakao.test/expired.jpg"]')
    if (!avatar) throw new Error('프로필 이미지를 찾지 못했다')

    fireEvent.error(avatar)

    expect(avatar.getAttribute('src')).toBe('/images/profile-character-orange.webp')

    // 기본 이미지까지 실패해도 같은 src를 다시 넣어 되돌지 않는다
    fireEvent.error(avatar)
    expect(avatar.getAttribute('src')).toBe('/images/profile-character-orange.webp')
  })
})
