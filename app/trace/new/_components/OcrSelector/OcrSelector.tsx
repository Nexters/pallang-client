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
  const ocrMutateAsync = ocr.mutateAsync

  useEffect(() => {
    if (started.current) return
    started.current = true

    void (async () => {
      const photo = await takePhoto()
      if (!photo) {
        router.back()
        return
      }
      setImageUrl(photo.webPath)
      try {
        const response = await ocrMutateAsync({ image: photo.blob })
        setBlocks(
          (response.data?.blocks ?? []).map((block) => {
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
          }),
        )
      } catch {
        setMessage('글자를 읽지 못했어요. 다시 찍어주세요.')
      }
    })()
  }, [takePhoto, ocrMutateAsync, router])

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
              setSelected((prev) => {
                const next = new Set(prev)
                if (next.has(index)) next.delete(index)
                else next.add(index)
                return next
              })
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

      <div className="flex gap-2 px-4 py-4">
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
