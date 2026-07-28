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

// pageCount가 null인 책에서 자릿수를 막지 않으면 1e23 같은 값이 Number.isInteger를
// 통과하고 JSON에 '1e+23'으로 직렬화되어 서버가 400을 반환한다.
const MAX_PAGE_DIGITS = 5

export function TraceDetailForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  // 뒤로 가기로 이 화면에 다시 오면 leaf page가 리마운트된다.
  // draft에서 시드하지 않으면 입력이 비고, 그대로 '다음'을 누를 때 스포일러 여부가
  // 사용자 의사와 무관하게 false로 덮인다.
  const [page, setPage] = useState(draft.pageNumber === null ? '' : String(draft.pageNumber))
  const [spoiler, setSpoiler] = useState<'no' | 'yes'>(draft.isSpoiler ? 'yes' : 'no')

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
              maxLength={MAX_PAGE_DIGITS}
              value={page}
              placeholder="000"
              onChange={(event) => {
                setPage(event.target.value.replace(/[^0-9]/g, '').slice(0, MAX_PAGE_DIGITS))
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
            onChange={(value) => {
              setSpoiler(value === 'yes' ? 'yes' : 'no')
            }}
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
