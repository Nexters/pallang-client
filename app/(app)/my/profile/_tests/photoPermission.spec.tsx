import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CameraPermissionDeniedError } from '@/app/_global/_data/camera.model'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { openAppSettings } from '@/app/_global/_services/appSettings.service'

import { ProfileSettingsContent } from '../_components/ProfileSettingsContent/ProfileSettingsContent'

const { takePhoto } = vi.hoisted(() => ({ takePhoto: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))
vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({ takePhoto }),
}))
vi.mock('@/app/_global/_services/appSettings.service', () => ({
  openAppSettings: vi.fn(),
}))

function renderProfile() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(userQueries.me().queryKey, {
    data: {
      userId: 1,
      nickname: '기록광',
      email: 'pallang@example.com',
      profileImageUrl: null,
      snsProvider: 'KAKAO',
      opinionCount: 0,
    },
  })
  render(
    <QueryClientProvider client={client}>
      <ProfileSettingsContent />
    </QueryClientProvider>,
  )
}

async function clickEditImage() {
  await userEvent.click(screen.getByRole('button', { name: '프로필 이미지 변경' }))
}

describe('프로필 이미지 변경의 사진 권한 안내', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // "잠시 후 다시 시도"는 거짓말이다 — 권한이 꺼진 동안에는 몇 번을 눌러도 같은 자리에서 막힌다.
  it('사진 권한이 거부돼 있으면 스낵바 대신 설정 안내 모달을 띄운다', async () => {
    takePhoto.mockRejectedValue(new CameraPermissionDeniedError('photos'))

    renderProfile()
    await clickEditImage()

    expect(await screen.findByText('사진 권한이 꺼져 있어요')).toBeInTheDocument()
    expect(screen.queryByText(/잠시 후 다시 시도해주세요/)).not.toBeInTheDocument()
  })

  it('설정 열기를 누르면 OS 설정을 열고 모달을 닫는다', async () => {
    takePhoto.mockRejectedValue(new CameraPermissionDeniedError('photos'))

    renderProfile()
    await clickEditImage()
    await userEvent.click(await screen.findByRole('button', { name: '설정 열기' }))

    expect(openAppSettings).toHaveBeenCalled()
  })

  it('권한과 무관한 실패는 기존 안내를 그대로 쓴다', async () => {
    takePhoto.mockRejectedValue(new Error('boom'))

    renderProfile()
    await clickEditImage()

    expect(await screen.findByText(/사진을 불러오지 못했어요/)).toBeInTheDocument()
    expect(screen.queryByText('사진 권한이 꺼져 있어요')).not.toBeInTheDocument()
  })
})
