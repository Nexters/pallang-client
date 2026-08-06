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
import { CameraPermissionDeniedError } from '@/app/_global/_data/camera.model'
import { useCamera } from '@/app/_global/_hooks/useCamera'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}))
vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn(), checkPermissions: vi.fn() },
  CameraResultType: { DataUrl: 'dataUrl', Uri: 'uri' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS', Prompt: 'PROMPT' },
}))

describe('useCamera', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 권한이 허용된 상태를 기본으로 둔다 — 권한을 다루는 테스트만 이 값을 덮어쓴다.
    vi.mocked(Camera.checkPermissions).mockResolvedValue({ camera: 'granted', photos: 'granted' })
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

  // 네이티브 축소(Android)는 보간을 끄고 픽셀을 솎아내 글자 획을 끊는다.
  // 크기 조절은 보간을 켤 수 있는 웹(photoResize.service)에서 한다.
  it('CAMERA_OPTIONS는 프롬프트 없이 바로 촬영하고, 네이티브 축소를 끈다', () => {
    expect(CAMERA_OPTIONS.source).toBe('CAMERA')
    expect(CAMERA_OPTIONS.resultType).toBe('dataUrl')
    expect(CAMERA_OPTIONS.width).toBeUndefined()
    expect(CAMERA_OPTIONS.height).toBeUndefined()
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

  // 한 번 거부하면 iOS는 권한 팝업을 다시 띄우지 않는다. 촬영을 시도해봐야 같은 자리에서
  // 막히므로, 호출부가 "설정으로 보내라"를 알아볼 수 있게 전용 에러로 구분해 던진다.
  it('카메라 권한이 이미 거부돼 있으면 촬영을 시도하지 않고 전용 에러를 던진다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.checkPermissions).mockResolvedValue({ camera: 'denied', photos: 'granted' })

    await expect(useCamera().takePhoto()).rejects.toThrow(CameraPermissionDeniedError)
    expect(Camera.getPhoto).not.toHaveBeenCalled()
  })

  it('갤러리는 사진 권한을 본다 — 카메라가 막혀 있어도 앨범은 열린다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.checkPermissions).mockResolvedValue({ camera: 'denied', photos: 'granted' })
    vi.mocked(Camera.getPhoto).mockResolvedValue({} as Awaited<ReturnType<typeof Camera.getPhoto>>)

    await useCamera().takePhoto('gallery')

    expect(Camera.getPhoto).toHaveBeenCalledWith(expect.objectContaining({ source: 'PHOTOS' }))
  })

  it('사진 권한이 거부돼 있으면 갤러리도 photos 종류로 막는다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.checkPermissions).mockResolvedValue({ camera: 'granted', photos: 'denied' })

    await expect(useCamera().takePhoto('gallery')).rejects.toMatchObject({ kind: 'photos' })
    expect(Camera.getPhoto).not.toHaveBeenCalled()
  })

  // 아직 묻지 않은 상태(prompt)는 막지 않는다 — 플러그인이 시스템 팝업을 띄운다.
  // limited는 iOS의 "선택한 사진만 허용"으로, 고를 수 있는 상태다.
  it.each(['prompt', 'prompt-with-rationale', 'limited'] as const)(
    '권한이 %s면 촬영을 그대로 진행한다',
    async (state) => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Camera.checkPermissions).mockResolvedValue({ camera: state, photos: state })
      vi.mocked(Camera.getPhoto).mockResolvedValue(
        {} as Awaited<ReturnType<typeof Camera.getPhoto>>,
      )

      await useCamera().takePhoto()

      expect(Camera.getPhoto).toHaveBeenCalled()
    },
  )

  it('브라우저에서는 Camera.getPhoto를 호출하지 않고 파일 input을 생성한다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    const createEl = vi.spyOn(document, 'createElement')

    void useCamera().takePhoto()

    expect(Camera.getPhoto).not.toHaveBeenCalled()
    // 웹에서 checkPermissions는 unavailable을 던진다. 부르지 않아야 파일 선택이 산다.
    expect(Camera.checkPermissions).not.toHaveBeenCalled()
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
