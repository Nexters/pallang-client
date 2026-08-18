import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Activity, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceCaptureProvider } from '../_components/TraceCaptureProvider/TraceCaptureProvider'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceSourceView } from '../_components/TraceSourceView/TraceSourceView'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new' } }))

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({ takePhoto: vi.fn(() => new Promise<null>(() => undefined)) }),
}))

// base-ui 시트는 happy-dom에서 <Activity> 감춤/되살림을 넘기지 못한다(실제 브라우저는 넘긴다 —
// getAnimations가 없어 닫힘 전환이 끝나지 않는 탓이다). 여기서 확인할 것은 '화면이 시트를
// 열라고 하는가'이므로, 껍데기로 바꿔 그 판단만 본다. 시트 자체의 동작은 bottomSheet.spec이 본다.
vi.mock('@/app/_global/_components/BottomSheet/BottomSheet', () => ({
  BottomSheet: ({
    children,
    open,
    title,
  }: {
    children: ReactNode
    open: boolean
    title: ReactNode
  }) =>
    open ? (
      <section>
        <h2>{title}</h2>
        {children}
      </section>
    ) : null,
}))

/**
 * Next는 다음 단계로 넘어가도 화면을 언마운트하지 않고 <Activity>로 감춰 두었다가 되살린다
 * (Cache Components). 실제 라우터 대신 그 감춤/되살림과 경로 변화만 흉내 낸다.
 */
function renderStep(seed: Parameters<typeof TraceSourceView>[0]['seed'] = null) {
  const tree = (mode: 'hidden' | 'visible') => (
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceCaptureProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <Activity mode={mode}>
                <TraceSourceView seed={seed} />
              </Activity>
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceCaptureProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>
  )
  const { rerender } = render(tree('visible'))
  return {
    /** 다음 단계로 넘어가 이 화면이 감춰진다 */
    leaveTo: (pathname: string) => {
      navState.pathname = pathname
      rerender(tree('hidden'))
    },
    /** 첫 단계로 돌아와 이 화면이 되살아난다 */
    comeBack: () => {
      navState.pathname = '/trace/new'
      rerender(tree('visible'))
    },
  }
}

const SOURCE_SHEET_TITLE = '새로운 기록을 어떻게 남길까요?'

beforeEach(() => {
  navState.pathname = '/trace/new'
})

describe('흔적 작성 첫 화면으로 되돌아오기', () => {
  it('사진 단계에 갔다가 돌아오면 방식 선택 시트가 다시 열린다', async () => {
    // 이 화면 뒤에는 빈 배경(bg-bg-dark)뿐이라, 되살아난 시트가 닫혀 있으면 빈 화면이 된다.
    const step = renderStep()

    fireEvent.click(await screen.findByRole('button', { name: /사진으로 입력/ }))
    expect(screen.queryByText(SOURCE_SHEET_TITLE)).toBeNull()

    step.leaveTo('/trace/new/photo')
    step.comeBack()

    expect(screen.getByText(SOURCE_SHEET_TITLE)).toBeTruthy()
  })

  it('직접 입력 시트를 열어 둔 채 넘어갔다 돌아와도 방식 선택부터 다시 고른다', async () => {
    const step = renderStep()

    fireEvent.click(await screen.findByRole('button', { name: /직접 입력/ }))
    fireEvent.change(screen.getByPlaceholderText('문장을 입력해주세요.'), {
      target: { value: '흔적을 남깁니다' },
    })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    step.leaveTo('/trace/new/write')
    step.comeBack()

    expect(screen.getByText(SOURCE_SHEET_TITLE)).toBeTruthy()
  })

  it('대목을 물고 들어와 넘어간 뒤 돌아와도 빈 화면이 되지 않는다', async () => {
    // 씨앗은 되살아난 화면에도 그대로 남는다 — 씨앗만 보고 화면을 가리면 영영 가려진다.
    const step = renderStep({
      bookId: 11,
      bookTitle: '모순',
      bookCoverImageUrl: null,
      passage: {
        passageId: 42,
        pageNumber: 122,
        quotedText: '문장이 오래 남았다',
        isSpoiler: true,
        decorations: [],
      },
    })

    await waitFor(() => {
      expect(screen.queryByText(SOURCE_SHEET_TITLE)).toBeNull()
    })

    step.leaveTo('/trace/new/write')
    step.comeBack()

    expect(screen.getByText(SOURCE_SHEET_TITLE)).toBeTruthy()
  })
})
