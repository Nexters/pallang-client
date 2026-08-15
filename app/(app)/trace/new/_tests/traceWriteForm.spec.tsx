import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceWriteForm } from '../_components/TraceWriteForm/TraceWriteForm'
import { useTraceDraft } from '../_hooks/useTraceDraft'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/write',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

// 대목을 담아 둔 상태에서 시작해야 실제 진입 조건과 같다.
// dispatch는 반드시 effect에서 부른다 — 렌더 중에 부르면 Provider를 렌더 도중 갱신하게 되어
// "Cannot update a component while rendering a different component" 경고가 난다.
function Seeded() {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    dispatch({ type: 'setQuotedText', quotedText: '어떤 문장' })
  }, [dispatch])

  if (!draft.quotedText) return null
  return <TraceWriteForm />
}

// '다음'이 화면을 넘기는 것만으로는 부족하다 — 페이지·스포일러가 실제로 초안에 남았는지
// 읽어야 한다(넘어간 뒤에는 화면이 사라져 입력값으로 확인할 수 없다).
function DraftProbe() {
  const { draft } = useTraceDraft()
  return (
    <output data-testid="draft-probe">
      {[draft.pageNumber ?? '', draft.isSpoiler, draft.content].join('/')}
    </output>
  )
}

function renderForm() {
  return render(
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <Seeded />
            <DraftProbe />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>,
  )
}

describe('생각 작성 단계', () => {
  it('페이지와 의견이 모두 차야 다음으로 넘어갈 수 있다', async () => {
    replaceMock.mockClear()
    renderForm()

    const next = await screen.findByRole('button', { name: '다음' })
    expect(next.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByLabelText('페이지'), { target: { value: '100' } })
    expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByPlaceholderText('문장에 대한 생각이나 의견을 작성해보세요.'), {
      target: { value: '좋았다' },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(false)
    })
  })

  it('다음을 누르면 페이지·스포일러·의견이 함께 남고 꾸미기로 간다', async () => {
    replaceMock.mockClear()
    renderForm()

    fireEvent.change(await screen.findByLabelText('페이지'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('문장에 대한 생각이나 의견을 작성해보세요.'), {
      target: { value: '좋았다' },
    })
    // SegmentedControl 옵션은 상호배타 선택이라 role="radio"다(app/_global/_components/SegmentedControl —
    // segmentedControl.spec.tsx·moderation.spec.tsx도 같은 방식으로 쿼리한다). 브리프 원문은 'button'이었다.
    fireEvent.click(screen.getByRole('radio', { name: '있어요' }))
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/decorate')
    })
    expect(screen.getByTestId('draft-probe').textContent).toBe('100/true/좋았다')
  })

  it('책 쪽수와 무관하게 다섯 자리까지 받는다', async () => {
    renderForm()

    const page = await screen.findByLabelText('페이지')
    fireEvent.change(page, { target: { value: '123456789' } })
    expect((page as HTMLInputElement).value).toBe('12345')
  })
})
