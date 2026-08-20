'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

import { groupQueries } from '@/app/_global/_queries/group.queries'

import { MEETING_AVATAR_MAX } from '../../_data/meeting.constant'

type MeetingMemberAvatarsProps = {
  groupId: number
  memberCount: number
}

/** 시안 아바타 20px 원 · 흰 테두리 1px · 8px 겹침. 뒤(오른쪽)가 위로 오게 DOM 순서대로 그린다 — `+N`이 가려지면 안 된다. */
const AVATAR_CLASS =
  '-mr-2 size-5 shrink-0 overflow-hidden rounded-full border border-bg-default last:mr-0'

/**
 * 카드의 멤버 아바타 묶음. 요약 응답에는 인원수만 있어 멤버 첫 페이지(5명)를 카드마다 한 번 받는다.
 * 받기 전에는 같은 자리에 주황 원만 깔아 도착했을 때 자리가 튀지 않게 한다.
 */
export function MeetingMemberAvatars({ groupId, memberCount }: MeetingMemberAvatarsProps) {
  const shown = Math.min(memberCount, MEETING_AVATAR_MAX)
  const overflow = memberCount - shown
  const members = useQuery({
    ...groupQueries.members(groupId, MEETING_AVATAR_MAX),
    enabled: shown > 0,
  })
  const list = members.data?.data?.members.slice(0, shown) ?? []

  return (
    <div role="group" className="flex items-center" aria-label={`멤버 ${String(memberCount)}명`}>
      {Array.from({ length: shown }, (_, index) => {
        const member = list[index]
        return (
          <span
            key={member?.userId ?? `placeholder-${String(index)}`}
            className={`${AVATAR_CLASS} bg-interactive-accent`}
          >
            {member &&
              (member.profileImageUrl ? (
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
                  src="/images/profile-character-orange.png"
                  alt={`멤버 ${member.nickname}`}
                  width={20}
                  height={20}
                  className="size-full object-cover"
                />
              ))}
          </span>
        )
      })}
      {overflow > 0 && (
        <span
          className={`${AVATAR_CLASS} flex items-center justify-center bg-bg-surface text-caption-12rg text-text-primary`}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
