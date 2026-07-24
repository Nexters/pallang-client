'use client'

import { useState } from 'react'

import { useCamera } from '@/app/_global/_hooks/useCamera'

export function CameraCheck() {
  const { takePhoto } = useCamera()
  const [src, setSrc] = useState<string | null>(null)

  const onCapture = async () => {
    const photo = await takePhoto()
    if (photo) setSrc(photo.webPath)
  }

  return (
    <div>
      <button type="button" onClick={() => void onCapture()}>
        사진 촬영
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="촬영 결과" />}
    </div>
  )
}
