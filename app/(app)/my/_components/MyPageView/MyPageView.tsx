import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/app/_global/_components/Button/Button'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import SettingIcon from '@/app/_global/_components/Icon/assets/setting.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { POLICY_META_BY_SLUG } from '@/app/_shared/terms/_data/policy.constant'

import type { MyUser } from '../../_types/myUser.type'
import { MyPageSkeleton } from '../MyPageSkeleton/MyPageSkeleton'

/** 갈 곳이 없는 항목(path 없음)은 아직 화면이 없는 것 — 버튼으로만 그린다 */
type SettingItem = { label: string; path?: string }

// 확정 시안에서 내 기록은 서재 하나로 좁혀졌다.
// 책별 기록은 서재 > 책 상세의 의견·좋아요·스포일러 탭이 대신한다.
const myRecords: SettingItem[] = [{ label: '내 서재', path: '/my/library' }]
const loggedInSettings: SettingItem[] = [
  { label: '공지사항', path: '/my/notices' },
  // 화면·API가 아직 없는 기능 — 생기면 path를 연결한다
  { label: '배경색 관리' },
  { label: '스포일러 관리', path: '/my/spoilers' },
  { label: '좋아요 관리', path: '/my/likes' },
  { label: '알림 설정' },
  // 시안에는 없지만 남긴다 — 차단 유저 관리 화면이 확정 디자인으로 살아 있어
  // 여기서 빼면 /my/blocks에 접근할 통로가 사라진다. 고객지원도 같은 이유다.
  { label: '차단 관리', path: '/my/blocks' },
  { label: '고객지원', path: '/support' },
]
const loggedOutSettings: SettingItem[] = [
  { label: '공지사항', path: '/my/notices' },
  { label: '개인정보 처리 방침', path: POLICY_META_BY_SLUG.privacy.path },
  { label: '서비스 이용약관', path: POLICY_META_BY_SLUG.service.path },
  // 디자인에는 없지만 로그인 화면과 같은 이유로 남긴다 — 로그인 못 하는 사용자에게도 문의 통로가 필요하다
  { label: '고객지원', path: '/support' },
]

type MyPageViewProps = {
  user: MyUser | null
  /** 로그인 여부가 아직 정해지지 않은 구간. 셸은 그대로 두고 본문만 골격으로 채운다. */
  isPending?: boolean
  onLoginClick?: () => void
  onLogout?: () => void
}

export function MyPageView({ user, isPending = false, onLoginClick, onLogout }: MyPageViewProps) {
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
      {renderBody({ isPending, user, onLoginClick, onLogout })}
    </TabScreenLayout>
  )
}

/** 분기가 셋이라 삼항을 겹치지 않고 guard로 가른다 */
function renderBody({
  isPending,
  user,
  onLoginClick,
  onLogout,
}: Required<Pick<MyPageViewProps, 'isPending' | 'user'>> &
  Pick<MyPageViewProps, 'onLoginClick' | 'onLogout'>) {
  if (isPending) return <MyPageSkeleton />
  if (user) return <LoggedInContent user={user} onLogout={onLogout} />
  return <LoggedOutContent onLoginClick={onLoginClick} />
}

function LoggedInContent({ user, onLogout }: { user: MyUser; onLogout?: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      <section className="flex items-center gap-3 px-4">
        {user.profileImageUrl ? (
          // 프로필 이미지 도메인이 유동적이라(카카오 CDN 등) next/image 대신 img 사용 — 크기·디코딩만 정비
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profileImageUrl}
            alt=""
            width={72}
            height={72}
            decoding="async"
            className="size-18 shrink-0 rounded-3xl object-cover"
          />
        ) : (
          <Image
            src="/images/profile-character-orange.webp"
            alt=""
            width={72}
            height={72}
            className="shrink-0 rounded-3xl"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <strong className="text-title-18sb font-bold text-text-primary">{user.nickname}</strong>
          <p className="text-body-14md text-text-tertiary">
            지금까지 {user.opinionCount}개의 생각을 남겼어요!
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

      <SettingSection title="내 기록" items={myRecords} />

      <SettingSection title="설정" items={loggedInSettings} />

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
            src="/images/profile-character-gray.webp"
            alt=""
            width={72}
            height={72}
            className="shrink-0 rounded-3xl"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <strong className="text-title-18sb font-bold text-text-primary">안녕하세요!</strong>
            <p className="text-body-14md text-text-tertiary">
              로그인하고 더 많은 의견을 확인해보세요!
            </p>
          </div>
        </section>
        <div className="px-4">
          <Button className="w-full" onClick={onLoginClick}>
            로그인 하기
          </Button>
        </div>
      </div>

      <SettingSection title="설정" items={loggedOutSettings} />
    </div>
  )
}

function SettingSection({ title, items }: { title: string; items: SettingItem[] }) {
  return (
    <section className="flex flex-col gap-6 px-4">
      <h2 className="text-body-16bd text-text-primary">{title}</h2>
      <ul className="flex w-full flex-col gap-4">
        {items.map(({ label, path }) => {
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
              {path ? (
                <Link href={path} className={className}>
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
