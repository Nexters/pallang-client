/* 답글 펼치기 단계(revealStep)의 대수.
   0: 접힘, 1: 원댓글 응답이 준 미리보기(최대 5개)까지, 2+: 미리보기 + 더보기로 받은 페이지. */

/**
 * 단계마다 무엇을 보여줄지 딱 잘라 나눈다. 접었다 펴면 revealStep은 0으로 돌아가지만 답글 캐시는
 * 남아 있어, step 1에서 미리보기와 캐시를 합치면 5개가 아니라 10개가 한 번에 나타난다.
 */
export function resolveVisibleReplies<Reply>(input: {
  revealStep: number
  previewReplies: readonly Reply[]
  fetchedReplies: readonly Reply[]
}): Reply[] {
  const { revealStep, previewReplies, fetchedReplies } = input
  if (revealStep === 0) return []
  if (revealStep === 1) return [...previewReplies]
  return [...previewReplies, ...fetchedReplies]
}

/** 첫 페이지가 실패했을 때만 재시도로 취급한다 — 접힌 상태에서 남아 있는 캐시의 에러까지 끌어오지 않는다 */
export function hasReplyRevealError(input: { revealStep: number; isError: boolean }): boolean {
  return input.revealStep >= 2 && input.isError
}

/** 더보기 버튼을 세워둘지 — 단계마다 근거가 다르다 */
export function canRevealMoreReplies(input: {
  revealStep: number
  /** 서버가 알려준 답글 총 개수 */
  replyCount: number
  /** 미리보기 뒤에 답글이 더 있는지 — 서버 판정 */
  hasMoreReplies: boolean
  hasNextPage: boolean
  isPending: boolean
  hasError: boolean
}): boolean {
  const { revealStep, replyCount, hasMoreReplies, hasNextPage, isPending, hasError } = input
  if (revealStep === 0) return replyCount > 0
  // 미리보기 뒤에 답글이 더 있는지는 서버가 hasMoreReplies로 알려준다. replyCount와 미리보기
  // 개수로 추론하면 서버 값과 어긋날 때 버튼이 안 떠(남은 답글에 닿을 수 없다) 문제가 된다
  if (revealStep === 1) return hasMoreReplies
  // 아직 못 받았거나(로딩) 실패한 동안에도 버튼을 남긴다 — 사라지면 다시 시도할 길이 없다
  return hasNextPage || isPending || hasError
}

/** 더보기를 눌렀을 때 일어날 일 */
export type ReplyRevealAction = 'expand' | 'refetch' | 'fetchNext'

export function resolveReplyRevealAction(input: {
  revealStep: number
  hasError: boolean
}): ReplyRevealAction {
  // 2단계 전까지는 요청 없이 단계만 올린다(미리보기는 원댓글 응답에 이미 실려 있다)
  if (input.revealStep < 2) return 'expand'
  // 첫 페이지가 실패하면 되돌아갈 페이지가 없어 fetchNextPage로는 다시 받을 수 없다
  if (input.hasError) return 'refetch'
  return 'fetchNext'
}
