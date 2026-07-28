'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

const SPOILER_OPTIONS = [
  { value: 'no', label: '없어요' },
  { value: 'yes', label: '있어요' },
] as const

export function TraceDetailForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [page, setPage] = useState('')
  const [spoiler, setSpoiler] = useState('no')

  const pageNumber = Number(page)
  const maxPage = draft.book?.pageCount ?? null
  const isValidPage =
    page.length > 0 &&
    Number.isInteger(pageNumber) &&
    pageNumber > 0 &&
    (maxPage === null || pageNumber <= maxPage)

  return (
    <div className="flex flex-1 flex-col bg-bg-dark">
      <div className="bg-bg-alternative pb-6">
        <TraceStepHeader step={1} title={'문장이 있는 페이지와\n스포일러 유무를 선택해주세요'} />
      </div>
      <div className="-mt-4 px-8">
        <TraceNote quotedText={draft.quotedText} decorations={[]} />
      </div>

      <div className="flex flex-col gap-6 px-4 pt-8">
        <label className="flex flex-col gap-2">
          <span className="text-body-14md text-text-inverse">페이지</span>
          <span className="flex items-center gap-2 rounded-lg border border-white-a20 px-4 py-3">
            <input
              inputMode="numeric"
              value={page}
              placeholder="000"
              onChange={(event) => {
                setPage(event.target.value.replace(/[^0-9]/g, ''))
              }}
              className="min-w-0 flex-1 bg-transparent text-body-16rg text-text-inverse outline-none placeholder:opacity-40"
            />
            <span className="text-body-16rg text-text-inverse opacity-60">P</span>
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-body-14md text-text-inverse">스포일러</span>
          <SegmentedControl
            label="스포일러"
            options={SPOILER_OPTIONS}
            value={spoiler}
            onChange={setSpoiler}
          />
        </div>
      </div>

      <div className="mt-auto flex gap-2 px-4 pb-4">
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
          disabled={!isValidPage}
          onClick={() => {
            dispatch({ type: 'setPageDetail', pageNumber, isSpoiler: spoiler === 'yes' })
            router.push('/trace/new/decorate')
          }}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
