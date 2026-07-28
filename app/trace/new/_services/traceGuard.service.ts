import type { TraceDraft } from '../_types/traceDraft.type'

const START = '/trace/new'

export function resolveGuardRedirect(pathname: string, draft: TraceDraft): string | null {
  // 이미 저장된 흔적이 있으면 완료 화면 밖으로 나갈 수 없다.
  // (done에서 뒤로 가면 decorate가 남아 있어 같은 흔적을 한 번 더 저장할 수 있었다.)
  if (draft.result !== null && pathname !== `${START}/done`) {
    return `${START}/done`
  }
  if (pathname === `${START}/done`) {
    return draft.result ? null : START
  }
  if (pathname === `${START}/photo`) {
    return draft.book ? null : START
  }
  if (pathname === `${START}/detail`) {
    return draft.book && draft.quotedText ? null : START
  }
  if (pathname === `${START}/decorate`) {
    if (!draft.book || !draft.quotedText) return START
    return draft.pageNumber === null ? `${START}/detail` : null
  }
  if (pathname === `${START}/opinion`) {
    if (!draft.book || !draft.quotedText) return START
    if (draft.pageNumber === null) return `${START}/detail`
    return draft.decorations.length > 0 ? null : `${START}/decorate`
  }
  return null
}
