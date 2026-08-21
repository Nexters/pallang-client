/* eslint-disable @typescript-eslint/unbound-method --
 * vi.fn()으로 목킹된 App.addListener/App.exitApp 참조를 unbound-method 룰이 오탐한다(실제 this 바인딩 문제 없음).
 */
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppBack } from '@/app/_global/_hooks/useAppBack'
import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}))
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(), exitApp: vi.fn() },
}))

type BackEvent = { canGoBack: boolean }

let fireBack: ((event: BackEvent) => void) | null = null

function mockNativeListener() {
  vi.mocked(App.addListener).mockImplementation(
    (_name: string, callback: (event: BackEvent) => void) => {
      fireBack = callback
      return Promise.resolve({ remove: () => Promise.resolve() })
    },
  )
}

function Screen({ onBack }: { onBack: () => void }) {
  useAppBack(onBack)
  return <div>screen</div>
}

/**
 * 히스토리를 흉내 낸다. happy-dom의 history는 pushState/back이 popstate를 실제로 쏘지 않아,
 * 뒤로가기 한 번이 어디로 가는지 이 테스트에서 볼 수 없다.
 */
function stubHistory() {
  const pushState = vi.fn()
  const back = vi.fn()
  vi.spyOn(window.history, 'pushState').mockImplementation(pushState)
  vi.spyOn(window.history, 'back').mockImplementation(back)
  return { pushState, back }
}

/** 사용자가 뒤로가기를 눌러 히스토리가 한 칸 되감긴 상황 */
function popState() {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

/** 층 하나가 떠 있는 화면 */
function renderLayer(onBack: () => void = vi.fn()) {
  const view = render(
    <AppBackProvider>
      <Screen onBack={onBack} />
    </AppBackProvider>,
  )
  return { ...view, onBack }
}

/** 닫을 층이 없는 화면 */
function renderBare() {
  return render(<AppBackProvider>screen</AppBackProvider>)
}

/** 안드로이드 하드웨어 back. 리스너는 render 안의 effect에서 동기로 붙는다 */
function fireNativeBack(canGoBack: boolean) {
  if (!fireBack) throw new Error('네이티브 back 리스너가 붙지 않았다')
  fireBack({ canGoBack })
}

describe('앱 뒤로가기 소유자', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    fireBack = null
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    mockNativeListener()
  })

  it('닫을 층이 없으면 히스토리 엔트리를 심지 않는다', () => {
    const { pushState } = stubHistory()

    renderBare()

    expect(pushState).not.toHaveBeenCalled()
  })

  // 층이 떠 있는 동안만 엔트리를 물고 있어야, 뒤로가기가 화면을 벗어나는 대신 여기로 온다.
  it('층이 열리면 같은 URL의 엔트리를 하나 심는다', () => {
    const { pushState } = stubHistory()

    renderLayer()

    expect(pushState).toHaveBeenCalledTimes(1)
    // URL을 바꾸면 라우터가 화면을 다시 그린다 — 인자를 주지 않아 현재 주소를 유지한다
    expect(pushState.mock.calls[0]?.[2]).toBeUndefined()
  })

  // 이 테스트가 #132의 회귀를 잠근다 — iOS 엣지 스와이프와 브라우저 back은 popstate로만 도착한다.
  it('뒤로가기(popstate)가 맨 위 층에게 넘어간다', () => {
    stubHistory()
    const { onBack } = renderLayer()

    popState()

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('나중에 열린 층이 먼저 back을 가져간다', () => {
    stubHistory()
    const first = vi.fn()
    const second = vi.fn()
    render(
      <AppBackProvider>
        <Screen onBack={first} />
        <Screen onBack={second} />
      </AppBackProvider>,
    )

    popState()

    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  // 핸들러가 확인 다이얼로그만 띄우고 층을 닫지 않는 경우가 있다(흔적 작성 이탈 가드).
  // 그때 무방비로 두면 연달아 누른 뒤로가기가 화면을 통째로 벗어난다.
  it('층이 남아 있으면 뒤로가기를 소비한 뒤 엔트리를 다시 심는다', () => {
    const { pushState } = stubHistory()
    renderLayer()
    expect(pushState).toHaveBeenCalledTimes(1)

    popState()

    expect(pushState).toHaveBeenCalledTimes(2)
  })

  it('층이 사라지면 뒤로가기가 화면을 벗어난다', () => {
    stubHistory()
    const { onBack, rerender } = renderLayer()

    rerender(<AppBackProvider>screen</AppBackProvider>)
    popState()

    expect(onBack).not.toHaveBeenCalled()
  })

  // 화면 안 닫기 버튼으로 닫으면 심어 둔 엔트리가 소비되지 않고 남는다 —
  // 걷지 않으면 그 뒤의 뒤로가기 한 번이 아무 일도 하지 않고 삼켜진다.
  it('층이 화면 안에서 닫히면 심어 둔 엔트리를 걷는다', () => {
    const { back } = stubHistory()
    const { rerender } = renderLayer()

    rerender(<AppBackProvider>screen</AppBackProvider>)

    expect(back).toHaveBeenCalledTimes(1)
  })

  // 층이 화면 안에서 닫히자마자 다른 층이 열리면, 앞서 부른 history.back()의 popstate가
  // 새 층의 엔트리를 소비하면서 열리자마자 닫아 버린다.
  it('스스로 걷어낸 엔트리의 popstate는 뒤로가기로 세지 않는다', () => {
    stubHistory()
    const onBack = vi.fn()
    const { rerender } = renderLayer()

    // 닫힘 → unguard가 history.back()을 부른다(popstate는 아직 도착 전)
    rerender(<AppBackProvider>screen</AppBackProvider>)
    // 그 사이 새 층이 열려 자기 엔트리를 심는다
    rerender(
      <AppBackProvider>
        <Screen onBack={onBack} />
      </AppBackProvider>,
    )
    // 뒤늦게 도착한 자기 뒷정리
    popState()

    expect(onBack).not.toHaveBeenCalled()
  })

  // 층을 화면 안 버튼으로 닫으면 심어 둔 엔트리가 소비되지 않고 앞쪽에 남는다. 브라우저·안드로이드
  // 크롬의 앞으로 가기로 그 자리에 다시 올라설 수 있는데, 지키던 층은 이미 없다.
  it('앞으로 가기로 죽은 엔트리에 올라서면 그 자리에서 물러난다', () => {
    const { back } = stubHistory()
    renderBare()
    // 앞으로 가기로 도착한 자리가 우리가 심어 둔 엔트리다
    vi.spyOn(window.history, 'state', 'get').mockReturnValue({ __pallangBackGuard: true })

    popState()

    expect(back).toHaveBeenCalledTimes(1)
  })

  // 안드로이드 back은 네이티브 이벤트로 온다. 여기서 층을 직접 판정하면 경로가 둘로 갈린다 —
  // 히스토리로 흘려보내 popstate 한 곳에서 같은 판정을 받게 한다.
  it('안드로이드 back은 층 판정 없이 히스토리로 흘려보낸다', () => {
    const { back } = stubHistory()
    const { onBack } = renderLayer()
    fireNativeBack(true)

    expect(back).toHaveBeenCalled()
    expect(onBack).not.toHaveBeenCalled()
    expect(App.exitApp).not.toHaveBeenCalled()
  })

  // Capacitor 기본 동작은 히스토리가 없을 때 아무 것도 하지 않아서, 첫 화면에서
  // 뒤로가기하면 반응이 없는 것처럼 보인다. 안드로이드 관례대로 앱을 닫아야 한다.
  it('되돌아갈 히스토리가 없으면 앱을 닫는다', () => {
    stubHistory()
    renderBare()
    fireNativeBack(false)

    expect(App.exitApp).toHaveBeenCalled()
  })

  // 층을 물고 있으면 우리가 심은 엔트리가 있다. 네이티브가 canGoBack=false를 넘겨도
  // 앱을 닫으면 열려 있던 시트가 앱과 함께 사라진다.
  it('층을 물고 있으면 canGoBack이 false여도 앱을 닫지 않는다', () => {
    const { back } = stubHistory()
    renderLayer()
    fireNativeBack(false)

    expect(back).toHaveBeenCalled()
    expect(App.exitApp).not.toHaveBeenCalled()
  })

  // 브라우저에서는 popstate만으로 충분하다 — 네이티브 리스너를 붙일 곳이 없다.
  it('네이티브가 아니면 리스너를 붙이지 않는다', () => {
    stubHistory()
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    renderBare()

    expect(App.addListener).not.toHaveBeenCalled()
  })
})
