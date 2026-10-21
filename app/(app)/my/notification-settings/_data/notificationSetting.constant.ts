export type NotificationSettingKey =
  | 'push'
  | 'activityOpinion'
  | 'activityLike'
  | 'groupInvite'
  | 'groupOpinion'
  | 'groupLike'
  | 'groupSchedule'

export type NotificationSettingItem = {
  key: NotificationSettingKey
  label: string
  description: string
}

export type NotificationSettingSection = {
  title: string
  items: readonly NotificationSettingItem[]
}

export const PUSH_SETTING: NotificationSettingItem = {
  key: 'push',
  label: '푸시 알림',
  description: '팔랑의 새로운 소식을 확인해보세요!',
}

export const NOTIFICATION_SETTING_SECTIONS: readonly NotificationSettingSection[] = [
  {
    title: '활동 알림',
    items: [
      {
        key: 'activityOpinion',
        label: '의견 및 댓글',
        description: '내가 의견을 남긴 곳에 의견 · 댓글이 달릴 때',
      },
      { key: 'activityLike', label: '좋아요', description: '내 의견에 남겨진 좋아요' },
    ],
  },
  {
    title: '모임 알림',
    items: [
      { key: 'groupInvite', label: '초대 및 가입', description: '모임 초대 및 가입 승인' },
      {
        key: 'groupOpinion',
        label: '의견 및 댓글',
        description: '내가 의견을 남긴 곳에 의견 · 댓글이 달릴 때',
      },
      { key: 'groupLike', label: '좋아요', description: '내 의견에 남겨진 좋아요' },
      {
        key: 'groupSchedule',
        label: '일정 변경',
        description: '모임 일정이 변경되었을 때, 일정이 끝나갈 때',
      },
    ],
  },
]

// API가 설정을 만들기 전이거나 일부 필드가 비어 있으면 백엔드 기본값과 같이 모두 켠다.
export const DEFAULT_NOTIFICATION_SETTINGS: Record<NotificationSettingKey, boolean> = {
  push: true,
  activityOpinion: true,
  activityLike: true,
  groupInvite: true,
  groupOpinion: true,
  groupLike: true,
  groupSchedule: true,
}
