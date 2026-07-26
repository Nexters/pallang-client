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
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingRight: 'max(2rem, env(safe-area-inset-right))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(2rem, env(safe-area-inset-left))',
      }}
    >
      <button
        type="button"
        onClick={() => void onCapture()}
        className="rounded-full bg-foreground px-10 py-4 text-lg font-semibold text-background shadow-lg transition active:scale-95"
      >
        사진 촬영
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="촬영 결과" className="max-h-[50dvh] max-w-full rounded-2xl" />}
    </main>
  )
}
