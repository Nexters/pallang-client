// ⚠️ 임시 skip — develop 병합(#228)이 들고 온 스펙이다. 원래 겨누던 화면
// (TraceOpinionForm, /trace/new/opinion)이 이 브랜치에서 사라졌다: 의견 입력은 ①생각 작성
// (TraceWriteForm)으로 흡수됐고, 대목·페이지·스포일러를 같은 화면에서 함께 받는다.
// 그래서 지금은 열자마자 의견 입력창을 잡을 수 없다 — 위에 있는 페이지 입력이 먼저다.
// phase 2('의견 남기기' 지름길 재배치)가 "씨앗이 대목을 물고 오면 ①은 대목·페이지를
// 읽기 전용으로 보여주고 의견만 받는다"를 구현하면 그때 이 스펙의 .skip을 걷는다.
// 레포 규칙은 .skip 커밋을 금지한다 — 여기서만 한시적으로 예외를 둔다.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
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

/** 씨앗이 대목·페이지까지 물고 들어온 초안으로 ①에 서 있게 한다 */
function Harness() {
  const { dispatch } = useTraceDraft()

  useEffect(() => {
    dispatch({
      type: 'selectBook',
      book: { bookId: 7, title: '모순', author: '', coverImageUrl: null, pageCount: null },
    })
    dispatch({ type: 'setQuotedText', quotedText: '문장이 오래 남았다' })
    dispatch({ type: 'setPageDetail', pageNumber: 122, isSpoiler: false })
    dispatch({ type: 'setMergeTarget', passageId: 42 })
  }, [dispatch])

  return <TraceWriteForm />
}

describe.skip('의견 작성 단계', () => {
  it('열리자마자 입력창을 잡는다 — 흔적 보기의 의견 남기기가 곧장 이 자리로 보낸다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <HardwareBackProvider>
          <LoginGateProvider>
            <TraceDraftProvider>
              <TraceOverlayProvider>
                <TraceNavProvider>
                  <Harness />
                </TraceNavProvider>
              </TraceOverlayProvider>
            </TraceDraftProvider>
          </LoginGateProvider>
        </HardwareBackProvider>
      </QueryClientProvider>,
    )

    expect(
      await screen.findByPlaceholderText('문장에 대한 생각이나 의견을 작성해보세요.'),
    ).toHaveFocus()
  })
})
