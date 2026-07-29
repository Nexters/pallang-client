import type { MyUser } from '../_types/myUser.type'

// ponytail: 회원 API 미구현 — null로 바꾸면 비로그인 화면. API 연동 시 _global/_queries로 대체
export const mockMyUser: MyUser | null = {
  nickname: '밤샘낭독가',
  characterName: '밤톨',
  traceCount: 125,
  recentTraces: [
    { id: 1, title: '골목의 저녁' },
    { id: 2, title: '빗방울 속의 고독' },
    { id: 3, title: '풀꽃의 속삭임' },
    { id: 4, title: '시접' },
    { id: 5, title: '책갈피 속의 서점' },
  ],
}
