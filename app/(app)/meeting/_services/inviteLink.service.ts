export type InviteShareOutcome = 'shared' | 'cancelled' | 'copied' | 'failed'

/**
 * 초대 랜딩 경로. 이번에는 라우트를 만들지 않지만(시안 없음) 링크 형식은 여기서 고정한다 —
 * 후속에서 `/meeting/invite/[code]` 페이지만 더하면 이미 뿌려진 링크가 그대로 열린다.
 */
export function buildInviteUrl(inviteCode: string, origin: string): string {
  return `${origin}/meeting/invite/${encodeURIComponent(inviteCode)}`
}

type ShareData = { title: string; text: string; url: string }

/**
 * 카카오 공유 SDK가 없어 OS 공유 시트(navigator.share)로 보낸다 — 거기서 카카오톡을 고를 수 있다.
 * 시트가 없거나(데스크톱·구형 웹뷰) 열다 실패하면 링크를 클립보드에 복사한다. 사용자가 시트를 닫은 것은
 * 실패가 아니라 '그만둠'이라 따로 알리지 않게 cancelled로 구분한다.
 */
export async function shareInviteLink(data: ShareData): Promise<InviteShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(data.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
