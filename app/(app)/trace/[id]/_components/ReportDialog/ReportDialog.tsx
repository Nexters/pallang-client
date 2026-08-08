'use client'

import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'
import type { ReportRequest } from '@/app/_global/_queries/report.queries'
import { cn } from '@/app/_global/_services/cn.service'

import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASON_OPTIONS,
  type ReportReasonOption,
} from '../../_data/reportReason.constant'
import { buildReportRequest, canSubmitReport } from '../../_services/reportForm.service'

type ReportDialogProps = {
  open: boolean
  /** 신고 요청이 처리 중인 동안 제출 버튼을 스피너로 잠근다 */
  loading: boolean
  onClose: () => void
  onSubmit: (request: ReportRequest) => void
}

// Figma 2872:16761(기본) · 16835(사유 선택) · 16886(기타 입력) — 사유 9종을 2열로 고르는 신고 모달.
// 상세 입력 칸은 항상 보이되 기타를 골랐을 때만 활성화된다.
export function ReportDialog({ open, loading, onClose, onSubmit }: ReportDialogProps) {
  const [selected, setSelected] = useState<ReportReasonOption | null>(null)
  const [detail, setDetail] = useState('')

  // 다시 열 때 이전 신고의 입력이 남지 않게 비운다 — 렌더 도중의 상태 조정 패턴
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setSelected(null)
      setDetail('')
    }
  }

  const isDetailEnabled = selected?.requiresDetailInput === true

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        // 요청이 나간 뒤에는 백드롭·Esc로 닫지 못한다 — 결과 스낵바를 보고 닫힌다
        if (!nextOpen && !loading) onClose()
      }}
    >
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>신고하기</Dialog.Title>
        </Dialog.Header>

        <div className="flex w-full flex-col gap-2">
          <fieldset className="grid grid-cols-2 gap-x-6 gap-y-2">
            <legend className="sr-only">신고 사유</legend>
            {REPORT_REASON_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'flex h-6 cursor-pointer items-center gap-2',
                  option.requiresDetailInput && 'col-span-2',
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  className="peer sr-only"
                  checked={selected?.id === option.id}
                  onChange={() => {
                    setSelected(option)
                  }}
                />
                {/* 라디오 표시 — off는 회색 원+흰 점, on은 오렌지 원+흰 점 (Figma radioButton on/off) */}
                <span
                  aria-hidden
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full',
                    'transition-colors duration-instant ease-standard',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-interactive-accent/50',
                    selected?.id === option.id ? 'bg-interactive-accent' : 'bg-[#e5e5e5]',
                  )}
                >
                  <span className="size-2 rounded-full bg-white" />
                </span>
                <span className="text-body-14md text-text-secondary">{option.label}</span>
              </label>
            ))}
          </fieldset>

          {/* 기타 상세 — 디자인상 항상 보이고, 기타를 골랐을 때만 입력할 수 있다.
              공용 Textarea는 글자 수 카운터가 붙은 큰 입력이라 이 모달의 80px 입력 칸과 달라 직접 만든다. */}
          <textarea
            aria-label="신고 상세 내용"
            placeholder="신고 사유를 입력해 주세요"
            maxLength={REPORT_DETAIL_MAX_LENGTH}
            value={detail}
            disabled={!isDetailEnabled}
            onChange={(event) => {
              setDetail(event.target.value)
            }}
            className={cn(
              'h-20 w-full resize-none rounded bg-bg-surface px-4 py-3',
              'text-body-14md text-text-placeholder outline-none',
              'caret-interactive-accent placeholder:text-text-placeholder-a50',
              'disabled:cursor-not-allowed',
            )}
          />
        </div>

        <Dialog.Footer>
          <Button variant="back" className="h-[54px]" disabled={loading} onClick={onClose}>
            뒤로
          </Button>
          <Button
            variant="activated"
            className="h-[54px]"
            loading={loading}
            disabled={!canSubmitReport(selected, detail)}
            onClick={() => {
              if (selected === null) return
              onSubmit(buildReportRequest(selected, detail))
            }}
          >
            신고 하기
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
