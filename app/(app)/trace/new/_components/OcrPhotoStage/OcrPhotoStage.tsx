'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { useBlockDragSelection } from '../../_hooks/useBlockDragSelection'
import { usePinchZoom } from '../../_hooks/usePinchZoom'
import type { BlockBox } from '../../_services/blockSelection.service'

type OcrPhotoStageProps = {
  /** 원본 이미지 좌표계 기준 블록 위치 */
  blocks: BlockBox[]
  imageUrl: string
  onSelect: (indices: number[]) => void
  /** 골랐지만 길이 상한을 넘겨 발췌문에 담기지 않은 블록 */
  overflow: number[]
  selected: number[]
}

type Size = { height: number; width: number }

/**
 * 어절 하나의 표시. 고른 것과 "골랐지만 담기지 않은 것"을 갈라, 상한을 넘긴 뒤로는
 * 사진만 봐도 어디까지 발췌문에 들어갔는지 알 수 있게 한다.
 */
function blockClassName(picked: boolean, overflowed: boolean): string {
  if (overflowed)
    return 'absolute rounded-[2px] border border-dashed border-white-a40 bg-ocr-block-overflow'
  return picked
    ? 'absolute rounded-[2px] bg-ocr-block-picked'
    : 'absolute rounded-[2px] bg-ocr-block'
}

/** 남는 영역 안에 비율을 지키며 사진을 앉힌다. CSS 퍼센트로 풀면 부모 높이가 auto라 순환이 생긴다. */
function fitInside(natural: Size, stage: Size) {
  const scale = Math.min(stage.width / natural.width, stage.height / natural.height)
  return { height: natural.height * scale, scale, width: natural.width * scale }
}

export function OcrPhotoStage({
  blocks,
  imageUrl,
  onSelect,
  overflow,
  selected,
}: OcrPhotoStageProps) {
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
  const fitScale = fitted?.scale ?? 0
  const scaledBlocks = blocks.map((box) => ({
    height: box.height * fitScale,
    left: box.left * fitScale,
    top: box.top * fitScale,
    width: box.width * fitScale,
  }))
  const zoom = usePinchZoom(fitted && { height: fitted.height, width: fitted.width })
  const { offset, scale } = zoom.transform
  const { handlers, marquee, mode } = useBlockDragSelection(scaledBlocks, selected, onSelect, scale)
  const selectedSet = new Set(selected)
  const overflowSet = new Set(overflow)

  // 사진이 바뀌면 이전 사진에서 끌어놓은 확대를 물려주지 않는다
  const resetZoom = zoom.reset
  useEffect(() => {
    resetZoom()
  }, [imageUrl, resetZoom])

  // 손가락 하나는 문장을 고르고, 둘부터는 사진을 확대하거나 민다.
  // 두 번째 손가락이 닿으면 고르던 것을 그 자리에서 확정한다 — 되돌리면 확대하려다 고른 게 사라진다.
  const activePointers = useRef(new Set<number>())
  const routed = {
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
      activePointers.current.delete(event.pointerId)
      zoom.onPointerCancel(event)
      handlers.onPointerCancel()
    },
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      // 손가락마다 따로 캡처해야 사진 밖으로 벗어나도 핀치가 끊기지 않는다
      event.currentTarget.setPointerCapture(event.pointerId)
      activePointers.current.add(event.pointerId)
      zoom.onPointerDown(event)
      if (activePointers.current.size === 1) handlers.onPointerDown(event)
      else handlers.onPointerUp()
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      // 줌에는 항상 흘린다 — 손가락 하나일 때 위치를 낡게 두면 둘째가 닿는 순간 기준 간격이
      // 처음 닿은 자리로 잡혀, 실제보다 훨씬 더 벌려야 겨우 확대가 시작된다.
      // 훅 스스로 손가락이 둘일 때만 움직이므로 하나일 땐 위치만 갱신하고 끝난다.
      zoom.onPointerMove(event)
      if (activePointers.current.size === 1) handlers.onPointerMove(event)
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      activePointers.current.delete(event.pointerId)
      zoom.onPointerUp(event)
      handlers.onPointerUp()
    },
  }

  return (
    <div
      ref={stageRef}
      className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-bg-black"
    >
      {/* 드래그로 고르는 영역 — touch-none이라야 끄는 동안 화면이 따라 스크롤되지 않는다 */}
      <div
        className="relative touch-none select-none"
        style={{
          ...(fitted && { height: fitted.height, width: fitted.width }),
          // 확대는 손가락을 따라와야 해서 전환을 걸지 않는다.
          // scale이 먼저, translate가 나중에 먹어 이동량은 화면 px 그대로다.
          transform: `translate(${String(offset.x)}px, ${String(offset.y)}px) scale(${String(scale)})`,
        }}
        {...routed}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL은 next/image가 다루지 않는다 */}
        <img src={imageUrl} alt="촬영한 책 페이지" className="block size-full" />
        {scaledBlocks.map((box, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{ height: box.height, left: box.left, top: box.top, width: box.width }}
            className={blockClassName(selectedSet.has(index), overflowSet.has(index))}
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
            // 빼는 제스처는 색을 갈라 보여준다 — 더하려다 해제 모드로 걸린 걸 끄는 중에 알아챌 수 있다
            className={
              mode === 'remove'
                ? 'absolute rounded-[2px] border border-white-a60 bg-white-a10'
                : 'absolute rounded-[2px] border border-interactive-accent bg-interactive-accent/10'
            }
          />
        )}
      </div>
    </div>
  )
}
