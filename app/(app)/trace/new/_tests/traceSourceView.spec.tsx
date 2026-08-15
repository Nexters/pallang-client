import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceSourceView } from '../_components/TraceSourceView/TraceSourceView'
import { useTraceDraft } from '../_hooks/useTraceDraft'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new' } }))
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

// 씨앗이 초안에 어떻게 내려앉았는지는 화면으로 볼 수 없다(곧장 ①로 넘어간다) — 초안을 직접 읽는다
function DraftProbe() {
  const { draft } = useTraceDraft()
  return (
    <output data-testid="draft-probe">
      {JSON.stringify({
        content: draft.content,
        decorations: draft.decorations,
        isSpoiler: draft.isSpoiler,
        pageNumber: draft.pageNumber,
        passageId: draft.passageId,
        quotedText: draft.quotedText,
        source: draft.source,
      })}
    </output>
  )
}

function renderView(seed: Parameters<typeof TraceSourceView>[0]['seed'] = null) {
  return render(
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <TraceSourceView seed={seed} />
            <DraftProbe />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>,
  )
}

const SEED_DECORATION = {
  startOffset: 0,
  endOffset: 2,
  effectType: 'WAVY',
  color: '#06D6A0',
} as const

const PASSAGE_SEED = {
  bookId: 11,
  bookTitle: '모순',
  bookCoverImageUrl: null,
  passage: {
    passageId: 42,
    pageNumber: 122,
    quotedText: '문장이 오래 남았다',
    isSpoiler: true,
    decorations: [SEED_DECORATION],
  },
}

describe('흔적 작성 첫 화면', () => {
  it('진입하면 방식 선택 시트가 열려 있다', async () => {
    replaceMock.mockClear()
    renderView()

    expect(await screen.findByText('새로운 기록을 어떻게 남길까요?')).toBeTruthy()
    expect(screen.getByRole('button', { name: /사진으로 입력/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /직접 입력/ })).toBeTruthy()
  })

  it('책을 물고 들어오면 그 책을 시트에 보여준다', async () => {
    renderView({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null, passage: null })

    expect(await screen.findByText('지금 기록을 남기는 책')).toBeTruthy()
    expect(screen.getByText('모순')).toBeTruthy()
  })

  it('책이 없으면 배지를 감춘다', async () => {
    renderView()

    await screen.findByText('새로운 기록을 어떻게 남길까요?')
    expect(screen.queryByText('지금 기록을 남기는 책')).toBeNull()
  })

  it('사진으로 입력을 고르면 카메라 단계로 간다', async () => {
    replaceMock.mockClear()
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: /사진으로 입력/ }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/photo')
    })
  })

  it('직접 입력을 고르고 문장을 적어 제출하면 대목을 담아 작성 단계로 간다', async () => {
    replaceMock.mockClear()
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: /직접 입력/ }))

    const textarea = await screen.findByPlaceholderText('문장을 입력해주세요.')
    fireEvent.change(textarea, { target: { value: '흔적을 남깁니다' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/write')
    })
  })

  it('대목까지 물고 들어오면 방식 선택 시트를 열지 않고 곧장 생각 작성으로 간다', async () => {
    // 고를 방식이 없다 — 대목이 이미 있다. 시트가 한 프레임이라도 스치면 안 된다.
    replaceMock.mockClear()
    renderView(PASSAGE_SEED)

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/write')
    })
    expect(screen.queryByText('새로운 기록을 어떻게 남길까요?')).toBeNull()
  })

  it('물고 온 대목의 페이지·스포일러·꾸밈·합칠 대목을 모두 이어받는다', async () => {
    // 순서가 중요하다 — setQuotedText가 꾸밈을 비우고 selectBook이 합칠 대목을 지운다.
    // 꾸밈과 passageId가 남아 있다는 것이 곧 순서가 지켜졌다는 증거다.
    renderView(PASSAGE_SEED)

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('draft-probe').textContent)).toEqual({
        content: '',
        decorations: [SEED_DECORATION],
        isSpoiler: true,
        pageNumber: 122,
        passageId: 42,
        quotedText: '문장이 오래 남았다',
        source: 'passage',
      })
    })
  })

  it('책만 물고 들어오면 종전대로 방식 선택 시트에 머문다', async () => {
    replaceMock.mockClear()
    renderView({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null, passage: null })

    expect(await screen.findByText('새로운 기록을 어떻게 남길까요?')).toBeTruthy()
    expect(replaceMock).not.toHaveBeenCalledWith('/trace/new/write')
  })

  it('직접 입력 시트를 닫으면 플로우를 벗어나지 않고 방식 선택 시트로 돌아온다', async () => {
    replaceMock.mockClear()
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: /직접 입력/ }))
    await screen.findByPlaceholderText('문장을 입력해주세요.')

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(await screen.findByText('새로운 기록을 어떻게 남길까요?')).toBeTruthy()
    expect(replaceMock).not.toHaveBeenCalledWith('/')
  })
})
