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
      return photo.webPath ? await toPhoto(photo.webPath) : null
    }
    return takePhotoFromFileInput()
  }

  return { takePhoto }
}

async function toPhoto(webPath: string): Promise<Photo | null> {
  try {
    const res = await fetch(webPath)
    return { webPath, blob: await res.blob() }
  } catch (error) {
    console.error('사진 웹뷰 경로를 blob으로 변환하는 데 실패했습니다.', error)
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
