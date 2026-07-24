/* eslint-disable @typescript-eslint/no-deprecated --
 * useCamera가 의도적으로 사용하는 구버전 Camera.getPhoto/ImageOptions API를 그대로 mock/검증한다.
 */
/* eslint-disable @typescript-eslint/unbound-method --
 * vi.fn()으로 목킹된 Camera.getPhoto 참조를 unbound-method 룰이 오탐한다(실제 this 바인딩 문제 없음).
 */
import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CAMERA_OPTIONS } from '@/app/_global/_data/camera.constant'
import { useCamera } from '@/app/_global/_hooks/useCamera'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}))
vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Prompt: 'PROMPT' },
}))

describe('useCamera', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('네이티브에서는 Camera.getPhoto를 CAMERA_OPTIONS로 호출하고 webPath를 반환한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      webPath: 'capacitor://photo/1',
    } as Awaited<ReturnType<typeof Camera.getPhoto>>)

    const { takePhoto } = useCamera()
    const result = await takePhoto()

    expect(Camera.getPhoto).toHaveBeenCalledWith(CAMERA_OPTIONS)
    expect(result).toEqual({ webPath: 'capacitor://photo/1' })
  })

  it('네이티브에서 webPath가 없으면 null을 반환한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockResolvedValue({} as Awaited<ReturnType<typeof Camera.getPhoto>>)

    const { takePhoto } = useCamera()
    expect(await takePhoto()).toBeNull()
  })

  it('브라우저에서는 Camera.getPhoto를 호출하지 않고 파일 input을 생성한다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    const createEl = vi.spyOn(document, 'createElement')

    void useCamera().takePhoto()

    expect(Camera.getPhoto).not.toHaveBeenCalled()
    const input = createEl.mock.results.at(-1)?.value as HTMLInputElement
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('capture')).toBe('environment')
  })
})
