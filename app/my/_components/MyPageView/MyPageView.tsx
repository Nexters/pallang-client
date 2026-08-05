import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/app/_global/_components/Button/Button'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import SettingIcon from '@/app/_global/_components/Icon/assets/setting.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { POLICY_META_BY_SLUG } from '@/app/_shared/terms/_data/policy.constant'

import type { MyTrace, MyUser } from '../../_types/myUser.type'
import { MyPageSkeleton } from '../MyPageSkeleton/MyPageSkeleton'

const loggedInSettings = [
  '공지사항',
  '배경 변경',
  '스포일러 관리',
  '내가 남긴 흔적',
  '좋아요 누른 흔적',
  '알림 설정',
]
const loggedOutSettings = ['공지사항', '개인정보 처리 방침', '서비스 이용약관']

function getPolicyPath(label: string): null | string {
  switch (label) {
    case '개인정보 처리 방침':
      return POLICY_META_BY_SLUG.privacy.path
    case '서비스 이용약관':
      return POLICY_META_BY_SLUG.service.path
    default:
      return null
  }
}

type MyPageViewProps = {
  user: MyUser | null
  /** 로그인 여부가 아직 정해지지 않은 구간. 셸은 그대로 두고 본문만 골격으로 채운다. */
  isPending?: boolean
  recentTraces?: MyTrace[]
  onLoginClick?: () => void
  onLogout?: () => void
}

export function MyPageView({
  user,
  isPending = false,
  recentTraces = [],
  onLoginClick,
  onLogout,
}: MyPageViewProps) {
  return (
    // 셸과 헤더는 데이터를 기다리지 않는다 — 로딩 분기 안쪽에 두면 탭바까지 사라져
    // 루트 배경(bg-bg-dark)이 드러나면서 화면이 번쩍인다
    <TabScreenLayout
      aria-label="마이페이지"
      activeTab="my"
      className="flex flex-col overflow-y-auto bg-bg-default"
    >
      <header className="flex h-11 shrink-0 items-center px-4">
        <h1 className="text-title-18sb font-bold text-text-secondary">마이페이지</h1>
      </header>
      {renderBody({ isPending, user, recentTraces, onLoginClick, onLogout })}
    </TabScreenLayout>
  )
}

/** 분기가 셋이라 삼항을 겹치지 않고 guard로 가른다 */
function renderBody({
  isPending,
  user,
  recentTraces,
  onLoginClick,
  onLogout,
}: Required<Pick<MyPageViewProps, 'isPending' | 'recentTraces' | 'user'>> &
  Pick<MyPageViewProps, 'onLoginClick' | 'onLogout'>) {
  if (isPending) return <MyPageSkeleton />
  if (user) return <LoggedInContent user={user} recentTraces={recentTraces} onLogout={onLogout} />
  return <LoggedOutContent onLoginClick={onLoginClick} />
}

function LoggedInContent({
  user,
  recentTraces,
  onLogout,
}: {
  user: MyUser
  recentTraces: MyTrace[]
  onLogout?: () => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <section className="flex items-center gap-3 px-4">
        {user.profileImageUrl ? (
          // 외부 이미지 도메인이 유동적이라 next/image 대신 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profileImageUrl}
            alt=""
            className="size-18 shrink-0 rounded-3xl object-cover"
          />
        ) : (
          <Image
            src="/images/profile-character-orange.png"
            alt=""
            width={72}
            height={72}
            className="shrink-0 rounded-3xl"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <strong className="text-title-18sb font-bold text-text-primary">{user.nickname}</strong>
          <p className="text-body-14md text-text-tertiary">
            지금까지 {user.traceCount}개의 흔적을 남겼어요!
          </p>
        </div>
        <Link
          href="/my/profile"
          aria-label="설정"
          className="shrink-0 rounded-full border border-border-default p-1.5 press"
        >
          <SettingIcon className="text-icon-muted" />
        </Link>
      </section>

      {recentTraces.length > 0 && (
        <section className="flex flex-col gap-6 px-4">
          <h2 className="text-body-16bd text-text-primary">{user.nickname}님이 최근에 남긴 흔적</h2>
          <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {recentTraces.map((trace) => (
              <li
                key={trace.id}
                title={trace.title}
                className="h-27 w-18 shrink-0 overflow-hidden rounded-xs bg-bg-book-card"
              >
                {trace.coverImageUrl && (
                  // 외부 이미지 도메인이 유동적이라 next/image 대신 img 사용
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trace.coverImageUrl} alt="" className="size-full object-cover" />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <SettingSection items={loggedInSettings} />

      <footer className="mt-auto flex items-center justify-center gap-2.5 p-2.5">
        <Link
          href={POLICY_META_BY_SLUG.service.path}
          className="text-body-14sb tracking-normal text-text-tertiary"
        >
          이용약관
        </Link>
        <span aria-hidden className="h-3 w-px bg-border-default" />
        <Link
          href={POLICY_META_BY_SLUG.privacy.path}
          className="text-body-14sb tracking-normal text-text-tertiary"
        >
          개인정보 처리방침
        </Link>
        {onLogout && (
          <>
            <span aria-hidden className="h-3 w-px bg-border-default" />
            <button
              type="button"
              onClick={onLogout}
              className="text-body-14sb tracking-normal text-text-tertiary"
            >
              로그아웃
            </button>
          </>
        )}
      </footer>
    </div>
  )
}

function LoggedOutContent({ onLoginClick }: { onLoginClick?: () => void }) {
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
          <Button className="w-full" onClick={onLoginClick}>
            다음
          </Button>
        </div>
      </div>

      <SettingSection items={loggedOutSettings} />
    </div>
  )
}

function SettingSection({ items }: { items: string[] }) {
  return (
    <section className="flex flex-col gap-6 px-4">
      <h2 className="text-body-16bd text-text-primary">설정</h2>
      <ul className="flex w-full flex-col gap-4">
        {items.map((label) => {
          const policyPath = getPolicyPath(label)
          const className = 'flex w-full items-center gap-2'
          const content = (
            <>
              <span className="flex-1 text-left text-body-14md text-text-secondary">{label}</span>
              <NextIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-icon-primary opacity-30"
              />
            </>
          )

          return (
            <li key={label}>
              {policyPath ? (
                <Link href={policyPath} className={className}>
                  {content}
                </Link>
              ) : (
                <button type="button" className={className}>
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
