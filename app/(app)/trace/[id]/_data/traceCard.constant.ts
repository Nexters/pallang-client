/* 흔적 카드·목록이 쓰는 문구와 수치.
   Tailwind 클래스 문자열은 여기로 옮기지 않는다 — 컨벤션 spec(motionConvention·safeAreaConvention)이
   app/**\/*.tsx만 훑어서, .ts로 빼는 순간 duration·easing·safe-area 검사 밖으로 빠져나간다. */

/** 흔적/대목 조회 실패 안내 — 두 줄로 끊어 보여준다 */
export const TRACE_LIST_ERROR_MESSAGE = '앗! 흔적들이 도착하지 않았어요!'
export const TRACE_LIST_ERROR_GUIDE = '다시 시도해주세요.'
export const TRACE_LIST_ERROR_RETRY_LABEL = '다시 시도하기'

/** 남기기 버튼의 두 갈래 — 라벨이 곧 목적지다 */
export const TRACE_FAB_OPINION_LABEL = '의견 남기기'
export const TRACE_FAB_RECORD_LABEL = '기록 남기기'
