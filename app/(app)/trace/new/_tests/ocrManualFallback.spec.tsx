import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { OcrSelector } from '../_components/OcrSelector/OcrSelector'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/photo',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({
    takePhoto: () => Promise.reject(new Error('카메라 없음')),
  }),
}))

vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  createOcrResult: () => Promise.resolve({ data: { blocks: [] } }),
  checkSimilarPassages: () => Promise.resolve({ data: { passages: [] } }),
}))

function renderSelector() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <TraceDraftProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <OcrSelector />
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceDraftProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

describe('OCR 실패 시 직접 입력', () => {
  it('카메라가 열리지 않으면 직접 입력하기를 함께 제안한다', async () => {
    // 카메라 실패는 이 화면이 그대로 로깅하는 정상 경로다 — 콘솔을 조용히 해 신호와 섞이지 않게 한다
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderSelector()

    expect(await screen.findByRole('button', { name: '직접 입력하기' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '갤러리에서 선택하기' })).toBeTruthy()
  })

  it('직접 입력으로 대목을 적으면 생각 작성 단계로 간다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    replaceMock.mockClear()
    renderSelector()

    fireEvent.click(await screen.findByRole('button', { name: '직접 입력하기' }))
    const textarea = await screen.findByPlaceholderText('문장을 입력해주세요.')
    fireEvent.change(textarea, { target: { value: '어떤 문장' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/write')
    })
  })
})
