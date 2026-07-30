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
      className="flex min-h-full flex-col items-center justify-center gap-8 p-8"
      // 상단 인셋은 레이아웃 셸이 소비한다 — 좌우·하단만 직접 피한다
      style={{
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
