'use client'

import Image from 'next/image'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import SettingIcon from '@/app/_global/_components/Icon/assets/setting.svg'
import type { GroupSummary } from '@/app/_global/_queries/group.queries'

type MeetingMoreSheetProps = {
  /** 열린 대상. null이면 닫힘 */
  group: GroupSummary | null
  isSharing: boolean
  onClose: () => void
  onShareInvite: (group: GroupSummary) => void
  onEditSettings: (group: GroupSummary) => void
}

/** 시안 3321:30402 — 타일 2개(각진 모서리, surface, p24, 아이콘 56 r16, 라벨 14sb) */
const TILE_CLASS =
  'press flex flex-1 flex-col items-center gap-4 bg-bg-surface p-6 text-body-14sb text-text-secondary disabled:opacity-40'

export function MeetingMoreSheet({
  group,
  isSharing,
  onClose,
  onShareInvite,
  onEditSettings,
}: MeetingMoreSheetProps) {
  return (
    <BottomSheet
      open={group !== null}
      title="더보기"
      onClose={onClose}
      // 기본 본문이 flex-col이다. flex만 쓰면 방향은 그대로 남아 타일이 세로로 쌓인다 —
      // 같은 병합 그룹인 flex-row로 밀어내야 시안(3321:30404)의 좌우 배치가 된다.
      contentClassName="flex-row gap-2 p-4"
    >
      <button
        type="button"
        className={TILE_CLASS}
        disabled={isSharing}
        onClick={() => {
          if (group) onShareInvite(group)
        }}
      >
        {/* 시안은 카카오톡 앱 아이콘(PNG) — 공유는 OS 시트로 나가지만 '카카오로 보낸다'는 기대를 아이콘이 전한다 */}
        <Image
          src="/images/kakaotalk-app-icon.png"
          alt=""
          width={56}
          height={56}
          className="rounded-2xl"
        />
        초대 링크 보내기
      </button>
      <button
        type="button"
        className={TILE_CLASS}
        onClick={() => {
          if (group) onEditSettings(group)
        }}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-bg-surface">
          <SettingIcon className="size-8 text-icon-primary" />
        </span>
        방 설정 변경하기
      </button>
    </BottomSheet>
  )
}
