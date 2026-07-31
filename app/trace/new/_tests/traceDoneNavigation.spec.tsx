import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TraceDoneView } from '../_components/TraceDoneView/TraceDoneView'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceStepGuard } from '../_components/TraceStepGuard/TraceStepGuard'
import { useTraceDraft } from '../_hooks/useTraceDraft'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new/done' } }))
// 호출 '순서'를 봐야 해서 인자 타입을 좁혀 둔다 — 가드의 되돌림이 뒤따라 붙는지가 관심사다
const replaceMock = vi.fn<(path: string) => void>()

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

const BOOK_ID = 11

/** 흔적을 저장하고 완료 화면에 도착한 상태를 만든다. 가드 바깥에 둬야 초안을 채울 수 있다. */
function DoneProbe() {
  const { dispatch } = useTraceDraft()

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dispatch({
            type: 'selectBook',
            book: {
              bookId: BOOK_ID,
              title: '모순',
              author: '양귀자',
              coverImageUrl: null,
              pageCount: 300,
            },
          })
          dispatch({ type: 'setResult', result: { opinionId: 5, merged: false } })
        }}
      >
        흔적 저장됨
      </button>
      <TraceStepGuard>
        <TraceDoneView />
      </TraceStepGuard>
    </>
  )
}

function renderDone() {
  navState.pathname = '/trace/new/done'
  render(
    <TraceDraftProvider>
      <DoneProbe />
    </TraceDraftProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: '흔적 저장됨' }))
  // 초안이 채워지기 전 첫 렌더에서 가드가 부른 것은 이 테스트의 관심사가 아니다
  replaceMock.mockClear()
}

describe('완료 화면에서 나가기', () => {
  beforeEach(() => {
    replaceMock.mockClear()
  })

  it('흔적 확인하러 가기는 그 책의 흔적 보기 화면으로만 이동한다', () => {
    renderDone()

    fireEvent.click(screen.getByRole('button', { name: '흔적 확인하러 가기' }))

    // 초안을 비우면 가드가 '완료 화면인데 결과가 없다'고 보고 첫 화면으로 되돌린다.
    // 그 되돌림이 이 이동을 덮어쓰면 사용자는 책 검색 화면에 떨어진다.
    expect(replaceMock.mock.calls.map(([path]) => path)).toEqual([`/trace/${String(BOOK_ID)}`])
  })

  it('뒤로는 홈으로만 이동한다', () => {
    renderDone()

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    expect(replaceMock.mock.calls.map(([path]) => path)).toEqual(['/'])
  })
})
