import Image from 'next/image'

import { Button } from '@/app/_global/_components/Button/Button'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import SettingIcon from '@/app/_global/_components/Icon/assets/setting.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'

import type { MyUser } from '../../_types/myUser.type'

const loggedInSettings = [
  '공지사항',
  '배경 변경',
  '스포일러 관리',
  '내가 남긴 흔적',
  '좋아요 누른 흔적',
  '알림 설정',
]
const loggedOutSettings = ['공지사항', '개인정보 처리 방침', '서비스 이용약관']

export function MyPageView({ user }: { user: MyUser | null }) {
  return (
    <TabScreenLayout
      aria-label="마이페이지"
      activeTab="my"
      className="flex flex-col overflow-y-auto bg-bg-default"
    >
      <header className="flex h-11 shrink-0 items-center px-4">
        <h1 className="text-title-18sb font-bold text-text-secondary">마이페이지</h1>
      </header>
      {user ? <LoggedInContent user={user} /> : <LoggedOutContent />}
    </TabScreenLayout>
  )
}

function LoggedInContent({ user }: { user: MyUser }) {
  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <section className="flex items-center gap-3 px-4">
        <Image
          src="/images/profile-character-orange.png"
          alt=""
          width={72}
          height={72}
          className="shrink-0 rounded-3xl"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <strong className="text-title-18sb font-bold text-text-primary">{user.nickname}</strong>
          <p className="text-body-14md text-text-tertiary">
            지금까지 {user.traceCount}개의 흔적을 남겼어요!
          </p>
        </div>
        <button
          type="button"
          aria-label="설정"
          className="shrink-0 rounded-full border border-border-default p-1.5"
        >
          <SettingIcon className="text-icon-muted" />
        </button>
      </section>

      <section className="flex flex-col gap-6 px-4">
        <h2 className="text-body-16bd text-text-primary">
          {user.characterName}님이 최근에 남긴 흔적
        </h2>
        <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {/* ponytail: 표지 이미지 API 미구현 — 배경색 placeholder */}
          {user.recentTraces.map((trace) => (
            <li
              key={trace.id}
              title={trace.title}
              className="h-27 w-18 shrink-0 rounded-xs bg-bg-book-card"
            />
          ))}
        </ul>
      </section>

      <SettingSection items={loggedInSettings} showLogout />

      <footer className="mt-auto flex items-center justify-center gap-2.5 p-2.5">
        <button
          type="button"
          className="text-body-14md font-semibold tracking-normal text-text-tertiary"
        >
          개인정보 처리 방침
        </button>
        <span aria-hidden className="h-3 w-px bg-border-default" />
        <button
          type="button"
          className="text-body-14md font-semibold tracking-normal text-text-tertiary"
        >
          서비스 이용약관
        </button>
      </footer>
    </div>
  )
}

function LoggedOutContent() {
  return (
    <div className="flex flex-col gap-12 py-4">
      <div className="flex flex-col gap-5">
        <section className="flex items-center gap-3 px-4">
          <Image
            src="/images/profile-character-gray.png"
            alt=""
            width={72}
            height={72}
            className="shrink-0 rounded-3xl"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <strong className="text-title-18sb font-bold text-text-primary">안녕하세요!</strong>
            <p className="text-body-14md text-text-tertiary">
              로그인하고 더 많은 흔적을 확인하세요
            </p>
          </div>
        </section>
        <div className="px-4">
          <Button className="w-full">다음</Button>
        </div>
      </div>

      <SettingSection items={loggedOutSettings} />
    </div>
  )
}

function SettingSection({ items, showLogout = false }: { items: string[]; showLogout?: boolean }) {
  return (
    <section className="flex flex-col gap-6 px-4">
      <h2 className="text-body-16bd text-text-primary">설정</h2>
      <ul className="flex w-full flex-col gap-4">
        {items.map((label) => (
          <li key={label}>
            <button type="button" className="flex w-full items-center gap-2">
              <span className="flex-1 text-left text-body-14md text-text-secondary">{label}</span>
              <NextIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-icon-primary opacity-30"
              />
            </button>
          </li>
        ))}
        {showLogout && (
          <li>
            {/* ponytail: 로그아웃 API 미연동 — 클릭 핸들러는 API 연동 시 추가 */}
            <button type="button" className="text-body-14md text-text-secondary">
              로그아웃
            </button>
          </li>
        )}
      </ul>
    </section>
  )
}
