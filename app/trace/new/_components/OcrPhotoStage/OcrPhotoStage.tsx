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

type Size = { height: number; width: number }

/** 남는 영역 안에 비율을 지키며 사진을 앉힌다. CSS 퍼센트로 풀면 부모 높이가 auto라 순환이 생긴다. */
function fitInside(natural: Size, stage: Size) {
  const scale = Math.min(stage.width / natural.width, stage.height / natural.height)
  return { height: natural.height * scale, scale, width: natural.width * scale }
}

export function OcrPhotoStage({ blocks, imageUrl, onSelect, selected }: OcrPhotoStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState<Size | null>(null)
  // 사진이 바뀌면 이전 크기를 그대로 쓰면 안 된다. 어느 URL을 잰 값인지 함께 들고 다닌다.
  const [measured, setMeasured] = useState<{ size: Size; url: string } | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const observer = new ResizeObserver(() => {
      setStageSize({ height: stage.clientHeight, width: stage.clientWidth })
    })
    observer.observe(stage)
    return () => {
      observer.disconnect()
    }
  }, [])

  // 사진을 미리 읽어 원본 크기를 먼저 확보한다. 렌더된 <img>에서 읽으면
  // 크기가 정해지기 전 한 프레임 동안 블록 위치가 어긋난다.
  useEffect(() => {
    const image = new Image()
    image.addEventListener('load', () => {
      // image.src는 절대 URL로 정규화되므로 비교용으로는 넘겨받은 값을 그대로 쓴다
      setMeasured({
        size: { height: image.naturalHeight, width: image.naturalWidth },
        url: imageUrl,
      })
    })
    image.src = imageUrl
  }, [imageUrl])

  const naturalSize = measured?.url === imageUrl ? measured.size : null
  const fitted = naturalSize && stageSize ? fitInside(naturalSize, stageSize) : null
  const scale = fitted?.scale ?? 0
  const scaledBlocks = blocks.map((box) => ({
    height: box.height * scale,
    left: box.left * scale,
    top: box.top * scale,
    width: box.width * scale,
  }))
  const { handlers, marquee } = useBlockDragSelection(scaledBlocks, onSelect)
  const selectedSet = new Set(selected)

  return (
    <div
      ref={stageRef}
      className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-bg-black"
    >
      {/* 드래그로 고르는 영역 — touch-none이라야 끄는 동안 화면이 따라 스크롤되지 않는다 */}
      <div
        className="relative touch-none select-none"
        style={fitted ? { height: fitted.height, width: fitted.width } : undefined}
        {...handlers}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL은 next/image가 다루지 않는다 */}
        <img src={imageUrl} alt="촬영한 책 페이지" className="block size-full" />
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
