import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'

import { TraceDecorateForm } from '../_components/TraceDecorateForm/TraceDecorateForm'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/decorate',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

const QUOTE = '어떤 문장'

// dispatch는 effect에서만 부른다(렌더 중 부르면 Provider를 렌더 도중 갱신하게 된다)
function Seeded({ onDraft }: { onDraft: (count: number) => void }) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    dispatch({ type: 'setQuotedText', quotedText: QUOTE })
    dispatch({ type: 'setPageDetail', pageNumber: 10, isSpoiler: false })
    dispatch({ type: 'setContent', content: '좋았다' })
  }, [dispatch])

  onDraft(draft.decorations.length)
  if (!draft.quotedText) return null
  return <TraceDecorateForm />
}

/** 글자 span 위를 끄는 시늉. elementFromPoint가 오프셋 span을 돌려주게 한다. */
function dragOver(from: number, to: number) {
  const charAt = (offset: number) => document.querySelector(`[data-offset="${String(offset)}"]`)
  // 글자 span을 품은 문단이 곧 노트다. 그냥 첫 <p>를 집으면 화면 위쪽(책 줄 등)의 문단을
  // 잡아 드래그가 노트에 닿지 않는다.
  const note = charAt(0)?.closest('p')
  if (!note) throw new Error('노트를 찾지 못했다')

  vi.spyOn(document, 'elementFromPoint').mockImplementation(() => charAt(from))
  fireEvent.pointerDown(note, { clientX: 1, clientY: 1, pointerId: 1 })
  vi.spyOn(document, 'elementFromPoint').mockImplementation(() => charAt(to))
  fireEvent.pointerMove(note, { clientX: 2, clientY: 1, pointerId: 1 })
  fireEvent.pointerUp(note, { pointerId: 1 })
}

function renderForm(onDraft: (count: number) => void) {
  return render(
    <AppBackProvider>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <Seeded onDraft={onDraft} />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </AppBackProvider>,
  )
}

describe('효과를 먼저 고르고 드래그하기', () => {
  beforeEach(() => {
    // setPointerCapture는 happy-dom에 없다
    Element.prototype.setPointerCapture = vi.fn()
  })

  it('효과를 고르지 않고 끌면 아무 효과도 들어가지 않는다', async () => {
    let count = -1
    renderForm((next) => {
      count = next
    })

    await screen.findByRole('button', { name: /형광펜/ })
    dragOver(0, 2)

    expect(count).toBe(0)
    expect(screen.getByText(/효과를 먼저 선택/)).toBeTruthy()
  })

  it('효과를 고른 뒤 끌면 손을 떼는 순간 그 효과가 들어간다', async () => {
    let count = -1
    renderForm((next) => {
      count = next
    })

    fireEvent.click(await screen.findByRole('button', { name: /형광펜/ }))
    dragOver(0, 2)

    expect(count).toBe(1)
  })

  it('효과는 적용 후에도 골라진 채 남아 연속으로 칠할 수 있다', async () => {
    let count = -1
    renderForm((next) => {
      count = next
    })

    fireEvent.click(await screen.findByRole('button', { name: /형광펜/ }))
    dragOver(0, 1)
    dragOver(3, 4)

    expect(count).toBe(2)
  })
})
