import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceWriteForm } from '../_components/TraceWriteForm/TraceWriteForm'
import { useTraceDraft } from '../_hooks/useTraceDraft'

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/write',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

const OPINION_PLACEHOLDER = '문장에 대한 생각이나 의견을 작성해보세요.'

/**
 * 흔적 보기의 '의견 남기기'로 들어온 초안 — TraceSourceView가 씨앗을 소비한 결과와 같은 모양이다.
 * seeded=false면 사진·직접 입력으로 대목만 얻어 ①에 선 평소 초안이다.
 */
function Harness({ seeded }: { seeded: boolean }) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    dispatch({
      type: 'selectBook',
      book: { bookId: 7, title: '모순', author: '', coverImageUrl: null, pageCount: null },
    })
    dispatch({ type: 'setQuotedText', quotedText: '문장이 오래 남았다' })
    if (!seeded) {
      dispatch({ type: 'setSource', source: 'photo' })
      return
    }
    dispatch({ type: 'setPageDetail', pageNumber: 122, isSpoiler: false })
    dispatch({
      type: 'applyDecoration',
      decoration: { startOffset: 0, endOffset: 2, effectType: 'WAVY', color: '#06D6A0' },
    })
    dispatch({ type: 'setMergeTarget', passageId: 42 })
    dispatch({ type: 'setSource', source: 'passage' })
  }, [dispatch, seeded])

  // 초안이 다 차기 전에 마운트하면 autoFocus가 평소 경로 기준으로 한 번 결정돼 버린다
  if (!draft.source) return null
  return <TraceWriteForm />
}

function renderForm(seeded: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AppBackProvider>
        <LoginGateProvider>
          <TraceDraftProvider>
            <TraceOverlayProvider>
              <TraceNavProvider>
                <Harness seeded={seeded} />
              </TraceNavProvider>
            </TraceOverlayProvider>
          </TraceDraftProvider>
        </LoginGateProvider>
      </AppBackProvider>
    </QueryClientProvider>,
  )
}

describe('생각 작성 단계의 의견 입력창 초점', () => {
  it('대목을 물고 들어오면 열리자마자 입력창을 잡는다 — 흔적 보기의 의견 남기기가 곧장 이 자리로 보낸다', async () => {
    renderForm(true)

    expect(await screen.findByPlaceholderText(OPINION_PLACEHOLDER)).toHaveFocus()
  })

  it('평소 경로에서는 잡지 않는다 — OCR·직접 입력에서 막 온 사용자는 페이지부터 채워야 한다', async () => {
    renderForm(false)

    expect(await screen.findByPlaceholderText(OPINION_PLACEHOLDER)).not.toHaveFocus()
  })
})
