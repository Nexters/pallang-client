'use client'

import { useId, useState } from 'react'

import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

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

export function NotificationSettingsView() {
  // 설정 조회·저장 API가 아직 없다 — 화면 안에서만 바뀌고 다시 들어오면 기본값으로 돌아간다.
  // 푸시 토글도 기기 토큰 해제와 묶지 않는다: 켜짐/꺼짐을 다시 읽을 수 없어 화면과 실제가 어긋난다.
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS)
  const [lastChange, setLastChange] = useState<LastChange | null>(null)

  const setSetting = (key: NotificationSettingKey, enabled: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: enabled }))
  }

  const changeSetting = (item: NotificationSettingItem, enabled: boolean) => {
    setSetting(item.key, enabled)
    setLastChange({ item, enabled })
  }

  return (
    <>
      <ScreenLayout title="알림 설정" bodyClassName="pb-safe">
        <div className="px-4 py-6">
          <NotificationSettingRow
            item={PUSH_SETTING}
            checked={settings.push}
            onCheckedChange={(enabled) => {
              changeSetting(PUSH_SETTING, enabled)
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
                onChange={changeSetting}
              />
            ))}
          </div>
        </div>
      </ScreenLayout>

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다 */}
      <Snackbar
        tone="light"
        message={
          lastChange
            ? `${lastChange.item.label} 알림을 ${lastChange.enabled ? '활성화' : '비활성화'}했습니다.`
            : ''
        }
        actionLabel="취소"
        onAction={() => {
          if (lastChange) setSetting(lastChange.item.key, !lastChange.enabled)
          setLastChange(null)
        }}
        onClose={() => {
          setLastChange(null)
        }}
      />
    </>
  )
}

function SettingSection({
  section,
  settings,
  onChange,
}: {
  section: NotificationSettingSection
  settings: Record<NotificationSettingKey, boolean>
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
