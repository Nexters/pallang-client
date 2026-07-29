import type { MyUser } from '../_types/myUser.type'

// ponytail: 흔적 목록 API 미연동(#57 제외 범위) — placeholder 표지용 mock
export const mockRecentTraces = [
  { id: 1, title: '골목의 저녁' },
  { id: 2, title: '빗방울 속의 고독' },
  { id: 3, title: '풀꽃의 속삭임' },
  { id: 4, title: '시접' },
  { id: 5, title: '책갈피 속의 서점' },
]

// Storybook 로그인 상태용 mock 프로필
export const mockMyUser: MyUser = {
  nickname: '밤샘낭독가',
  traceCount: 125,
}
