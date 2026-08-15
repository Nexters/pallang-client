import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceDecorateForm } from '../_components/TraceDecorateForm/TraceDecorateForm'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'

const { replaceMock, similarCheckMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  similarCheckMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/decorate',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  checkSimilarPassages: similarCheckMock,
}))

const QUOTE = '문장이 오래 남았다'

/** 꾸미기 단계에 서 있는 초안을 만들어 준다. mergeTargetId가 있으면 합칠 대목이 이미 정해진 상태다. */
function Harness({ mergeTargetId }: { mergeTargetId: number | null }) {
  const { dispatch } = useTraceDraft()

  useEffect(() => {
    dispatch({
      type: 'selectBook',
      book: { bookId: 7, title: '모순', author: '', coverImageUrl: null, pageCount: null },
    })
    dispatch({ type: 'setQuotedText', quotedText: QUOTE })
    dispatch({ type: 'setPageDetail', pageNumber: 122, isSpoiler: false })
    dispatch({
      type: 'applyDecoration',
      decoration: { startOffset: 0, endOffset: 2, effectType: 'WAVY', color: '#06D6A0' },
    })
    if (mergeTargetId !== null) {
      dispatch({ type: 'setMergeTarget', passageId: mergeTargetId })
    }
  }, [dispatch, mergeTargetId])

  return <TraceDecorateForm />
}

function renderDecorate(mergeTargetId: number | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <TraceDraftProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <Harness mergeTargetId={mergeTargetId} />
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceDraftProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

describe('합칠 대목 자동 선택', () => {
  beforeEach(() => {
    replaceMock.mockClear()
    similarCheckMock.mockReset()
    // 묻는 경로를 타면 반드시 후보가 잡히도록 둔다 — 건너뛴 것과 구분된다
    similarCheckMock.mockResolvedValue({
      data: { passages: [{ passageId: 42, quotedText: QUOTE }] },
    })
  })

  it('합칠 대목이 이미 정해져 있으면 유사 검사도 합치기 묻기도 건너뛴다', async () => {
    renderDecorate(42)

    fireEvent.click(await screen.findByRole('button', { name: '다음' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/opinion')
    })
    expect(similarCheckMock).not.toHaveBeenCalled()
  })

  it('합칠 대목이 정해지지 않았으면 종전대로 비슷한 대목을 찾아 묻는다', async () => {
    renderDecorate(null)

    fireEvent.click(await screen.findByRole('button', { name: '다음' }))

    expect(await screen.findByText(/의견을 하나로 모을까요\?/)).toBeInTheDocument()
    expect(similarCheckMock).toHaveBeenCalled()
    expect(replaceMock).not.toHaveBeenCalledWith('/trace/new/opinion')
  })
})
