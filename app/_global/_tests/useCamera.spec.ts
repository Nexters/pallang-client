/* eslint-disable @typescript-eslint/no-deprecated --
 * useCamera가 의도적으로 사용하는 구버전 Camera.getPhoto/ImageOptions API를 그대로 mock/검증한다.
 */
/* eslint-disable @typescript-eslint/unbound-method --
 * vi.fn()으로 목킹된 Camera.getPhoto 참조를 unbound-method 룰이 오탐한다(실제 this 바인딩 문제 없음).
 */
import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CAMERA_OPTIONS } from '@/app/_global/_data/camera.constant'
import { useCamera } from '@/app/_global/_hooks/useCamera'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}))
vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { DataUrl: 'dataUrl', Uri: 'uri' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS', Prompt: 'PROMPT' },
}))

describe('useCamera', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  // 원격 URL을 로드하는 앱이라 capacitor:// 경로는 교차 오리진이 되어 fetch가 막힌다.
  // 그래서 Uri가 아니라 DataUrl로 받아 브릿지에서 바로 blob을 만든다.
  it('네이티브에서는 dataUrl을 blob으로 바꾸고 blob URL을 webPath로 준다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,AAAA',
    } as Awaited<ReturnType<typeof Camera.getPhoto>>)
    const mockBlob = new Blob(['photo'])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) }))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')

    const { takePhoto } = useCamera()
    const result = await takePhoto()

    expect(Camera.getPhoto).toHaveBeenCalledWith(CAMERA_OPTIONS)
    expect(fetch).toHaveBeenCalledWith('data:image/jpeg;base64,AAAA')
    expect(result).toEqual({ webPath: 'blob:mock', blob: mockBlob })
  })

  it('CAMERA_OPTIONS는 프롬프트 없이 바로 촬영하고 업로드 크기를 제한한다', () => {
    expect(CAMERA_OPTIONS.source).toBe('CAMERA')
    expect(CAMERA_OPTIONS.resultType).toBe('dataUrl')
    expect(CAMERA_OPTIONS.width).toBe(1600)
  })

  it('gallery를 넘기면 앨범에서 고른다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockResolvedValue({} as Awaited<ReturnType<typeof Camera.getPhoto>>)

    await useCamera().takePhoto('gallery')

    expect(Camera.getPhoto).toHaveBeenCalledWith(expect.objectContaining({ source: 'PHOTOS' }))
  })

  // 취소는 되돌아가고 실패는 대안을 안내해야 해서 호출부가 둘을 구분할 수 있어야 한다.
  it('사용자가 취소하면 null을 반환한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockRejectedValue(new Error('User cancelled photos app'))

    expect(await useCamera().takePhoto()).toBeNull()
  })

  it('촬영이 실패하면 예외를 그대로 올린다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockRejectedValue(new Error('No camera available'))

    await expect(useCamera().takePhoto()).rejects.toThrow('No camera available')
  })

  it('네이티브에서 dataUrl이 없으면 null을 반환한다', async () => {
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

  it('브라우저에서 change 이벤트가 발생하면 webPath와 blob을 가진 Photo를 반환한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    const createEl = vi.spyOn(document, 'createElement')
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')

    const photoPromise = useCamera().takePhoto()
    const input = createEl.mock.results.at(-1)?.value as HTMLInputElement
    const file = new File(['x'], 'p.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change'))

    expect(await photoPromise).toEqual({ webPath: 'blob:mock', blob: file })
  })

  it('브라우저에서 cancel 이벤트가 발생하면 null을 반환한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    const createEl = vi.spyOn(document, 'createElement')

    const photoPromise = useCamera().takePhoto()
    const input = createEl.mock.results.at(-1)?.value as HTMLInputElement
    input.dispatchEvent(new Event('cancel'))

    expect(await photoPromise).toBeNull()
  })
})
