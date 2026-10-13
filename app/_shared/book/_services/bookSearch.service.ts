type ExternalBookSearchState = {
  internalResultCount: number
  isInternalError: boolean
  isInternalPending: boolean
  isSearching: boolean
  isTypingAhead: boolean
}

export function shouldSearchExternalBooks({
  internalResultCount,
  isInternalError,
  isInternalPending,
  isSearching,
  isTypingAhead,
}: ExternalBookSearchState): boolean {
  return (
    isSearching &&
    !isTypingAhead &&
    !isInternalPending &&
    !isInternalError &&
    internalResultCount === 0
  )
}
