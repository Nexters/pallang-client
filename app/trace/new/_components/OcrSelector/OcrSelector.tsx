'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { useCamera } from '@/app/_global/_hooks/useCamera'
import { passageMutations } from '@/app/_global/_queries/passage.queries'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { clampQuote, joinBlockTexts, type OcrBlock } from '../../_services/ocrText.service'

type PositionedBlock = OcrBlock & { left: number; top: number; width: number; height: number }

const MAX_QUOTE_LENGTH = 150

const OCR_FAILURE_MESSAGE = '글자를 읽지 못했어요. 다시 찍어주세요.'

const QUOTE_LIMIT_MESSAGE = '150자까지만 담을 수 있어요.'

export function OcrSelector() {
  const router = useRouter()
  const { dispatch } = useTraceDraft()
  const { takePhoto } = useCamera()
  const ocr = useMutation(passageMutations.ocr())
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<PositionedBlock[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState('')
  const [scale, setScale] = useState(1)
  const started = useRef(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const ocrMutateAsync = ocr.mutateAsync
  // 매 렌더마다 최신 값을 ref에 반영 (exhaustive-deps 규칙을 만족시키면서도
  // 아래 effect를 마운트 시 한 번만 실행하기 위함 — Snackbar.tsx의 onCloseRef와 동일한 패턴)
  const latestRef = useRef({ takePhoto, ocrMutateAsync, router })
  useEffect(() => {
    latestRef.current = { takePhoto, ocrMutateAsync, router }
  })

  // started는 컴포넌트 인스턴스마다 새로 생성되는 ref라, 언마운트 후 재마운트되면
  // 자동으로 false에서 다시 시작한다 — cleanup으로 되돌릴 필요가 없다.
  // (StrictMode 개발 모드의 mount→cleanup→remount 시퀀스에서 cleanup이 이 가드를
  // 풀어버리면 takePhoto()가 두 번 불려 카메라/파일 선택 프롬프트가 두 번 뜬다.)
  useEffect(() => {
    if (started.current) return
    started.current = true

    void (async () => {
      const photo = await latestRef.current.takePhoto()
      if (!photo) {
        latestRef.current.router.back()
        return
      }
      setImageUrl(photo.webPath)
      try {
        const response = await latestRef.current.ocrMutateAsync({ image: photo.blob })
        const positionedBlocks = (response.data?.blocks ?? [])
          .filter((block) => block.boundingBox.vertices.length > 0)
          .map((block) => {
            const xs = block.boundingBox.vertices.map((point) => point.x)
            const ys = block.boundingBox.vertices.map((point) => point.y)
            const left = Math.min(...xs)
            const top = Math.min(...ys)
            return {
              text: block.text,
              lineBreak: block.lineBreak,
              left,
              top,
              width: Math.max(...xs) - left,
              height: Math.max(...ys) - top,
            }
          })
        if (positionedBlocks.length === 0) {
          setMessage(OCR_FAILURE_MESSAGE)
        } else {
          setBlocks(positionedBlocks)
        }
      } catch (error) {
        console.error('OCR 인식에 실패했습니다.', error)
        setMessage(OCR_FAILURE_MESSAGE)
      }
    })()
  }, [])

  useEffect(() => {
    const image = imageRef.current
    if (!imageUrl || !image) return

    const observer = new ResizeObserver(() => {
      if (image.naturalWidth > 0) {
        setScale(image.clientWidth / image.naturalWidth)
      }
    })
    observer.observe(image)

    return () => {
      observer.disconnect()
    }
  }, [imageUrl])

  const quotedText = clampQuote(
    joinBlockTexts(blocks.filter((_, index) => selected.has(index))),
    MAX_QUOTE_LENGTH,
  )

  return (
    <div className="relative flex flex-1 flex-col bg-bg-black">
      <div className="relative flex-1 overflow-auto">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL은 next/image가 다루지 않는다
          <img
            ref={imageRef}
            src={imageUrl}
            alt="촬영한 책 페이지"
            className="w-full"
            onLoad={(event) => {
              const image = event.currentTarget
              setScale(image.clientWidth / image.naturalWidth)
            }}
          />
        )}
        {blocks.map((block, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={selected.has(index)}
            onClick={() => {
              const next = new Set(selected)
              if (next.has(index)) next.delete(index)
              else next.add(index)
              // 절단은 파생값이라 effect에서 알리면 set-state-in-effect에 걸린다.
              // 선택이 바뀌는 이 지점에서 직접 알린다.
              if (joinBlockTexts(blocks.filter((_, i) => next.has(i))).length > MAX_QUOTE_LENGTH) {
                setMessage(QUOTE_LIMIT_MESSAGE)
              }
              setSelected(next)
            }}
            style={{
              left: `${String(block.left * scale)}px`,
              top: `${String(block.top * scale)}px`,
              width: `${String(block.width * scale)}px`,
              height: `${String(block.height * scale)}px`,
            }}
            className={
              selected.has(index)
                ? 'absolute rounded-[2px] bg-orange-400/40'
                : 'absolute rounded-[2px] bg-white-a20'
            }
          />
        ))}
      </div>

      <div
        className="flex gap-2 px-4 py-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            router.back()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={quotedText.length === 0}
          onClick={() => {
            dispatch({ type: 'setQuotedText', quotedText })
            router.push('/trace/new/detail')
          }}
        >
          다음
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
