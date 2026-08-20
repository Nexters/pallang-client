import { notFound } from 'next/navigation'

import { MeetingInviteView } from '../MeetingInviteView/MeetingInviteView'

type MeetingInviteBoundaryProps = { params: Promise<{ code: string }> }

/** 초대 코드로 쓸 수 있는 글자만 통과시킨다 — 서버 스펙은 URL-safe 문자열이다 */
const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]+$/

/** `%`가 섞인 잘린 링크는 decodeURIComponent가 던진다 — 화면을 깨뜨리지 말고 not-found로 보낸다 */
function decodeInviteCode(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return ''
  }
}

/**
 * 서버 컴포넌트 — params는 Suspense 안쪽에서만 푼다(PPR 셸 유지).
 * 형식이 아닌 코드는 서버에 물어볼 것도 없이 not-found — 링크가 잘려 들어온 경우다.
 */
export async function MeetingInviteBoundary({ params }: MeetingInviteBoundaryProps) {
  const { code } = await params
  const inviteCode = decodeInviteCode(code)
  if (!INVITE_CODE_PATTERN.test(inviteCode)) notFound()
  // 코드가 바뀌면 화면을 갈아 끼운다 — 같은 인스턴스를 재사용하면 앞 초대의 스낵바 문구가 남는다
  return <MeetingInviteView key={inviteCode} inviteCode={inviteCode} />
}
