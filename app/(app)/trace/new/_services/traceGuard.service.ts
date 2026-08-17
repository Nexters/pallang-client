import type { TraceDraft } from '../_types/traceDraft.type'

const START = '/trace/new'

/** 생각 작성 단계에서 받아야 할 값이 다 찼는지. 페이지·의견 둘 다 필수다. */
function hasWritten(draft: TraceDraft): boolean {
  return draft.pageNumber !== null && draft.content.trim().length > 0
}

export function resolveGuardRedirect(pathname: string, draft: TraceDraft): string | null {
  // 이미 저장된 흔적이 있으면 작성 단계로 되돌아갈 수 없다.
  // (done에서 뒤로 가면 book이 남아 있어 같은 흔적을 한 번 더 저장할 수 있었다.)
  // 다만 첫 화면은 새 흔적을 시작하는 자리라 막지 않는다 — 막으면 done에 갇힌다.
  if (draft.result !== null && pathname !== `${START}/done` && pathname !== START) {
    return `${START}/done`
  }
  if (pathname === `${START}/done`) {
    return draft.result ? null : START
  }
  // photo는 선행 조건이 없다 — 책은 마지막에 고르고 대목은 여기서 얻는다
  if (pathname === `${START}/write`) {
    return draft.quotedText ? null : START
  }
  if (pathname === `${START}/decorate`) {
    if (!draft.quotedText) return START
    return hasWritten(draft) ? null : `${START}/write`
  }
  if (pathname === `${START}/book`) {
    if (!draft.quotedText) return START
    if (!hasWritten(draft)) return `${START}/write`
    return draft.decorations.length > 0 ? null : `${START}/decorate`
  }
  return null
}
