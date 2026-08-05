'use client'

import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'
import type { ReportReason, ReportRequest } from '@/app/_global/_queries/report.queries'

import { REPORT_DETAIL_MAX_LENGTH, REPORT_REASON_OPTIONS } from '../../_data/reportReason.constant'
import { buildReportRequest, canSubmitReport } from '../../_services/reportForm.service'

type ReportSheetProps = {
  open: boolean
  /** 신고 요청이 처리 중인 동안 제출 버튼을 스피너로 잠근다 */
  loading: boolean
  onClose: () => void
  onSubmit: (request: ReportRequest) => void
}

// ponytail: 신고 시트 확정 디자인이 없다 — 기존 BottomSheet·Textarea·Button으로 만든 1차 구현.
// 디자인이 나오면 사유 목록·타이포·간격을 맞출 것.
export function ReportSheet({ open, loading, onClose, onSubmit }: ReportSheetProps) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [detail, setDetail] = useState('')

  // 다시 열 때 이전 신고의 입력이 남지 않게 비운다 — 렌더 도중의 상태 조정 패턴
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setReason(null)
      setDetail('')
    }
  }

  return (
    <BottomSheet open={open} title="신고하기" onClose={onClose}>
      <fieldset className="flex flex-col">
        <legend className="sr-only">신고 사유</legend>
        {REPORT_REASON_OPTIONS.map(({ value, label }) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 py-2.5">
            <input
              type="radio"
              name="report-reason"
              value={value}
              checked={reason === value}
              onChange={() => {
                setReason(value)
              }}
              className="size-5 shrink-0 accent-interactive-accent"
            />
            <span className="text-body-16md text-text-secondary">{label}</span>
          </label>
        ))}
      </fieldset>
      {reason === 'ETC' && (
        <Textarea
          aria-label="신고 상세 내용"
          placeholder="신고 사유를 자세히 적어주세요. (필수)"
          maxLength={REPORT_DETAIL_MAX_LENGTH}
          value={detail}
          onChange={(event) => {
            setDetail(event.target.value)
          }}
          className="h-[140px]"
        />
      )}
      <Button
        variant="activated"
        loading={loading}
        disabled={!canSubmitReport(reason, detail)}
        onClick={() => {
          if (reason === null) return
          onSubmit(buildReportRequest(reason, detail))
        }}
      >
        신고하기
      </Button>
    </BottomSheet>
  )
}
