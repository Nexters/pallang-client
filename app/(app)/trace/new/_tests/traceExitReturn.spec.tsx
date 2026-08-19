import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { TraceCaptureProvider } from '../_components/TraceCaptureProvider/TraceCaptureProvider'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceSourceView } from '../_components/TraceSourceView/TraceSourceView'
import { TraceStepGuard } from '../_components/TraceStepGuard/TraceStepGuard'
import { useTraceNav } from '../_hooks/useTraceNav'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new' } }))
const replaceMock = vi.fn<(path: string) => void>()
const backMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: replaceMock,
    back: backMock,
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({ takePhoto: vi.fn(() => new Promise<null>(() => undefined)) }),
}))

const PASSAGE_SEED: TraceSeed = {
  bookId: 11,
  bookTitle: '모순',
  bookCoverImageUrl: null,
  groupId: null,
  passage: {
    passageId: 42,
    pageNumber: 122,
    quotedText: '문장이 오래 남았다',
    isSpoiler: false,
    decorations: [{ startOffset: 0, endOffset: 2, effectType: 'WAVY', color: '#06D6A0' }],
  },
}

function ExitProbe() {
  const { requestExit } = useTraceNav()

  return (
    <button type="button" onClick={requestExit}>
      닫기
    </button>
  )
}

/** layout과 같은 순서로 감싼다 — 가드는 nav 안에서만 성립한다 */
function tree(seed: TraceSeed | null): ReactElement {
  return (
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceCaptureProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <TraceSourceView seed={seed} />
              <ExitProbe />
              <TraceStepGuard>
                <span>단계 화면</span>
              </TraceStepGuard>
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceCaptureProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>
  )
}

/** 되감을 칸이 있는 히스토리 — 흔적 보기에서 push로 넘어온 자리를 흉내 낸다 */
function pushEntry() {
  window.history.pushState({}, '', '/trace/11')
}

/**
 * 씨앗을 물고 첫 화면에 들어섰다가 ①(생각 작성)까지 넘어간 상태를 만든다.
 * 씨앗 소비는 effect에서 일어나므로 ①로 넘어간 것을 확인한 뒤 경로를 옮긴다.
 */
async function enterWithSeed(seed: TraceSeed = PASSAGE_SEED) {
  navState.pathname = '/trace/new'
  const view = render(tree(seed))

  await waitFor(() => {
    expect(replaceMock).toHaveBeenCalledWith('/trace/new/write')
  })

  navState.pathname = '/trace/new/write'
  view.rerender(tree(seed))
  replaceMock.mockClear()
}

function confirmExit() {
  fireEvent.click(screen.getByRole('button', { name: '닫기' }))
  fireEvent.click(screen.getByRole('button', { name: '나갈게요' }))
}

describe('흔적 작성 플로우에서 나가기', () => {
  beforeEach(() => {
    navState.pathname = '/trace/new'
    replaceMock.mockClear()
    backMock.mockClear()
  })

  it('씨앗을 물고 들어왔으면 홈이 아니라 들어온 자리로 되감는다', async () => {
    pushEntry()
    await enterWithSeed()

    confirmExit()

    expect(backMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).not.toHaveBeenCalledWith('/')
  })

  it('나가는 동안 가드가 첫 화면으로 되밀지 않는다', async () => {
    // 초안을 비우면 ①은 더 이상 성립하지 않는 경로다. 가드가 그 빈 초안을 보고 되밀면
    // 나가려던 이동을 덮어써, 닫기를 눌러도 흔적 추가 첫 화면에 그대로 남는다.
    pushEntry()
    await enterWithSeed()

    confirmExit()

    expect(replaceMock).not.toHaveBeenCalledWith('/trace/new')
  })

  it('씨앗 없이 들어왔으면 지금까지처럼 홈으로 나간다', () => {
    // 탭바의 + 버튼으로 연 경우다 — 되돌릴 '보고 있던 자리'가 없다
    pushEntry()
    navState.pathname = '/trace/new'
    render(tree(null))

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(replaceMock).toHaveBeenCalledWith('/')
    expect(backMock).not.toHaveBeenCalled()
  })

  it('씨앗이 있어도 되감을 칸이 없으면 홈으로 나간다', async () => {
    // 씨앗 URL을 직접 연 경우다. 그대로 되감으면 앱 바깥으로 나간다.
    const lengthSpy = vi.spyOn(window.history, 'length', 'get').mockReturnValue(1)
    await enterWithSeed()

    confirmExit()

    expect(backMock).not.toHaveBeenCalled()
    expect(replaceMock).toHaveBeenCalledWith('/')
    lengthSpy.mockRestore()
  })
})
