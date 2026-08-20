/** 서버 제약과 시안 헬퍼 문구("최대 15자까지 가능해요." / "최대 10명까지 가능해요.")가 같은 값을 본다 */
export const MEETING_NAME_MAX_LENGTH = 15
export const MEETING_CAPACITY_MIN = 2
export const MEETING_CAPACITY_MAX = 10
/** 시안 기본 선택값 "2명" */
export const MEETING_CAPACITY_DEFAULT = 2
/** 카드 아바타는 다섯까지, 넘치면 `+N`(시안 3321:28912) */
export const MEETING_AVATAR_MAX = 5
export const MEETING_NOTICE_MESSAGE = {
  created: '모임이 성공적으로 만들어졌어요!',
  updated: '모임 수정이 완료되었어요.',
  joined: '모임에 참여했어요!',
} as const

/**
 * 초대 코드로 가입할 때 서버가 돌려주는 실패 사유(스웨거 `POST /api/groups/invitations/{code}/join`).
 * 이미 가입은 실패가 아니라 "이미 도착"이라 문구 없이 모임 탭으로 보내고, 정원 초과만 안내한다.
 */
export const GROUP_JOIN_ALREADY_CODE = 'GROUP_409_2'
export const GROUP_JOIN_FULL_CODE = 'GROUP_409_3'
