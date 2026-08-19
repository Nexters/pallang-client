/** 책 상세에서 고를 수 있는 기록 종류(Figma 225:12612). 순서가 곧 시안의 세그먼트 순서다. */
export const BOOK_RECORD_TABS = [
  { value: 'opinion', label: '의견' },
  { value: 'like', label: '좋아요' },
  { value: 'spoiler', label: '스포일러' },
] as const

export type BookRecordTab = (typeof BOOK_RECORD_TABS)[number]['value']

/** 탭 버튼과 그 아래 패널을 잇는 id — 양쪽이 같은 규칙으로 만든다. */
export function bookRecordTabIds(tab: BookRecordTab) {
  return { tabId: `book-record-tab-${tab}`, panelId: `book-record-panel-${tab}` }
}
