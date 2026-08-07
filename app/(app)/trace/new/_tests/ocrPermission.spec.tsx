import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CameraPermissionDeniedError } from '@/app/_global/_data/camera.model'
import { openAppSettings } from '@/app/_global/_services/appSettings.service'

import { OcrSelector } from '../_components/OcrSelector/OcrSelector'

type AppStateHandler = (state: { isActive: boolean }) => void

const { takePhoto, appStateHandlers } = vi.hoisted(() => ({
  takePhoto: vi.fn(),
  appStateHandlers: [] as ((state: { isActive: boolean }) => void)[],
}))

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({ takePhoto }),
}))
vi.mock('@/app/_global/_services/appSettings.service', () => ({
  openAppSettings: vi.fn(),
}))
// 등록된 핸들러를 직접 잡아 둔다 — 네이티브 이벤트를 테스트에서 흉내 내는 유일한 통로다.
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (event: string, handler: AppStateHandler) => {
      if (event === 'appStateChange') appStateHandlers.push(handler)
      return Promise.resolve({ remove: vi.fn() })
    },
  },
}))

/**
 * 앱이 포그라운드로 돌아오는(또는 내려가는) 순간을 흉내 낸다.
 *
 * 리스너 등록을 기다린 뒤에 쏜다 — 안내 화면이 그려지는 시점과 effect가 도는 시점은
 * 같은 커밋이지만 스케줄링에 따라 어긋날 수 있고, 핸들러가 없으면 아무 일도 없이 지나가
 * 테스트가 산발적으로 실패한다.
 */
async function emitAppState(isActive: boolean) {
  await waitFor(() => {
    expect(appStateHandlers).not.toHaveLength(0)
  })
  await act(async () => {
    appStateHandlers.at(-1)?.({ isActive })
    await Promise.resolve()
  })
}
vi.mock('../_hooks/useTraceNav', () => ({
  useTraceNav: () => ({ goBack: vi.fn(), goTo: vi.fn() }),
}))
vi.mock('../_hooks/useTraceDraft', () => ({
  useTraceDraft: () => ({ dispatch: vi.fn(), draft: {} }),
}))

function renderSelector() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <OcrSelector />
    </QueryClientProvider>,
  )
}

describe('OCR 화면의 권한 거부 안내', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appStateHandlers.length = 0
  })

  // 한 번 거부한 권한은 앱에서 다시 물을 수 없다. "다시 찍기"가 아니라 설정으로 보내야 한다.
  it('카메라 권한이 거부돼 있으면 설정 열기와 갤러리 대안을 함께 내놓는다', async () => {
    takePhoto.mockRejectedValue(new CameraPermissionDeniedError('camera'))

    renderSelector()

    expect(await screen.findByRole('button', { name: '설정 열기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '갤러리에서 선택하기' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('카메라 권한이 꺼져 있어요.')
    // 권한 안내는 일반 촬영 실패 문구를 대신한다 — 두 안내가 겹치면 안 된다
    expect(screen.queryByText(/카메라를 열지 못했어요/)).not.toBeInTheDocument()
  })

  it('설정 열기를 누르면 OS 설정 화면을 연다', async () => {
    takePhoto.mockRejectedValue(new CameraPermissionDeniedError('camera'))

    renderSelector()
    await userEvent.click(await screen.findByRole('button', { name: '설정 열기' }))

    expect(openAppSettings).toHaveBeenCalled()
  })

  // 사진 권한까지 막혔으면 갤러리 버튼을 눌러도 같은 벽이다. 누를 수 없는 길을 남기지 않는다.
  it('사진 권한이 거부된 경우 갤러리 대안을 내놓지 않는다', async () => {
    takePhoto.mockRejectedValue(new CameraPermissionDeniedError('photos'))

    renderSelector()

    expect(await screen.findByRole('button', { name: '설정 열기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '갤러리에서 선택하기' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('사진 권한이 꺼져 있어요.')
  })

  // Android는 설정에서 권한을 켜도 앱이 살아 있어 이 화면으로 그대로 돌아온다.
  // 사용자가 버튼을 한 번 더 누르게 만들지 않는다. (iOS는 권한 변경 시 앱이 종료돼 해당 없음)
  it('설정에 다녀와 앱이 활성화되면 촬영을 다시 시도한다', async () => {
    takePhoto.mockRejectedValue(new CameraPermissionDeniedError('camera'))

    renderSelector()
    await screen.findByRole('button', { name: '설정 열기' })
    expect(takePhoto).toHaveBeenCalledTimes(1)

    // 취소로 돌려 OCR 요청까지 이어지지 않게 한다 — 여기서 볼 것은 재시도 여부뿐이다
    takePhoto.mockResolvedValue(null)
    await emitAppState(true)

    await waitFor(() => {
      expect(takePhoto).toHaveBeenCalledTimes(2)
    })
  })

  it('백그라운드로 내려갈 때는 촬영을 다시 시도하지 않는다', async () => {
    takePhoto.mockRejectedValue(new CameraPermissionDeniedError('camera'))

    renderSelector()
    await screen.findByRole('button', { name: '설정 열기' })

    await emitAppState(false)

    expect(takePhoto).toHaveBeenCalledTimes(1)
  })

  // 권한 거부가 아닌 실패는 지금처럼 재시도 가능한 안내로 남아야 한다.
  it('권한과 무관한 촬영 실패에는 설정 열기를 띄우지 않는다', async () => {
    takePhoto.mockRejectedValue(new Error('No camera available'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderSelector()

    expect(await screen.findByText(/카메라를 열지 못했어요/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '설정 열기' })).not.toBeInTheDocument()
  })
})
