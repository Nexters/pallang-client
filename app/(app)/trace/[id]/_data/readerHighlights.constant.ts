import type { OpinionSortType } from '@/app/_global/_queries/opinion.queries'

// 흔적 목록의 초기 정렬. 서버 프리페치와 클라이언트 초기 상태가 같은 queryKey를 써야 해서 상수로 묶는다.
export const DEFAULT_OPINION_SORT_TYPE: OpinionSortType = 'LATEST'

// 정렬 드롭다운에 세우는 선택지. 라벨은 시안(218:8736)을 따른다 —
// 서버 파라미터 이름은 LIKES지만 화면에서는 '인기순'으로 읽힌다.
// 딥링크가 지목한 흔적을 목록 끝까지 못 찾았을 때. 지워졌거나 차단한 사람의 글이면 응답에 오지 않는다
export const TRACE_NOT_FOUND_MESSAGE = '그 흔적을 찾지 못했어요. 지워졌을 수 있어요.'

export const OPINION_SORT_OPTIONS: readonly { label: string; value: OpinionSortType }[] = [
  { label: '최신순', value: 'LATEST' },
  { label: '인기순', value: 'LIKES' },
]
