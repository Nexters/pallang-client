'use client'

import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import { useTraceSubmit } from '../../_hooks/useTraceSubmit'
import { isSeededPassage } from '../../_services/seededPassage.service'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepIndicator } from '../TraceStepIndicator/TraceStepIndicator'

const SPOILER_OPTIONS = [
  { value: 'no', label: '없어요' },
  { value: 'yes', label: '있어요' },
] as const

// pageCount가 null인 책에서 자릿수를 막지 않으면 1e23 같은 값이 Number.isInteger를
// 통과하고 JSON에 '1e+23'으로 직렬화되어 서버가 400을 반환한다.
const MAX_PAGE_DIGITS = 5

const PAGE_INPUT_ID = 'trace-write-page'

export function TraceWriteForm() {
  const { draft, dispatch } = useTraceDraft()
  const { goBack, goTo } = useTraceNav()
  const { closeMessage, isSaving, message, save } = useTraceSubmit()
  // 흔적 보기의 '의견 남기기'로 들어온 경로. 대목·페이지·꾸밈이 이미 정해져 받을 것이
  // 의견 하나뿐이라 이 화면이 마지막이다 — ②·③을 건너뛰고 여기서 바로 저장한다.
  const isSeeded = isSeededPassage(draft)
  // 뒤로 가기로 이 화면에 다시 오면 leaf page가 리마운트된다.
  // draft에서 시드하지 않으면 입력이 비고, 그대로 '다음'을 누를 때 스포일러 여부가
  // 사용자 의사와 무관하게 false로 덮인다.
  const [page, setPage] = useState(draft.pageNumber === null ? '' : String(draft.pageNumber))
  const [spoiler, setSpoiler] = useState<'no' | 'yes'>(draft.isSpoiler ? 'yes' : 'no')

  const pageNumber = Number(page)
  // 책은 마지막 단계에서 고른다 — 아직 pageCount를 몰라 상한은 검증하지 않는다.
  const isValidPage = page.length > 0 && Number.isInteger(pageNumber) && pageNumber > 0
  const hasContent = draft.content.trim().length > 0

  const handleNext = () => {
    dispatch({ type: 'setPageDetail', pageNumber, isSpoiler: spoiler === 'yes' })
    goTo('decorate')
  }

  // min-h-0: flex 아이템의 기본 min-height는 auto라, 이게 없으면 이 화면이 셸(h-dvh)보다
  // 커져도 줄지 않는다 — 안쪽 스크롤러가 자랄 공간을 못 받아 스크롤이 아예 생기지 않는다.
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-dark">
      {/* 흰 상단이 노치 뒤까지 채워지도록 셸 패딩을 되돌리고(-mt) 안에서 다시 더한다 */}
      <div className="-mt-(--safe-top) bg-bg-default pt-(--safe-top)">
        <TraceStepIndicator current={1} />
      </div>
      {/* 셸(app/(app)/layout.tsx의 main)은 h-dvh·overflow-hidden이라 넘치는 만큼을 그냥 자른다.
          노트(320px)와 의견 입력(206px)이 둘 다 고정 높이여서 작은 화면에서는 아래 버튼 줄이
          화면 밖으로 밀려 아예 누를 수 없었다 — 가운데만 스크롤시키고 단계 표시와 버튼 줄은
          바깥에 두어 고정한다(ScreenLayout·BookInternalView와 같은 처리). */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 노트가 밝음/어둠 경계를 가로지른다 — 시안(2295:5842): 노트 하단 199px가 어두운 배경 */}
        <div className="relative bg-bg-default px-8">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
          <div className="relative">
            {/* 물고 들어온 대목은 이미 꾸며져 있다 — 그 모습 그대로 보여준다 */}
            <TraceNote
              quotedText={draft.quotedText}
              decorations={isSeeded ? draft.decorations : []}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 px-4 pt-8 pb-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={PAGE_INPUT_ID} className="text-body-14md text-text-inverse">
              페이지
            </label>
            <span className="flex items-center gap-2 rounded-lg border border-white-a20 px-4 py-3">
              <input
                id={PAGE_INPUT_ID}
                inputMode="numeric"
                maxLength={MAX_PAGE_DIGITS}
                value={page}
                placeholder="000"
                // 물고 들어온 대목의 페이지는 그 대목의 것이라 여기서 바꿀 수 없다.
                // disabled가 아니라 readOnly인 이유: 값은 읽히고 초점도 갈 수 있어야 한다.
                readOnly={isSeeded}
                onChange={(event) => {
                  setPage(event.target.value.replace(/[^0-9]/g, '').slice(0, MAX_PAGE_DIGITS))
                }}
                className="min-w-0 flex-1 bg-transparent text-body-16rg text-text-inverse outline-none placeholder:opacity-40 read-only:opacity-60"
              />
              <span className="text-body-16rg text-text-inverse opacity-60">P</span>
            </span>
          </div>

          {/* 스포일러 여부도 물고 들어온 대목의 것이다 — 고를 것이 없어 아예 묻지 않는다 */}
          {!isSeeded && (
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
          )}

          <Textarea
            variant="dark"
            maxLength={300}
            value={draft.content}
            placeholder="문장에 대한 생각이나 의견을 작성해보세요."
            // 이 경로는 흔적 보기의 '의견 남기기'가 곧장 여기로 보낸 것이라 받을 것이 의견뿐이다
            // — 웹뷰에서 키보드가 따라 올라온다. 평소 경로에서는 위의 페이지부터 채워야 해서 잡지 않는다.
            autoFocus={isSeeded}
            onChange={(event) => {
              dispatch({ type: 'setContent', content: event.target.value })
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-safe">
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            goBack()
          }}
        >
          뒤로
        </Button>
        {/* 물고 들어온 대목이면 여기가 마지막 화면이라 '다음'이 아니라 저장이다 */}
        <Button
          variant="activated"
          className="flex-1"
          disabled={!hasContent || (!isSeeded && !isValidPage)}
          loading={isSaving}
          onClick={isSeeded ? save : handleNext}
        >
          {isSeeded ? '기록 완료' : '다음'}
        </Button>
      </div>

      <Snackbar message={message} onClose={closeMessage} />
    </div>
  )
}
