'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { useCamera } from '@/app/_global/_hooks/useCamera'
import { passageMutations } from '@/app/_global/_queries/passage.queries'

import { MAX_QUOTE_LENGTH } from '../../_data/quote.constant'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import type { BlockBox } from '../../_services/blockSelection.service'
import { clampQuote, joinBlockTexts, type OcrBlock } from '../../_services/ocrText.service'
import { OcrPhotoStage } from '../OcrPhotoStage/OcrPhotoStage'
import { OcrQuoteSheet } from '../OcrQuoteSheet/OcrQuoteSheet'

type PositionedBlock = BlockBox & OcrBlock

const OCR_FAILURE_MESSAGE = '글자를 읽지 못했어요. 다시 찍어주세요.'

const QUOTE_LIMIT_MESSAGE = `${String(MAX_QUOTE_LENGTH)}자까지만 담을 수 있어요.`

export function OcrSelector() {
  const router = useRouter()
  const { dispatch } = useTraceDraft()
  const { takePhoto } = useCamera()
  const ocr = useMutation(passageMutations.ocr())
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<PositionedBlock[]>([])
  const [selected, setSelected] = useState<number[]>([])
  // 인식이 틀린 글자를 손으로 고친 값. null이면 선택한 블록에서 그대로 뽑아 쓴다.
  const [editedText, setEditedText] = useState<null | string>(null)
  const [message, setMessage] = useState('')
  const started = useRef(false)
  const objectUrlRef = useRef<string | null>(null)
  const ocrMutateAsync = ocr.mutateAsync
  // 매 렌더마다 최신 값을 ref에 반영 (exhaustive-deps 규칙을 만족시키면서도
  // runCapture를 안정된 참조로 유지하기 위함 — Snackbar.tsx의 onCloseRef와 동일한 패턴)
  const latestRef = useRef({ ocrMutateAsync, router, takePhoto })
  useEffect(() => {
    latestRef.current = { ocrMutateAsync, router, takePhoto }
  })

  // 웹에서는 takePhoto가 blob URL을 만든다. 다시 찍을 때마다 쌓이므로 이전 것을 해제한다.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    [],
  )

  const runCapture = useCallback(async (isInitial: boolean) => {
    const photo = await latestRef.current.takePhoto()
    if (!photo) {
      // 첫 진입에서 촬영을 취소하면 보여줄 사진이 없다. 다시 찍기 취소는 기존 사진을 유지한다.
      if (isInitial) latestRef.current.router.back()
      return
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = photo.webPath.startsWith('blob:') ? photo.webPath : null
    setImageUrl(photo.webPath)
    setBlocks([])
    setSelected([])
    setEditedText(null)

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
            height: Math.max(...ys) - top,
            left,
            lineBreak: block.lineBreak,
            text: block.text,
            top,
            width: Math.max(...xs) - left,
          }
        })
      if (positionedBlocks.length === 0) setMessage(OCR_FAILURE_MESSAGE)
      else setBlocks(positionedBlocks)
    } catch (error) {
      console.error('OCR 인식에 실패했습니다.', error)
      setMessage(OCR_FAILURE_MESSAGE)
    }
  }, [])

  // started는 컴포넌트 인스턴스마다 새로 생성되는 ref라, 언마운트 후 재마운트되면
  // 자동으로 false에서 다시 시작한다 — cleanup으로 되돌릴 필요가 없다.
  // (StrictMode 개발 모드의 mount→cleanup→remount 시퀀스에서 cleanup이 이 가드를
  // 풀어버리면 takePhoto()가 두 번 불려 카메라/파일 선택 프롬프트가 두 번 뜬다.)
  useEffect(() => {
    if (started.current) return
    started.current = true
    void runCapture(true)
  }, [runCapture])

  const selectedText = joinBlockTexts(selected.map((index) => blocks[index]).filter((b) => !!b))
  const quotedText = editedText ?? clampQuote(selectedText, MAX_QUOTE_LENGTH)

  return (
    // min-h-0이 없으면 사진이 세로로 길 때 flex 아이템이 콘텐츠 높이 아래로 줄지 못해
    // 아래 시트가 화면 밖으로 밀린다
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-black">
      {imageUrl ? (
        <OcrPhotoStage
          imageUrl={imageUrl}
          blocks={blocks}
          selected={selected}
          onSelect={(indices) => {
            // 절단은 파생값이라 effect에서 알리면 set-state-in-effect에 걸린다.
            // 선택이 바뀌는 이 지점에서 직접 알린다.
            if (
              joinBlockTexts(indices.map((i) => blocks[i]).filter((b) => !!b)).length >
              MAX_QUOTE_LENGTH
            )
              setMessage(QUOTE_LIMIT_MESSAGE)
            setSelected(indices)
            // 새로 끌면 손으로 고친 내용 대신 새 선택을 따른다
            setEditedText(null)
          }}
        />
      ) : (
        <p
          role="status"
          className="flex flex-1 items-center justify-center text-body-16md text-text-inverse opacity-60"
        >
          사진을 불러오는 중이에요.
        </p>
      )}

      <OcrQuoteSheet
        quotedText={quotedText}
        onChange={setEditedText}
        onClose={() => {
          router.back()
        }}
        onRetake={() => {
          void runCapture(false)
        }}
        onSubmit={() => {
          dispatch({ type: 'setQuotedText', quotedText })
          router.push('/trace/new/detail')
        }}
      />

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
