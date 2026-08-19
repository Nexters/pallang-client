import type { TraceDraft } from '../_types/traceDraft.type'

/**
 * 유사 대목(중복)을 묻는 단위. 같은 키에는 두 번 묻지 않는다.
 *
 * 페이지를 키에 넣지 않는 이유: 이 물음은 대목을 얻은 직후(①에 들어서는 순간)에 나오고,
 * 그때는 아직 페이지를 받기 전이다. 페이지까지 키에 넣으면 사용자가 페이지를 채우는 순간
 * 키가 달라져 방금 답한 것을 또 묻게 된다.
 *
 * 모임은 반대로 키에 넣는다. 서버가 모임 전용 대목과 전역 대목을 다른 목록으로 보므로
 * 같은 책·같은 문장이라도 모임이 다르면 답도 다르다 — 한쪽에서 물은 답을 다른 쪽에
 * 재활용하면 있지도 않은 대목에 합치거나, 있는데도 묻지 않고 지나친다.
 * 전역은 `global`로 적어 모임 번호와 자리를 나눠 쓴다.
 */
export function similarCheckKey(draft: TraceDraft): null | string {
  const bookId = draft.book?.bookId
  if (bookId === undefined) return null
  if (draft.quotedText.trim().length === 0) return null
  const scope = draft.groupId === null ? 'global' : String(draft.groupId)
  return `${String(bookId)}:${scope}:${draft.quotedText}`
}

/**
 * 지금 이 초안에 유사 대목을 물어야 하는지.
 *
 * - 책과 대목이 다 있어야 물을 수 있다(서버가 `bookId`를 요구한다).
 * - 흔적 보기에서 대목을 물고 들어온 초안(`source === 'passage'`)은 합칠 대목이 이미 정해져
 *   있어 물을 것이 없다.
 * - 합칠 대목이 이미 잡혀 있어도 마찬가지다.
 * - 같은 조합을 이미 물었으면 답이 무엇이었든 다시 묻지 않는다.
 */
export function shouldCheckSimilar(draft: TraceDraft): boolean {
  const key = similarCheckKey(draft)
  if (key === null) return false
  if (draft.source === 'passage') return false
  if (draft.passageId !== null) return false
  return draft.similarCheckedKey !== key
}
