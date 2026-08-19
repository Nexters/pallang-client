'use client'

import type { ReactNode } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

type FlatDialogProps = {
  open: boolean
  title: ReactNode
  /** 제목만으로 충분한 다이얼로그도 있어 선택이다 */
  description?: ReactNode
  cancelLabel: string
  confirmLabel: string
  /** 확정 요청이 처리 중인 동안 확인 버튼을 스피너로 잠근다 */
  loading?: boolean
  /** 확정할 수 없는 상태(연결할 API가 아직 없는 등)에서 확인 버튼만 죽인다 */
  confirmDisabled?: boolean
  /** 마스코트를 카드 위로 얹을지. 문구만으로 서는 확인 다이얼로그(218:12135)는 걷어 낸다. */
  illustrated?: boolean
  /**
   * 백드롭·Esc로 닫을 수 있는지. 두 선택지 중 하나를 반드시 골라야 하는 다이얼로그는 false로 막는다.
   * 닫힘은 취소로 취급한다 — 백드롭을 눌러 빠져나가는 건 '아니오'와 같다.
   */
  dismissible?: boolean
  onCancel: () => void
  /** `confirmDisabled`로 확정을 막아 둔 다이얼로그는 생략한다 */
  onConfirm?: () => void
}

/**
 * 제목·설명에 취소/확인 두 버튼이 붙는, 앱에서 가장 흔한 다이얼로그 형태.
 * Dialog 조각을 매번 조립하면 여백·타이포·버튼 variant가 화면마다 갈려서 한 형태로 묶어 둔다.
 * 이 틀에서 벗어나는 다이얼로그(폼·본문 블록·전용 일러스트)는 Dialog 조각을 직접 조립한다.
 */
export function FlatDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  loading = false,
  confirmDisabled = false,
  illustrated = true,
  dismissible = true,
  onCancel,
  onConfirm,
}: FlatDialogProps) {
  return (
    <Dialog.Root
      open={open}
      // onOpenChange를 주지 않으면 백드롭·Esc로 상태가 바뀌지 않는다(바깥 클릭 닫힘은 base-ui 기본값도 off)
      onOpenChange={
        dismissible
          ? (nextOpen) => {
              if (!nextOpen) onCancel()
            }
          : undefined
      }
    >
      <Dialog.Content illustrated={illustrated}>
        {illustrated && <Dialog.Illustration />}
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          {description !== undefined && description !== null && (
            <Dialog.Description>{description}</Dialog.Description>
          )}
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="back" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="activated"
            loading={loading}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
