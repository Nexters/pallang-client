'use client'

type Size = { height: number; width: number }

/**
 * OCR로 보내는 사진의 긴 변 상한. 책 한 쪽을 찍었을 때 글자 높이가 넉넉히 남으면서
 * 업로드가 1MB 안쪽으로 떨어지는 지점이다.
 */
export const OCR_MAX_EDGE = 2400

/** 글자 획 경계가 뭉개지면 인식률이 떨어진다. 사진용 기본값(0.8)보다 높게 잡는다. */
const JPEG_QUALITY = 0.92

/** 한 번에 절반 넘게 줄이면 계단 현상이 남는다. 그보다 크게 줄일 땐 반씩 나눠 내린다. */
const STEP_RATIO = 2

/** 비율을 유지한 채 긴 변을 maxEdge 이하로 맞춘다. 이미 작으면 그대로 둔다. */
export function fitWithin({ height, width }: Size, maxEdge: number): Size {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) return { height, width }
  const scale = maxEdge / longEdge
  return { height: Math.round(height * scale), width: Math.round(width * scale) }
}

/**
 * 업로드 전에 사진을 줄인다. 줄이지 못하면 원본을 그대로 돌려준다 — OCR을 막을 이유는 없다.
 *
 * 네이티브 플러그인(width 옵션)에 축소를 맡기지 않는 이유:
 * Capacitor Android는 Bitmap.createScaledBitmap(..., filter=false)로 줄인다(ImageUtils.java).
 * 필터 없는 축소라 글자 획이 통째로 사라지거나 계단이 져서 OCR 인식률이 크게 떨어진다.
 * 그래서 네이티브에선 원본을 받고, 여기서 보간을 켜고 줄인다.
 */
export async function shrinkForOcr(blob: Blob, maxEdge: number = OCR_MAX_EDGE): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return blob

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch (error) {
    console.warn('사진을 디코딩하지 못해 원본을 그대로 올립니다.', error)
    return blob
  }

  try {
    const target = fitWithin({ height: bitmap.height, width: bitmap.width }, maxEdge)
    if (target.width === bitmap.width && target.height === bitmap.height) return blob
    return (await drawDown(bitmap, target)) ?? blob
  } catch (error) {
    console.warn('사진을 줄이지 못해 원본을 그대로 올립니다.', error)
    return blob
  } finally {
    bitmap.close()
  }
}

async function drawDown(bitmap: ImageBitmap, target: Size): Promise<Blob | null> {
  let source: CanvasImageSource = bitmap
  let current: Size = { height: bitmap.height, width: bitmap.width }

  while (current.width > target.width * STEP_RATIO) {
    current = { height: Math.round(current.height / 2), width: Math.round(current.width / 2) }
    source = paint(source, current)
  }

  return toJpegBlob(paint(source, target))
}

function paint(source: CanvasImageSource, size: Size): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('캔버스 2d 컨텍스트를 얻지 못했습니다.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, size.width, size.height)
  return canvas
}

function toJpegBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  })
}
