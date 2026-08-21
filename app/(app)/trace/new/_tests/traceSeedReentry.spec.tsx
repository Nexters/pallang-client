import { render, screen, waitFor } from '@testing-library/react'
import { Activity, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { TraceCaptureProvider } from '../_components/TraceCaptureProvider/TraceCaptureProvider'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceSourceView } from '../_components/TraceSourceView/TraceSourceView'

const { navState, routerSpies, sheetBirth } = vi.hoisted(() => ({
  navState: { pathname: '/trace/new' },
  routerSpies: { back: vi.fn(), prefetch: vi.fn(), push: vi.fn(), replace: vi.fn() },
  sheetBirth: { counter: 0 },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => routerSpies,
}))

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({ takePhoto: vi.fn(() => new Promise<null>(() => undefined)) }),
}))

// base-ui 시트는 happy-dom에서 <Activity> 감춤/되살림을 넘기지 못한다(traceStepRevisit.spec 참고).
// 여기서는 두 가지만 본다 — '화면이 시트를 열라고 하는가'와 '되살아날 때 시트가 새 마운트인가'.
// 새 마운트 여부는 ref에 심은 출생 번호로 판별한다: ref는 감춤/되살림에는 살아남고
// key가 갈릴 때만 새로 만들어지므로, 번호가 바뀌었다 = 시트를 새로 마운트했다.
vi.mock('@/app/_global/_components/BottomSheet/BottomSheet', async () => {
  const { useRef } = await import('react')
  return {
    BottomSheet: ({
      children,
      open,
      title,
    }: {
      children: ReactNode
      open: boolean
      title: ReactNode
    }) => {
      const birthRef = useRef(0)
      if (birthRef.current === 0) birthRef.current = ++sheetBirth.counter
      return open ? (
        <section data-testid="sheet" data-birth={birthRef.current}>
          <h2>{title}</h2>
          {children}
        </section>
      ) : null
    },
  }
})

const SOURCE_SHEET_TITLE = '새로운 기록을 어떻게 남길까요?'

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
    decorations: [],
  },
}

/**
 * Next는 이 화면을 <Activity>로 살려 두므로, 두 번째 씨앗 진입은 새 마운트가 아니라
 * seed prop 갱신으로 도착한다. 실제 라우터 대신 그 감춤/되살림과 경로·씨앗 변화만 흉내 낸다.
 */
function renderFlow(seed: TraceSeed | null = null) {
  const tree = (mode: 'hidden' | 'visible', currentSeed: TraceSeed | null) => (
    <AppBackProvider>
      <TraceDraftProvider>
        <TraceCaptureProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <Activity mode={mode}>
                <TraceSourceView seed={currentSeed} />
              </Activity>
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceCaptureProvider>
      </TraceDraftProvider>
    </AppBackProvider>
  )
  let lastSeed = seed
  const { rerender } = render(tree('visible', seed))
  return {
    /** 다른 화면으로 넘어가 이 화면이 감춰진다. 플로우 밖 경로면 흐름을 나간 것이다. */
    leaveTo: (pathname: string) => {
      navState.pathname = pathname
      rerender(tree('hidden', lastSeed))
    },
    /** 첫 단계로 되살아난다. 씨앗을 넘기면 새 씨앗 URL로 다시 들어온 것이다. */
    comeBackWith: (nextSeed: TraceSeed | null = lastSeed) => {
      lastSeed = nextSeed
      navState.pathname = '/trace/new'
      rerender(tree('visible', nextSeed))
    },
  }
}

beforeEach(() => {
  navState.pathname = '/trace/new'
  sheetBirth.counter = 0
  routerSpies.replace.mockClear()
})

describe('흔적 작성 첫 화면 재진입', () => {
  it('흐름을 나갔다가 대목 씨앗으로 다시 들어오면 시트 대신 씨앗을 소비해 ①로 직행한다', async () => {
    // 첫 판을 씨앗 없이 한 번 거친 뒤의 씨앗 진입 — 마운트 기준 소비라면 여기서 씨앗이 버려진다.
    const flow = renderFlow(null)
    expect(screen.getByText(SOURCE_SHEET_TITLE)).toBeTruthy()

    flow.leaveTo('/')
    flow.comeBackWith(PASSAGE_SEED)

    await waitFor(() => {
      expect(routerSpies.replace).toHaveBeenCalledWith('/trace/new/write')
    })
    // 소비되는 씨앗 뒤로 방식 선택 시트가 한 프레임도 스치지 않는다
    expect(screen.queryByText(SOURCE_SHEET_TITLE)).toBeNull()
  })

  it('초안이 이미 시작된 재방문(①→뒤로)에서는 같은 씨앗을 다시 풀지 않는다', async () => {
    const flow = renderFlow(PASSAGE_SEED)
    await waitFor(() => {
      expect(routerSpies.replace).toHaveBeenCalledWith('/trace/new/write')
    })
    const consumedCount = routerSpies.replace.mock.calls.length

    flow.leaveTo('/trace/new/write')
    flow.comeBackWith()

    // 씨앗을 다시 풀어 ①로 되밀지 않고, 방식 선택 시트가 열린다(빈 화면 금지)
    expect(screen.getByText(SOURCE_SHEET_TITLE)).toBeTruthy()
    expect(routerSpies.replace.mock.calls.length).toBe(consumedCount)
  })

  it('되살아날 때 시트를 새로 마운트한다 — open 토글이 아니라 새 등장 경로를 탄다', () => {
    // base-ui가 감춤/복귀 사이의 open 토글을 놓치는 실기 결함의 회귀 잠금. 사진 단계에서
    // 촬영을 취소하고 돌아오면 open=true인데도 시트가 그려지지 않았다 — 새 마운트면 놓칠 토글이 없다.
    const flow = renderFlow(null)
    const firstBirth = screen.getByTestId('sheet').getAttribute('data-birth')

    flow.leaveTo('/trace/new/photo')
    flow.comeBackWith()

    expect(screen.getByTestId('sheet').getAttribute('data-birth')).not.toBe(firstBirth)
  })
})
