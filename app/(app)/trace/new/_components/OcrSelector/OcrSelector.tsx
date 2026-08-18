'use client'

import { App } from '@capacitor/app'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import {
  CameraPermissionDeniedError,
  type CameraPermissionKind,
} from '@/app/_global/_data/camera.model'
import type { Photo, PhotoSource } from '@/app/_global/_hooks/useCamera'
import { useCamera } from '@/app/_global/_hooks/useCamera'
import { passageMutations } from '@/app/_global/_queries/passage.queries'

import { MAX_QUOTE_LENGTH } from '../../_data/quote.constant'
import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceCapture } from '../../_hooks/useTraceCapture'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import type { BlockBox } from '../../_services/blockSelection.service'
import { countWithinLimit, joinBlockTexts, type OcrBlock } from '../../_services/ocrText.service'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { OcrPermissionNotice } from '../OcrPermissionNotice/OcrPermissionNotice'
import { OcrPhotoStage } from '../OcrPhotoStage/OcrPhotoStage'
import { OcrQuoteSheet } from '../OcrQuoteSheet/OcrQuoteSheet'
import { OcrScanningOverlay } from '../OcrScanningOverlay/OcrScanningOverlay'
import { OcrSelectionHint } from '../OcrSelectionHint/OcrSelectionHint'

type PositionedBlock = BlockBox & OcrBlock

const OCR_FAILURE_MESSAGE = '사진에서 글자를 읽지 못했어요.\n다시 찍거나 갤러리에서 골라주세요.'

const EDIT_REPLACED_MESSAGE = '고쳐 쓴 내용이 새로 고른 문장으로 바뀌었어요.'

const QUOTE_LIMIT_MESSAGE = `${String(MAX_QUOTE_LENGTH)}자를 넘는 부분은 담기지 않아요.`

export function OcrSelector() {
  const { goBack, goTo } = useTraceNav()
  const { dispatch } = useTraceDraft()
  const { takePhoto } = useCamera()
  // 방식 선택 화면이 사용자의 탭 안에서 이미 시작해 둔 촬영
  const { take: takeHandedCapture } = useTraceCapture()
  const ocr = useMutation(passageMutations.ocr())
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<PositionedBlock[]>([])
  const [selected, setSelected] = useState<number[]>([])
  // 인식이 틀린 글자를 손으로 고친 값. null이면 선택한 블록에서 그대로 뽑아 쓴다.
  const [editedText, setEditedText] = useState<null | string>(null)
  // 사진이 놓일 자리에 대신 띄우는 실패 안내. 갤러리로 이어서 진행할 수 있다.
  const [failure, setFailure] = useState<null | string>(null)
  // 이미 거부된 권한. 재시도로는 풀리지 않아 실패와 다른 안내를 띄운다.
  const [permissionBlocked, setPermissionBlocked] = useState<CameraPermissionKind | null>(null)
  // 실패·권한 안내 화면에서 카메라 대신 글로 대목을 남기는 대안. 이 화면 위 한 층일 뿐이다.
  const [manualOpen, setManualOpen] = useState(false)
  const [message, setMessage] = useState('')
  const started = useRef(false)
  const objectUrlRef = useRef<string | null>(null)
  const ocrMutateAsync = ocr.mutateAsync
  // 매 렌더마다 최신 값을 ref에 반영 (exhaustive-deps 규칙을 만족시키면서도
  // runCapture를 안정된 참조로 유지하기 위함 — Snackbar.tsx의 onCloseRef와 동일한 패턴)
  const latestRef = useRef({ goBack, ocrMutateAsync, takePhoto })
  useEffect(() => {
    latestRef.current = { goBack, ocrMutateAsync, takePhoto }
  })

  // 웹에서는 takePhoto가 blob URL을 만든다. 다시 찍을 때마다 쌓이므로 이전 것을 해제한다.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    [],
  )

  const runCapture = useCallback(
    async (
      isInitial: boolean,
      source: PhotoSource = 'camera',
      /** 이미 시작해 둔 촬영. 넘어오면 새로 열지 않고 그 결과를 기다린다. */
      handed: Promise<null | Photo> | null = null,
    ) => {
      let photo: null | Photo
      try {
        photo = await (handed ?? latestRef.current.takePhoto(source))
      } catch (error) {
        // 권한이 이미 꺼져 있으면 다시 찍어도 같은 벽이다. 설정으로 보내는 안내로 갈아탄다.
        if (error instanceof CameraPermissionDeniedError) {
          setFailure(null)
          setPermissionBlocked(error.kind)
          return
        }
        // 취소는 null로 오고 여기 오는 건 실제 실패다. 되돌리지 말고 대안을 보여준다.
        console.error('사진을 가져오지 못했습니다.', error)
        setFailure(
          source === 'camera'
            ? '카메라를 열지 못했어요.\n갤러리에서 사진을 골라주세요.'
            : '사진을 가져오지 못했어요.\n다시 시도해주세요.',
        )
        return
      }

      if (!photo) {
        // 첫 진입에서 촬영을 취소하면 보여줄 사진이 없다. 다시 찍기 취소는 기존 사진을 유지한다.
        if (isInitial) latestRef.current.goBack()
        return
      }

      setFailure(null)
      setPermissionBlocked(null)
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
            // lineBreak는 인쇄된 줄의 끝을 뜻할 뿐이라 발췌문에 옮기지 않는다(ocrText.service 참고)
            return {
              height: Math.max(...ys) - top,
              left,
              text: block.text,
              top,
              width: Math.max(...xs) - left,
            }
          })
        // 한 글자도 못 읽었으면 사진만 덩그러니 남는다. 실패와 같은 자리에서 안내한다.
        if (positionedBlocks.length === 0) setFailure(OCR_FAILURE_MESSAGE)
        else setBlocks(positionedBlocks)
      } catch (error) {
        console.error('글자 인식에 실패했습니다.', error)
        setFailure(OCR_FAILURE_MESSAGE)
      }
    },
    [],
  )

  // started는 컴포넌트 인스턴스마다 새로 생성되는 ref라, 언마운트 후 재마운트되면
  // 자동으로 false에서 다시 시작한다 — cleanup으로 되돌릴 필요가 없다.
  // (StrictMode 개발 모드의 mount→cleanup→remount 시퀀스에서 cleanup이 이 가드를
  // 풀어버리면 takePhoto()가 두 번 불려 카메라/파일 선택 프롬프트가 두 번 뜬다.)
  useEffect(() => {
    if (started.current) return
    started.current = true
    // 방식 선택 화면이 사용자의 탭 안에서 이미 카메라를 열어 두었으면 그 결과를 이어받는다.
    // 없으면(새로고침·직접 진입) 여기서 연다 — 네이티브는 조작 권한을 따지지 않아 그대로 열린다.
    void runCapture(true, 'camera', takeHandedCapture())
  }, [runCapture, takeHandedCapture])

  // 설정에서 권한을 켜고 돌아왔으면 바로 이어서 진행한다.
  // iOS는 권한을 바꾸는 순간 OS가 앱을 종료시켜 이 경로로 돌아오지 않는다 — 실질적으로 Android용이다.
  // 권한이 그대로면 takePhoto가 다시 같은 에러를 던져 상태가 유지되므로 별도 확인이 필요 없다.
  useEffect(() => {
    if (!permissionBlocked) return
    const source: PhotoSource = permissionBlocked === 'photos' ? 'gallery' : 'camera'
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void runCapture(false, source)
    })
    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [permissionBlocked, runCapture])

  // 직접 입력 시트는 실패·권한 안내 화면 위에 얹힌 한 층이다 — 뒤로가기는 이 화면을 떠나는 대신
  // 시트만 닫는다.
  useOverlayBackGuard(manualOpen, () => {
    setManualOpen(false)
  })

  const selectedBlocks = selected.map((index) => blocks[index]).filter((b) => !!b)
  // 상한을 넘긴 어절은 글자 중간을 자르지 않고 통째로 빼둔다. 사진에서도 같은 경계로 갈라 보여준다.
  const includedCount = countWithinLimit(selectedBlocks, MAX_QUOTE_LENGTH)
  const quotedText = editedText ?? joinBlockTexts(selectedBlocks.slice(0, includedCount))
  // 직접 고쳐 쓴 글은 어느 어절에서 왔는지 따질 수 없다. 그때는 사진과 시트 양쪽에서 넘침 표시를 걷는다.
  const overflow = editedText === null ? selected.slice(includedCount) : []
  const hasOverflow = overflow.length > 0

  return (
    // min-h-0이 없으면 사진이 세로로 길 때 flex 아이템이 콘텐츠 높이 아래로 줄지 못해
    // 아래 시트가 화면 밖으로 밀린다
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-black">
      {permissionBlocked ? (
        <OcrPermissionNotice
          kind={permissionBlocked}
          onPickFromGallery={() => {
            void runCapture(false, 'gallery')
          }}
          onManualInput={() => {
            setManualOpen(true)
          }}
        />
      ) : failure ? (
        <div
          role="alert"
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
        >
          <p className="whitespace-pre-line text-body-16md text-text-inverse opacity-80">
            {failure}
          </p>
          <div className="flex w-full max-w-[311px] flex-col gap-2">
            <Button
              className="h-[54px] px-6"
              onClick={() => {
                void runCapture(false, 'gallery')
              }}
            >
              갤러리에서 선택하기
            </Button>
            {/* 카메라·갤러리 모두 막혀도 글로 대목을 남길 수 있는 대안 */}
            <Button
              variant="back"
              className="h-[54px] px-6"
              onClick={() => {
                setManualOpen(true)
              }}
            >
              직접 입력하기
            </Button>
          </div>
        </div>
      ) : imageUrl ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <OcrPhotoStage
            imageUrl={imageUrl}
            blocks={blocks}
            selected={selected}
            overflow={overflow}
            onSelect={(indices) => {
              // 훅이 실제로 달라진 선택만 넘긴다. 여백을 탭했을 뿐이면 여기까지 오지 않는다.
              // 고쳐 쓴 글이 사라지는 건 되돌릴 수 없으니, 덮이는 순간을 말없이 넘기지 않는다.
              // 상한은 사진의 점선과 카운터가 계속 보여주지만, 넘어서는 그 순간은 알려야 손이 멈춘다.
              // 넘어선 채로 더 끄는 동안 매번 띄우면 시끄러우니 경계를 건너는 순간에만.
              const nextBlocks = indices.map((i) => blocks[i]).filter((b) => !!b)
              const crossesLimit =
                overflow.length === 0 &&
                countWithinLimit(nextBlocks, MAX_QUOTE_LENGTH) < nextBlocks.length
              if (editedText !== null) setMessage(EDIT_REPLACED_MESSAGE)
              else if (crossesLimit) setMessage(QUOTE_LIMIT_MESSAGE)
              setSelected(indices)
              // 새로 끌면 손으로 고친 내용 대신 새 선택을 따른다
              setEditedText(null)
            }}
          />
          {/* 사진은 떴지만 아직 글자 인식 중인 구간 — 스테이지 위에 딤+스캔을 얹는다 */}
          {ocr.isPending && <OcrScanningOverlay />}
          {/* 고를 어절은 있는데 아직 아무것도 고르지 않은 동안에만 길을 알려준다 */}
          {!ocr.isPending && blocks.length > 0 && selected.length === 0 && editedText === null && (
            <OcrSelectionHint />
          )}
        </div>
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
        hasOverflow={hasOverflow}
        canClear={selected.length > 0 || editedText !== null}
        onChange={setEditedText}
        onClearAll={() => {
          setSelected([])
          setEditedText(null)
        }}
        onClose={() => {
          goBack()
        }}
        onRetake={() => {
          void runCapture(false)
        }}
        onSubmit={() => {
          dispatch({ type: 'setQuotedText', quotedText })
          goTo('write')
        }}
      />

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />

      <ManualQuoteSheet
        open={manualOpen}
        onClose={() => {
          setManualOpen(false)
        }}
        onSubmit={(manualQuotedText) => {
          // 사진으로 시작했더라도 실제로 대목을 얻은 방식은 직접 입력이다
          dispatch({ type: 'setSource', source: 'manual' })
          dispatch({ type: 'setQuotedText', quotedText: manualQuotedText })
          goTo('write')
        }}
      />
    </div>
  )
}
