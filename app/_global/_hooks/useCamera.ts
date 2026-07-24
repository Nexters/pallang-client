'use client'

import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

import { CAMERA_OPTIONS } from '@/app/_global/_data/camera.constant'

export type Photo = { webPath: string }

export function useCamera(): { takePhoto: () => Promise<Photo | null> } {
  const takePhoto = async (): Promise<Photo | null> => {
    if (Capacitor.isNativePlatform()) {
      // CAMERA_OPTIONS의 프롬프트 소스 선택은 신규 takePhoto/chooseFromGallery API로 대체되지 않아
      // getPhoto를 의도적으로 사용한다.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const photo = await Camera.getPhoto(CAMERA_OPTIONS)
      return photo.webPath ? { webPath: photo.webPath } : null
    }
    return takePhotoFromFileInput()
  }

  return { takePhoto }
}

function takePhotoFromFileInput(): Promise<Photo | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.setAttribute('capture', 'environment')
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      resolve(file ? { webPath: URL.createObjectURL(file) } : null)
    })
    input.click()
  })
}
