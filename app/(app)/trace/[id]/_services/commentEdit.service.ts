/**
 * 인라인 수정에서 서버로 보낼 내용을 정한다.
 *
 * 비었거나(공백만 남은 입력) 원본과 같으면 보낼 것이 없어 null이다 — 호출부는 요청 없이 보기 모드로
 * 돌아간다. 그냥 보내면 바뀐 것 없는 PATCH가 나가고, 뒤따르는 무효화가 목록을 통째로 다시 불러온다.
 * 공백만 남긴 입력을 "지우기"로 받아 빈 댓글을 만들지 않는 것도 이 판정이 맡는다.
 */
export function resolveCommentEdit(draft: string, original: string): string | null {
  const trimmed = draft.trim()
  if (!trimmed || trimmed === original) return null
  return trimmed
}
