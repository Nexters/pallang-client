'use client'

import { useEffect, useRef, useState } from 'react'

import { useBlockDragSelection } from '../../_hooks/useBlockDragSelection'
import type { BlockBox } from '../../_services/blockSelection.service'

type OcrPhotoStageProps = {
  /** 원본 이미지 좌표계 기준 블록 위치 */
  blocks: BlockBox[]
  imageUrl: string
  onSelect: (indices: number[]) => void
  selected: number[]
}

export function OcrPhotoStage({ blocks, imageUrl, onSelect, selected }: OcrPhotoStageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const image = imageRef.current
    if (!image) return

    const observer = new ResizeObserver(() => {
      if (image.naturalWidth > 0) setScale(image.clientWidth / image.naturalWidth)
    })
    observer.observe(image)
    return () => {
      observer.disconnect()
    }
  }, [])

  const scaledBlocks = blocks.map((box) => ({
    height: box.height * scale,
    left: box.left * scale,
    top: box.top * scale,
    width: box.width * scale,
  }))
  const { handlers, marquee } = useBlockDragSelection(scaledBlocks, onSelect)
  const selectedSet = new Set(selected)

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-bg-black">
      {/* 드래그로 고르는 영역 — touch-none이라야 끄는 동안 화면이 따라 스크롤되지 않는다 */}
      <div className="relative touch-none select-none" {...handlers}>
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL은 next/image가 다루지 않는다 */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="촬영한 책 페이지"
          className="block max-h-full w-full object-contain"
          onLoad={(event) => {
            const image = event.currentTarget
            setScale(image.clientWidth / image.naturalWidth)
          }}
        />
        {scaledBlocks.map((box, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{ height: box.height, left: box.left, top: box.top, width: box.width }}
            className={
              selectedSet.has(index)
                ? 'absolute rounded-[2px] bg-orange-400/40'
                : 'absolute rounded-[2px] bg-white-a20'
            }
          />
        ))}
        {marquee && (
          <span
            aria-hidden="true"
            style={{
              height: marquee.height,
              left: marquee.left,
              top: marquee.top,
              width: marquee.width,
            }}
            className="absolute rounded-[2px] border border-interactive-accent bg-interactive-accent/10"
          />
        )}
      </div>
    </div>
  )
}
