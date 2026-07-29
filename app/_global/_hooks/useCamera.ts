'use client'

import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

import { CAMERA_OPTIONS } from '@/app/_global/_data/camera.constant'

export type Photo = { webPath: string; blob: Blob }

export function useCamera(): { takePhoto: () => Promise<Photo | null> } {
  const takePhoto = async (): Promise<Photo | null> => {
    if (Capacitor.isNativePlatform()) {
      // CAMERA_OPTIONS의 프롬프트 소스 선택은 신규 takePhoto/chooseFromGallery API로 대체되지 않아
      // getPhoto를 의도적으로 사용한다.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const photo = await Camera.getPhoto(CAMERA_OPTIONS)
      return photo.dataUrl ? await toPhoto(photo.dataUrl) : null
    }
    return takePhotoFromFileInput()
  }

  return { takePhoto }
}

async function toPhoto(dataUrl: string): Promise<Photo | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob()
    // 화면에 띄우는 이미지와 업로드하는 이미지가 같아야 OCR 좌표가 맞는다.
    // data URL을 그대로 쓰면 문자열이 커서 blob URL로 바꿔 단다.
    return { webPath: URL.createObjectURL(blob), blob }
  } catch (error) {
    console.error('사진을 blob으로 변환하는 데 실패했습니다.', error)
    return null
  }
}

function takePhotoFromFileInput(): Promise<Photo | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.setAttribute('capture', 'environment')
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      resolve(file ? { webPath: URL.createObjectURL(file), blob: file } : null)
    })
    input.addEventListener('cancel', () => {
      resolve(null)
    })
    input.click()
  })
}
