import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'
import { useTraceNav } from '../_hooks/useTraceNav'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new' } }))
const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

// 대목이 담긴 draft에서 뒤로/이탈을 시도하는 최소 화면
function Probe() {
  const { dispatch } = useTraceDraft()
  const { goBack, requestExit } = useTraceNav()

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dispatch({
            type: 'selectBook',
            book: {
              bookId: 1,
              title: '채식주의자',
              author: '한강',
              coverImageUrl: null,
              pageCount: 268,
            },
          })
          dispatch({ type: 'setQuotedText', quotedText: '문장' })
        }}
      >
        대목 담기
      </button>
      <button type="button" onClick={goBack}>
        뒤로
      </button>
      <button type="button" onClick={requestExit}>
        닫기
      </button>
    </>
  )
}

function renderAt(pathname: string) {
  navState.pathname = pathname
  return render(
    <TraceDraftProvider>
      <TraceOverlayProvider>
        <TraceNavProvider>
          <Probe />
        </TraceNavProvider>
      </TraceOverlayProvider>
    </TraceDraftProvider>,
  )
}

describe('흔적 작성 단계 이동', () => {
  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
  })

  it('꾸미기에서 뒤로 가면 push 없이 상세로 replace한다', () => {
    renderAt('/trace/new/decorate')
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    expect(replaceMock).toHaveBeenCalledWith('/trace/new/detail')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('상세에서 뒤로 가면 책 검색으로 replace한다', () => {
    renderAt('/trace/new/detail')
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    expect(replaceMock).toHaveBeenCalledWith('/trace/new')
  })

  it('작성 중 닫기를 누르면 바로 나가지 않고 확인을 받는다', () => {
    renderAt('/trace/new/detail')
    fireEvent.click(screen.getByRole('button', { name: '대목 담기' }))
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(replaceMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '나갈게요' }))
    expect(replaceMock).toHaveBeenCalledWith('/')
  })

  it('책만 고른 상태에서 닫기를 누르면 확인 없이 나간다', () => {
    renderAt('/trace/new')
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(replaceMock).toHaveBeenCalledWith('/')
  })
})
