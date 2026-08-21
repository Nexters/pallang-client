import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { Activity } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'

import { OcrCaptureBoundary } from '../_components/OcrCaptureBoundary/OcrCaptureBoundary'
import { TraceCaptureProvider } from '../_components/TraceCaptureProvider/TraceCaptureProvider'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'

const { navState, takePhotoMock } = vi.hoisted(() => ({
  navState: { pathname: '/trace/new/photo' },
  takePhotoMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({ takePhoto: takePhotoMock }),
}))

vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  createOcrResult: () =>
    Promise.resolve({
      data: {
        blocks: [
          {
            text: '문장',
            boundingBox: {
              vertices: [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 10 },
                { x: 0, y: 10 },
              ],
            },
          },
        ],
      },
    }),
  checkSimilarPassages: () => Promise.resolve({ data: { passages: [] } }),
}))

/**
 * Next는 다음 단계로 넘어가도 화면을 언마운트하지 않고 <Activity>로 감춰 두었다가 되살린다
 * (Cache Components). 실제 라우터 대신 그 감춤/되살림과 경로 변화만 흉내 낸다.
 */
function renderStep() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const tree = (mode: 'hidden' | 'visible') => (
    <QueryClientProvider client={queryClient}>
      <AppBackProvider>
        <TraceDraftProvider>
          <TraceCaptureProvider>
            <TraceOverlayProvider>
              <TraceNavProvider>
                <Activity mode={mode}>
                  <OcrCaptureBoundary />
                </Activity>
              </TraceNavProvider>
            </TraceOverlayProvider>
          </TraceCaptureProvider>
        </TraceDraftProvider>
      </AppBackProvider>
    </QueryClientProvider>
  )
  const { rerender } = render(tree('visible'))
  return {
    /** 다른 단계로 넘어가 이 화면이 감춰진다 */
    leaveTo: (pathname: string) => {
      navState.pathname = pathname
      rerender(tree('hidden'))
    },
    /** 사진 단계로 돌아와 이 화면이 되살아난다 */
    comeBack: () => {
      navState.pathname = '/trace/new/photo'
      rerender(tree('visible'))
    },
  }
}

function photo(webPath: string) {
  return { webPath, blob: new Blob(['x'], { type: 'image/png' }) }
}

beforeEach(() => {
  navState.pathname = '/trace/new/photo'
  takePhotoMock.mockReset()
})

describe('사진 단계에 다시 들어가기', () => {
  it('다시 들어가면 촬영을 새로 시작해 새 사진을 보여준다', async () => {
    // 되살아난 화면이 지난 판을 이어 쓰면, 새로 시작한 촬영이 갈 곳을 잃고 그대로 버려진다.
    // 남아 있는 지난 사진의 blob URL은 화면이 감춰질 때 이미 해제된 주소다.
    takePhotoMock
      .mockResolvedValueOnce(photo('blob:첫-번째'))
      .mockResolvedValueOnce(photo('blob:두-번째'))
    const step = renderStep()

    await waitFor(() => {
      expect(screen.getByAltText('촬영한 책 페이지').getAttribute('src')).toBe('blob:첫-번째')
    })

    step.leaveTo('/trace/new/write')
    step.comeBack()

    await waitFor(() => {
      expect(screen.getByAltText('촬영한 책 페이지').getAttribute('src')).toBe('blob:두-번째')
    })
    expect(takePhotoMock).toHaveBeenCalledTimes(2)
  })

  it('머무는 동안에는 촬영을 다시 시작하지 않는다', async () => {
    // 리렌더마다 새 판을 열면 카메라가 계속 다시 뜬다 — 판이 갈리는 것은 단계를 다시 밟을 때뿐이다.
    takePhotoMock.mockResolvedValue(photo('blob:하나'))
    const step = renderStep()

    await waitFor(() => {
      expect(screen.getByAltText('촬영한 책 페이지')).toBeTruthy()
    })

    step.comeBack()
    step.comeBack()

    expect(takePhotoMock).toHaveBeenCalledTimes(1)
  })
})
