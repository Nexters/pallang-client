/* eslint-disable @typescript-eslint/unbound-method --
 * vi.fn()으로 목킹된 App.addListener/App.exitApp 참조를 unbound-method 룰이 오탐한다(실제 this 바인딩 문제 없음).
 */
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useHardwareBack } from '@/app/_global/_hooks/useHardwareBack'
import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

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
  useHardwareBack(onBack)
  return <div>screen</div>
}

describe('하드웨어 back', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fireBack = null
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    mockNativeListener()
  })

  // Capacitor 기본 동작은 히스토리가 없을 때 아무 것도 하지 않아서, 첫 화면에서
  // 엣지 스와이프하면 반응이 없는 것처럼 보인다. 안드로이드 관례대로 앱을 닫아야 한다.
  it('되돌아갈 히스토리가 없으면 앱을 닫는다', async () => {
    render(<HardwareBackProvider>screen</HardwareBackProvider>)
    await vi.waitFor(() => {
      expect(fireBack).not.toBeNull()
    })

    fireBack?.({ canGoBack: false })

    expect(App.exitApp).toHaveBeenCalled()
  })

  it('되돌아갈 히스토리가 있으면 한 칸 되감는다', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    render(<HardwareBackProvider>screen</HardwareBackProvider>)
    await vi.waitFor(() => {
      expect(fireBack).not.toBeNull()
    })

    fireBack?.({ canGoBack: true })

    expect(back).toHaveBeenCalled()
    expect(App.exitApp).not.toHaveBeenCalled()
  })

  // 흔적 작성처럼 이탈 확인이 필요한 화면은 되감기보다 먼저 back을 가져가야 한다.
  it('화면이 등록한 핸들러가 기본 동작보다 우선한다', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    const onBack = vi.fn()
    render(
      <HardwareBackProvider>
        <Screen onBack={onBack} />
      </HardwareBackProvider>,
    )
    await vi.waitFor(() => {
      expect(fireBack).not.toBeNull()
    })

    fireBack?.({ canGoBack: true })

    expect(onBack).toHaveBeenCalled()
    expect(back).not.toHaveBeenCalled()
    expect(App.exitApp).not.toHaveBeenCalled()
  })

  it('핸들러를 등록한 화면이 사라지면 기본 동작으로 돌아간다', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    const onBack = vi.fn()
    const { rerender } = render(
      <HardwareBackProvider>
        <Screen onBack={onBack} />
      </HardwareBackProvider>,
    )
    await vi.waitFor(() => {
      expect(fireBack).not.toBeNull()
    })

    rerender(<HardwareBackProvider>screen</HardwareBackProvider>)
    fireBack?.({ canGoBack: true })

    expect(onBack).not.toHaveBeenCalled()
    expect(back).toHaveBeenCalled()
  })

  // 브라우저에서는 브라우저 back이 그대로 동작해야 한다 — 리스너를 붙이지 않는다.
  it('네이티브가 아니면 리스너를 붙이지 않는다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    render(<HardwareBackProvider>screen</HardwareBackProvider>)

    expect(App.addListener).not.toHaveBeenCalled()
  })
})
