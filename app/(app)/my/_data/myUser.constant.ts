import type { MyTrace, MyUser } from '../_types/myUser.type'

// Storybook 로그인 상태용 mock 흔적 목록 (표지 없는 케이스 포함)
export const mockRecentTraces: MyTrace[] = [
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
