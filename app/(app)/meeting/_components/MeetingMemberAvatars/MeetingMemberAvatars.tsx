import Image from 'next/image'

import type { GroupSummary } from '@/app/_global/_queries/group.queries'

type MeetingMemberAvatarsProps = {
  group: GroupSummary
}

/** 시안 아바타 20px 원 · 흰 테두리 1px · 8px 겹침. 뒤(오른쪽)가 위로 오게 DOM 순서대로 그린다 — `+N`이 가려지면 안 된다. */
const AVATAR_CLASS =
  '-mr-2 size-5 shrink-0 overflow-hidden rounded-full border border-bg-default last:mr-0'

/** 모임 목록 응답의 멤버 미리보기와 남은 인원을 표시한다. */
export function MeetingMemberAvatars({ group }: MeetingMemberAvatarsProps) {
  const { memberCount, memberPreviews, extraMemberCount } = group

  return (
    <div role="group" className="flex items-center" aria-label={`멤버 ${String(memberCount)}명`}>
      {memberPreviews.map((member) => (
        <span key={member.userId} className={`${AVATAR_CLASS} bg-interactive-accent`}>
          {member.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 프로필 이미지 도메인이 유동적(카카오 CDN 등)
            <img
              src={member.profileImageUrl}
              alt={`멤버 ${member.nickname}`}
              width={20}
              height={20}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <Image
              src="/images/profile-character-orange.webp"
              alt={`멤버 ${member.nickname}`}
              width={20}
              height={20}
              className="size-full object-cover"
            />
          )}
        </span>
      ))}
      {extraMemberCount > 0 && (
        <span
          className={`${AVATAR_CLASS} flex items-center justify-center bg-bg-surface text-caption-12rg text-text-primary`}
        >
          +{extraMemberCount}
        </span>
      )}
    </div>
  )
}
