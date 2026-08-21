import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
// ①이 저장까지 맡게 되면서(대목을 물고 들어온 경로) useTraceSubmit이 딸려 온다 —
// useMutation은 QueryClientProvider를, useLoginGate는 LoginGateProvider를 요구한다.
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceWriteForm } from '../_components/TraceWriteForm/TraceWriteForm'
import { useTraceDraft } from '../_hooks/useTraceDraft'

const { createOpinionMock, replaceMock } = vi.hoisted(() => ({
  createOpinionMock: vi.fn(() => Promise.resolve({ data: { opinionId: 5, merged: true } })),
  replaceMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/write',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

vi.mock('@/app/_global/_apis/_generated/opinion/opinion', () => ({
  createOpinion: createOpinionMock,
}))

const SEED_DECORATION = {
  startOffset: 0,
  endOffset: 2,
  effectType: 'WAVY',
  color: '#06D6A0',
} as const

// 대목을 담아 둔 상태에서 시작해야 실제 진입 조건과 같다.
// dispatch는 반드시 effect에서 부른다 — 렌더 중에 부르면 Provider를 렌더 도중 갱신하게 되어
// "Cannot update a component while rendering a different component" 경고가 난다.
function Seeded({ fromPassage = false }: { fromPassage?: boolean }) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    if (!fromPassage) {
      dispatch({ type: 'setQuotedText', quotedText: '어떤 문장' })
      dispatch({ type: 'setSource', source: 'photo' })
      return
    }
    // 흔적 보기의 '의견 남기기' — TraceSourceView가 씨앗을 소비한 뒤와 같은 초안이다
    dispatch({
      type: 'selectBook',
      book: { bookId: 7, title: '모순', author: '', coverImageUrl: null, pageCount: null },
    })
    dispatch({ type: 'setQuotedText', quotedText: '어떤 문장' })
    dispatch({ type: 'setPageDetail', pageNumber: 122, isSpoiler: true })
    dispatch({ type: 'applyDecoration', decoration: SEED_DECORATION })
    dispatch({ type: 'setMergeTarget', passageId: 42 })
    dispatch({ type: 'setSource', source: 'passage' })
  }, [dispatch, fromPassage])

  if (!draft.source) return null
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

function renderForm({ fromPassage = false } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AppBackProvider>
        <LoginGateProvider>
          <TraceDraftProvider>
            <TraceOverlayProvider>
              <TraceNavProvider>
                <Seeded fromPassage={fromPassage} />
                <DraftProbe />
              </TraceNavProvider>
            </TraceOverlayProvider>
          </TraceDraftProvider>
        </LoginGateProvider>
      </AppBackProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

const OPINION_PLACEHOLDER = '문장에 대한 생각이나 의견을 작성해보세요.'

describe('생각 작성 단계', () => {
  it('페이지와 의견이 모두 차야 다음으로 넘어갈 수 있다', async () => {
    replaceMock.mockClear()
    renderForm()

    const next = await screen.findByRole('button', { name: '다음' })
    expect(next.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByLabelText('페이지'), { target: { value: '100' } })
    expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByPlaceholderText(OPINION_PLACEHOLDER), {
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
    fireEvent.change(screen.getByPlaceholderText(OPINION_PLACEHOLDER), {
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

describe('생각 작성 단계 — 흔적 보기에서 대목을 물고 온 경우', () => {
  it('대목·페이지는 정해진 값을 읽기 전용으로 보여주고 스포일러는 묻지 않는다', async () => {
    renderForm({ fromPassage: true })

    const page = await screen.findByLabelText<HTMLInputElement>('페이지')
    expect(page.value).toBe('122')
    expect(page.readOnly).toBe(true)
    // 스포일러 여부는 그 대목의 것이라 여기서 고칠 수 없다
    expect(screen.queryByRole('radio', { name: '있어요' })).toBeNull()
  })

  it('이 화면이 마지막이라 다음이 아니라 기록 완료다 — 눌러 저장하고 완료로 간다', async () => {
    replaceMock.mockClear()
    createOpinionMock.mockClear()
    const queryClient = renderForm({ fromPassage: true })
    // 내 흔적 관리·서재를 먼저 보고 온 상황
    const myOpinionsKey = userQueries.opinionList().queryKey
    const libraryKey = bookQueries.myLibrary().queryKey
    queryClient.setQueryData(myOpinionsKey, { pages: [], pageParams: [] })
    queryClient.setQueryData(libraryKey, { pages: [], pageParams: [] })

    expect(screen.queryByRole('button', { name: '다음' })).toBeNull()
    const submit = await screen.findByRole('button', { name: '기록 완료' })
    expect(submit.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByPlaceholderText(OPINION_PLACEHOLDER), {
      target: { value: '좋았다' },
    })
    fireEvent.click(await screen.findByRole('button', { name: '기록 완료' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/done')
    })
    // 씨앗이 물고 온 대목에 그대로 붙는다 — 꾸밈도 이어받은 것을 그대로 보낸다
    expect(createOpinionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bookId: 7,
        passageId: 42,
        pageNumber: 122,
        isSpoiler: true,
        decorations: [SEED_DECORATION],
      }),
    )
    // ②·③을 거치지 않는다
    expect(replaceMock).not.toHaveBeenCalledWith('/trace/new/decorate')
    expect(replaceMock).not.toHaveBeenCalledWith('/trace/new/book')
    expect(queryClient.getQueryState(myOpinionsKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(libraryKey)?.isInvalidated).toBe(true)
  })

  it('뒤로 가면 물고 온 대목을 놓고 방식 선택으로 돌아간다 — 이어받은 상태가 남지 않는다', async () => {
    replaceMock.mockClear()
    renderForm({ fromPassage: true })

    fireEvent.click(await screen.findByRole('button', { name: '뒤로' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new')
    })
    // clearQuote가 대목·페이지·꾸밈·합칠 대목을 함께 비운다 = 다음 대목은 평소 경로를 탄다
    expect(screen.getByTestId('draft-probe').textContent).toBe('/false/')
  })
})
