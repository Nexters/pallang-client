'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'

import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import type { NotificationPreferenceResponse } from '@/app/_global/_queries/notification.queries'
import {
  notificationMutations,
  notificationQueries,
} from '@/app/_global/_queries/notification.queries'

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTING_SECTIONS,
  type NotificationSettingItem,
  type NotificationSettingKey,
  type NotificationSettingSection,
  PUSH_SETTING,
} from '../../_data/notificationSetting.constant'
import { NotificationSettingRow } from '../NotificationSettingRow/NotificationSettingRow'

type LastChange = { item: NotificationSettingItem; enabled: boolean }
type NotificationSettings = Record<NotificationSettingKey, boolean>

const NOTIFICATION_SETTING_KEYS: readonly NotificationSettingKey[] = [
  'push',
  'activityOpinion',
  'activityLike',
  'groupInvite',
  'groupOpinion',
  'groupLike',
  'groupSchedule',
]

function toNotificationSettings(preference?: NotificationPreferenceResponse): NotificationSettings {
  return {
    push: preference?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.push,
    activityOpinion:
      preference?.activityCommentEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.activityOpinion,
    activityLike: preference?.activityLikeEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.activityLike,
    groupInvite: preference?.groupInviteJoinEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.groupInvite,
    groupOpinion: preference?.groupCommentEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.groupOpinion,
    groupLike: preference?.groupLikeEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.groupLike,
    groupSchedule: preference?.groupScheduleEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.groupSchedule,
  }
}

function toUpdateRequest(settings: NotificationSettings) {
  return {
    pushEnabled: settings.push,
    activityCommentEnabled: settings.activityOpinion,
    activityLikeEnabled: settings.activityLike,
    groupInviteJoinEnabled: settings.groupInvite,
    groupCommentEnabled: settings.groupOpinion,
    groupLikeEnabled: settings.groupLike,
    groupScheduleEnabled: settings.groupSchedule,
  }
}

export function NotificationSettingsView() {
  const queryClient = useQueryClient()
  const settingsQuery = useQuery(notificationQueries.settings())
  const [lastChange, setLastChange] = useState<LastChange | null>(null)
  const [saveError, setSaveError] = useState(false)
  const settings = toNotificationSettings(settingsQuery.data?.data)

  const updateSettings = useMutation({
    ...notificationMutations.updateSettings(),
    onMutate: async (nextSettings) => {
      await queryClient.cancelQueries({ queryKey: notificationQueries.settings().queryKey })
      const previous = queryClient.getQueryData(notificationQueries.settings().queryKey)
      queryClient.setQueryData(notificationQueries.settings().queryKey, { data: nextSettings })
      return { previous }
    },
    onError: (_error, _nextSettings, context) => {
      queryClient.setQueryData(notificationQueries.settings().queryKey, context?.previous)
      setLastChange(null)
      setSaveError(true)
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueries.settings().queryKey }),
  })

  const changeSetting = (item: NotificationSettingItem, enabled: boolean, showNotice = true) => {
    const nextSettings =
      item.key === 'push'
        ? (Object.fromEntries(
            NOTIFICATION_SETTING_KEYS.map((key) => [key, enabled]),
          ) as NotificationSettings)
        : { ...settings, [item.key]: enabled }
    setSaveError(false)
    updateSettings.mutate(toUpdateRequest(nextSettings), {
      onSuccess: () => {
        if (showNotice) setLastChange({ item, enabled })
      },
    })
  }

  const undoLastChange = () => {
    if (!lastChange) return
    changeSetting(lastChange.item, !lastChange.enabled, false)
    setLastChange(null)
  }

  return (
    <>
      <ScreenLayout title="알림 설정" bodyClassName="pb-safe">
        {settingsQuery.isPending ? (
          <NotificationSettingsSkeleton />
        ) : settingsQuery.isError && !settingsQuery.data ? (
          <RetryMessage
            message="알림 설정을 불러오지 못했어요."
            onRetry={() => {
              void settingsQuery.refetch()
            }}
          />
        ) : (
          <NotificationSettingsContent
            settings={settings}
            disabled={updateSettings.isPending}
            onChange={changeSetting}
          />
        )}
      </ScreenLayout>

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다 */}
      <Snackbar
        tone="light"
        message={
          lastChange
            ? `${lastChange.item.label} 알림을 ${lastChange.enabled ? '활성화' : '비활성화'}했습니다.`
            : saveError
              ? '알림 설정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
              : ''
        }
        actionLabel={lastChange ? '취소' : undefined}
        onAction={lastChange ? undoLastChange : undefined}
        onClose={() => {
          setLastChange(null)
        }}
      />
    </>
  )
}

function NotificationSettingsContent({
  settings,
  disabled,
  onChange,
}: {
  settings: NotificationSettings
  disabled: boolean
  onChange: (item: NotificationSettingItem, enabled: boolean) => void
}) {
  return (
    <>
      <div className="px-4 py-6">
        <NotificationSettingRow
          item={PUSH_SETTING}
          checked={settings.push}
          disabled={disabled}
          onCheckedChange={(enabled) => {
            onChange(PUSH_SETTING, enabled)
          }}
          className="gap-1"
        />
      </div>

      <div className="px-4">
        <div className="flex flex-col gap-8 rounded-3xl bg-bg-surface/50 px-4 py-6">
          {NOTIFICATION_SETTING_SECTIONS.map((section) => (
            <SettingSection
              key={section.title}
              section={section}
              settings={settings}
              disabled={disabled || !settings.push}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function SettingSection({
  section,
  settings,
  disabled,
  onChange,
}: {
  section: NotificationSettingSection
  settings: Record<NotificationSettingKey, boolean>
  disabled: boolean
  onChange: (item: NotificationSettingItem, enabled: boolean) => void
}) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <h2 id={titleId} className="text-body-14rg font-medium text-text-tertiary">
        {section.title}
      </h2>
      <ul className="flex flex-col gap-4">
        {section.items.map((item) => (
          <li key={item.key}>
            <NotificationSettingRow
              item={item}
              checked={settings[item.key]}
              disabled={disabled}
              onCheckedChange={(enabled) => {
                onChange(item, enabled)
              }}
              sectionTitleId={titleId}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function NotificationSettingsSkeleton() {
  return (
    <div aria-busy="true">
      <div className="flex items-center gap-6 px-4 py-6">
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-7 w-12 rounded-full" />
      </div>
      <div className="px-4">
        <div className="flex flex-col gap-8 rounded-3xl bg-bg-surface/50 px-4 py-6">
          {Array.from({ length: 2 }, (_, sectionIndex) => (
            <div key={sectionIndex} className="flex flex-col gap-6">
              <Skeleton className="h-4 w-16" />
              <div className="flex flex-col gap-4">
                {Array.from({ length: sectionIndex === 0 ? 2 : 4 }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-6">
                    <div className="flex flex-1 flex-col gap-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-7 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
