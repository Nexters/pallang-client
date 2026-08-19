// ponytail: 서버가 ISO 문자열을 주므로 필요한 자리만 잘라 쓴다 — 시안(225:12688)의 `26.08.10`은 두 자리 연도다.
/** 관리 목록·책 상세 카드 머리줄의 작성일 표기. */
export function formatRecordedDate(createdAt: string): string {
  return createdAt.slice(2, 10).replaceAll('-', '.')
}
