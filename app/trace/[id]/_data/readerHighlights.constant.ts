import type { OpinionSortType } from '@/app/_global/_queries/opinion.queries'

// ponytail: 책 제목 API가 없어 하드코딩 유지 — 백엔드 협의 후 교체 (#44 선행 확인 사항)
export const bookTitle = '모순'

// 흔적 목록의 초기 정렬. 서버 프리페치와 클라이언트 초기 상태가 같은 queryKey를 써야 해서 상수로 묶는다.
export const DEFAULT_OPINION_SORT_TYPE: OpinionSortType = 'LATEST'
