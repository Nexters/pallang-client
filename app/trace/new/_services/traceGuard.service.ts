import type { TraceDraft } from '../_types/traceDraft.type'

const START = '/trace/new'

export function resolveGuardRedirect(pathname: string, draft: TraceDraft): string | null {
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
