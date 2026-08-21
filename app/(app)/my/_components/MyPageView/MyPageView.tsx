import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/app/_global/_components/Button/Button'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import SettingIcon from '@/app/_global/_components/Icon/assets/setting.svg'
import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
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
  { label: '스포일러 관리', path: '/my/spoilers' },
  { label: '좋아요 관리', path: '/my/likes' },
  // 화면·API가 아직 없는 기능 — 생기면 path를 연결한다
  { label: '알림 설정' },
  // 시안에는 없지만 남긴다 — 차단 유저 관리 화면이 확정 디자인으로 살아 있어
  // 여기서 빼면 /my/blocks에 접근할 통로가 사라진다. 고객지원도 같은 이유다.
  { label: '차단 관리', path: '/my/blocks' },
  { label: '고객지원', path: '/support' },
]
/** 프로필 이미지가 없거나 CDN에서 사라졌을 때 세우는 기본 이미지 */
const FALLBACK_PROFILE_IMAGE = '/images/profile-character-orange.webp'

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
  /** 로그인 상태인데 프로필 조회만 실패한 구간. 메뉴는 남기고 프로필 자리만 재시도 안내로 바꾼다. */
  isProfileError?: boolean
  /** 로그아웃 요청이 도는 동안 true. 버튼을 잠가 중복 요청을 막는다. */
  isLoggingOut?: boolean
  onRetryProfile?: () => void
  onLoginClick?: () => void
  onLogout?: () => void
}

export function MyPageView({
  user,
  isPending = false,
  isProfileError = false,
  isLoggingOut = false,
  onRetryProfile,
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
      {renderBody({
        isPending,
        isProfileError,
        isLoggingOut,
        user,
        onRetryProfile,
        onLoginClick,
        onLogout,
      })}
    </TabScreenLayout>
  )
}

/** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
function renderBody({
  isPending,
  isProfileError,
  isLoggingOut,
  user,
  onRetryProfile,
  onLoginClick,
  onLogout,
}: Required<Pick<MyPageViewProps, 'isPending' | 'isProfileError' | 'isLoggingOut' | 'user'>> &
  Pick<MyPageViewProps, 'onRetryProfile' | 'onLoginClick' | 'onLogout'>) {
  if (isPending) return <MyPageSkeleton />
  // 프로필 조회만 실패한 로그인 사용자도 로그인 화면에 남긴다 — 비로그인 화면으로 떨어뜨리면
  // 내 서재·로그아웃이 사라져 실제로 로그아웃된 것처럼 읽힌다.
  if (user || isProfileError) {
    return (
      <LoggedInContent
        user={user}
        isLoggingOut={isLoggingOut}
        onRetryProfile={onRetryProfile}
        onLogout={onLogout}
      />
    )
  }
  return <LoggedOutContent onLoginClick={onLoginClick} />
}

/** user가 null이면 프로필 조회만 실패한 상태 — 프로필 줄 자리에 재시도 안내를 세운다 */
function LoggedInContent({
  user,
  isLoggingOut,
  onRetryProfile,
  onLogout,
}: {
  user: MyUser | null
  isLoggingOut?: boolean
  onRetryProfile?: () => void
  onLogout?: () => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      {user ? (
        <ProfileSection user={user} />
      ) : (
        // 프로필 줄과 같은 높이(아바타 72px)를 지켜 재시도가 성공했을 때 아래가 튀지 않게 한다
        <RetryMessage
          message="프로필을 불러오지 못했어요."
          onRetry={() => onRetryProfile?.()}
          className="min-h-18 justify-center py-0"
        />
      )}

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
              disabled={isLoggingOut}
              className="text-body-14sb tracking-normal text-text-tertiary disabled:opacity-40"
            >
              로그아웃
            </button>
          </>
        )}
      </footer>
    </div>
  )
}

function ProfileSection({ user }: { user: MyUser }) {
  return (
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
          // 카카오 CDN URL은 만료된다 — 404가 나면 웹뷰가 이미지 대신 오류 표시를 내므로
          // 기본 이미지로 바꾼다. 기본 이미지도 실패했을 때 같은 src를 다시 넣지 않도록 막는다.
          onError={(event) => {
            const image = event.currentTarget
            if (image.getAttribute('src') === FALLBACK_PROFILE_IMAGE) return
            image.setAttribute('src', FALLBACK_PROFILE_IMAGE)
          }}
          className="size-18 shrink-0 rounded-3xl object-cover"
        />
      ) : (
        <Image
          src={FALLBACK_PROFILE_IMAGE}
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
        {items.map(({ label, path }) => (
          <li key={label}>
            {path ? (
              <Link href={path} className="flex w-full items-center gap-2">
                <span className="flex-1 text-left text-body-14md text-text-secondary">{label}</span>
                <NextIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-icon-primary opacity-30"
                />
              </Link>
            ) : (
              // 아직 화면이 없는 항목. 눌러도 갈 곳이 없으니 비활성으로 두고 이동을 뜻하는
              // chevron도 뺀다 — 누를 수 있게 두면 눌러도 아무 일이 없어 오류로 읽힌다.
              <button type="button" disabled className="flex w-full items-center gap-2 opacity-40">
                <span className="flex-1 text-left text-body-14md text-text-secondary">{label}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
