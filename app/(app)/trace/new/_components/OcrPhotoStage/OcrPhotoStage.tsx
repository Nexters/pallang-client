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
  // 사진 요소. 블록 좌표계의 원점이자 확대가 걸리는 대상이다.
  const surfaceRef = useRef<HTMLDivElement>(null)
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
  const selection = useBlockDragSelection(scaledBlocks, selected, onSelect, surfaceRef, scale)
  const { marquee, mode } = selection
  const selectedSet = new Set(selected)
  const overflowSet = new Set(overflow)

  // 사진이 바뀌면 이전 사진에서 끌어놓은 확대를 물려주지 않는다
  const resetZoom = zoom.reset
  useEffect(() => {
    resetZoom()
  }, [imageUrl, resetZoom])

  // 손가락이 둘 이상 닿아 있는 동안. 이때 포인터 이벤트는 흘려보낸다.
  const pinchingRef = useRef(false)
  // 매 렌더마다 최신 값을 ref에 반영 — 네이티브 리스너를 한 번만 걸고도 최신 클로저를 부르기 위함
  // (Snackbar.tsx의 onCloseRef와 같은 패턴)
  const latestRef = useRef({ cancelSelection: selection.cancel, onTouches: zoom.onTouches })
  useEffect(() => {
    latestRef.current = { cancelSelection: selection.cancel, onTouches: zoom.onTouches }
  })

  // 확대는 TouchEvent로 받는다. iOS WebKit은 둘째 손가락이 닿을 때 포인터를 끊거나 둘째 포인터의
  // move를 안 주는 일이 있고, 네이티브 핀치를 막으려면 non-passive preventDefault가 필요한데
  // React의 touch 이벤트는 passive라 여기서 직접 건다. 스테이지 전체에 걸어 사진 옆 여백에 닿는
  // 손가락도 잡는다.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onTouch = (event: TouchEvent) => {
      const points = Array.from(event.touches, (touch) => ({ x: touch.clientX, y: touch.clientY }))
      const pinching = points.length >= 2
      if (pinching) {
        // 브라우저가 페이지 확대로 가져가지 못하게 막고, 고르던 것은 그 자리에서 확정한다 —
        // 되돌리면 확대하려다 고른 게 사라진다
        event.preventDefault()
        if (!pinchingRef.current) latestRef.current.cancelSelection()
      }
      // 손가락이 다 떨어졌으면 고르던 제스처도 끝난 것이다. 보통은 pointerup이 먼저 정리해 두지만,
      // iOS가 pointerup을 흘리면 제스처가 남아 다음 손가락을 다른 손가락으로 오인해 드래그가 막힌다.
      if (points.length === 0) latestRef.current.cancelSelection()
      pinchingRef.current = pinching
      latestRef.current.onTouches(points, stage)
    }
    // WebKit 고유 핀치 이벤트. 이걸 막지 않으면 touch-action: none이어도 페이지가 확대된다.
    const blockGesture = (event: Event) => {
      event.preventDefault()
    }
    stage.addEventListener('touchstart', onTouch, { passive: false })
    stage.addEventListener('touchmove', onTouch, { passive: false })
    stage.addEventListener('touchend', onTouch)
    stage.addEventListener('touchcancel', onTouch)
    stage.addEventListener('gesturestart', blockGesture)
    return () => {
      stage.removeEventListener('touchstart', onTouch)
      stage.removeEventListener('touchmove', onTouch)
      stage.removeEventListener('touchend', onTouch)
      stage.removeEventListener('touchcancel', onTouch)
      stage.removeEventListener('gesturestart', blockGesture)
    }
  }, [])

  // 선택은 포인터 이벤트로, 확대 중이 아닐 때만 받는다. 훅이 제스처를 시작한 손가락만 따르므로
  // 둘째 손가락의 pointerdown이 touchstart보다 먼저 와도 새 선택을 시작하지 않는다.
  // (isPrimary로 거르지 않는다 — iOS에서 핀치 뒤 primary 판정이 어긋나면 이후 드래그가 통째로 무시된다)
  const { handlers } = selection
  const pointerHandlers = {
    onPointerCancel: handlers.onPointerCancel,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (!pinchingRef.current) handlers.onPointerDown(event)
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      if (!pinchingRef.current) handlers.onPointerMove(event)
    },
    onPointerUp: handlers.onPointerUp,
  }

  return (
    // touch-none이라야 끄는 동안 화면이 따라 스크롤되지 않는다. 사진 옆 여백에서 시작하는
    // 손짓도 받아야 하므로 핸들러는 사진이 아니라 스테이지에 건다.
    <div
      ref={stageRef}
      className="flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden bg-bg-black select-none"
      {...pointerHandlers}
    >
      <div
        ref={surfaceRef}
        className="relative"
        style={{
          ...(fitted && { height: fitted.height, width: fitted.width }),
          // 확대는 손가락을 따라와야 해서 전환을 걸지 않는다.
          // scale이 먼저, translate가 나중에 먹어 이동량은 화면 px 그대로다.
          transform: `translate(${String(offset.x)}px, ${String(offset.y)}px) scale(${String(scale)})`,
        }}
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
