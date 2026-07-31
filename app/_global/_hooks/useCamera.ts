'use client'

import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

import { CAMERA_OPTIONS, GALLERY_OPTIONS } from '@/app/_global/_data/camera.constant'
import { shrinkForOcr } from '@/app/_global/_services/photoResize.service'

export type Photo = { webPath: string; blob: Blob }

export type PhotoSource = 'camera' | 'gallery'

/**
 * 사진을 가져온다. 사용자가 취소하면 null을 반환하고, 촬영·변환이 실패하면 throw한다.
 * 호출부가 둘을 구분해야 한다 — 취소는 되돌아가고, 실패는 대안을 안내해야 하기 때문이다.
 */
export function useCamera(): {
  takePhoto: (source?: PhotoSource) => Promise<null | Photo>
} {
  const takePhoto = async (source: PhotoSource = 'camera'): Promise<null | Photo> => {
    const blob = await getPhotoBlob(source)
    if (!blob) return null
    // 촬영·선택 어느 쪽이든 같은 크기로 맞춘다 — OCR에 들어가는 입력을 한 가지로 묶어야
    // 인식 결과가 경로에 따라 달라지지 않는다.
    return toPhoto(await shrinkForOcr(blob))
  }

  return { takePhoto }
}

async function getPhotoBlob(source: PhotoSource): Promise<Blob | null> {
  if (!Capacitor.isNativePlatform()) return pickFileFromInput(source)
  const photo = await getNativePhoto(source)
  if (!photo?.dataUrl) return null
  return (await fetch(photo.dataUrl)).blob()
}

async function getNativePhoto(source: PhotoSource) {
  try {
    // source를 지정한 getPhoto는 신규 API로 대체되지 않아 의도적으로 사용한다.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return await Camera.getPhoto(source === 'gallery' ? GALLERY_OPTIONS : CAMERA_OPTIONS)
  } catch (error) {
    // Capacitor는 취소도 예외로 알린다. 코드가 따로 없어 메시지로 구분할 수밖에 없다.
    if (error instanceof Error && /cancel/i.test(error.message)) return null
    throw error
  }
}

function toPhoto(blob: Blob): Photo {
  // 화면에 띄우는 이미지와 업로드하는 이미지가 같아야 OCR 좌표가 맞는다.
  // data URL을 그대로 쓰면 문자열이 커서 blob URL로 바꿔 단다.
  return { webPath: URL.createObjectURL(blob), blob }
}

function pickFileFromInput(source: PhotoSource): Promise<Blob | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    // capture가 붙으면 브라우저가 카메라를 먼저 연다. 앨범 선택에는 붙이지 않는다.
    if (source === 'camera') input.setAttribute('capture', 'environment')
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null)
    })
    input.addEventListener('cancel', () => {
      resolve(null)
    })
    input.click()
  })
}
