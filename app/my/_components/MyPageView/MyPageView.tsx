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
      className="flex flex-col overflow-y-auto bg-bg-default pb-10"
    >
      <header className="px-5 pt-4 pb-6">
        <h1 className="text-title-24bd text-text-primary">마이페이지</h1>
      </header>
      {user ? <LoggedInContent user={user} /> : <LoggedOutContent />}
    </TabScreenLayout>
  )
}

function LoggedInContent({ user }: { user: MyUser }) {
  return (
    <>
      <section className="flex items-center gap-4 px-5">
        {/* ponytail: 프로필 캐릭터 에셋 미확보 — 이미지 확보 시 교체 */}
        <div className="size-16 shrink-0 rounded-2xl bg-orange-600" aria-hidden />
        <div className="flex flex-col gap-1">
          <strong className="text-title-18sb text-text-primary">{user.nickname}</strong>
          <p className="text-body-14md text-text-tertiary">
            지금까지 {user.traceCount}개의 흔적을 남겼어요!
          </p>
        </div>
        <button type="button" aria-label="설정" className="ml-auto">
          <SettingIcon className="text-icon-muted" />
        </button>
      </section>

      <section className="mt-10">
        <h2 className="px-5 text-title-18sb text-text-primary">
          {user.characterName}님이 최근에 남긴 흔적
        </h2>
        <ul className="mt-4 flex gap-2 overflow-x-auto px-5">
          {/* ponytail: 표지 이미지 API 미구현 — 배경색 placeholder */}
          {user.recentTraces.map((trace) => (
            <li
              key={trace.id}
              title={trace.title}
              className="aspect-[2/3] w-18 shrink-0 border border-border-default bg-bg-book-card"
            />
          ))}
        </ul>
      </section>

      <SettingSection items={loggedInSettings} />

      <footer className="mt-auto flex items-center justify-center gap-2 px-5 py-6 text-caption-12rg text-text-tertiary">
        <button type="button">개인정보 처리 방침</button>
        <span aria-hidden>|</span>
        <button type="button">서비스 이용약관</button>
      </footer>
    </>
  )
}

function LoggedOutContent() {
  return (
    <>
      <section className="border-b border-border-default px-5 pb-8">
        <div className="flex items-center gap-4">
          <div className="size-16 shrink-0 rounded-2xl bg-bg-surface" aria-hidden />
          <div className="flex flex-col gap-1">
            <strong className="text-title-18sb text-text-primary">안녕하세요!</strong>
            <p className="text-body-14md text-text-tertiary">
              로그인하고 더 많은 흔적을 확인하세요
            </p>
          </div>
        </div>
        <Button className="mt-6 w-full">다음</Button>
      </section>

      <SettingSection items={loggedOutSettings} />
    </>
  )
}

function SettingSection({ items }: { items: string[] }) {
  return (
    <section className="mt-10 px-5">
      <h2 className="text-title-18sb text-text-primary">설정</h2>
      <ul className="mt-2">
        {items.map((label) => (
          <li key={label}>
            <button
              type="button"
              className="flex h-12 w-full items-center justify-between text-body-16md text-text-primary"
            >
              {label}
              <NextIcon className="text-icon-inactive" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
