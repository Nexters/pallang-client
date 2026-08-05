'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Spinner } from '@/app/_global/_components/Spinner/Spinner'
import { Textfield } from '@/app/_global/_components/Textfield/Textfield'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { ApiError } from '@/app/_global/_data/api.model'
import { useCamera } from '@/app/_global/_hooks/useCamera'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { userMutations, userQueries } from '@/app/_global/_queries/user.queries'

import { ProfileSettingsSkeleton } from '../ProfileSettingsSkeleton/ProfileSettingsSkeleton'
import { WithdrawDialog } from '../WithdrawDialog/WithdrawDialog'

export function ProfileSettingsContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { status, isAuthenticated } = useAuth()
  const { takePhoto } = useCamera()

  const { data, isError } = useQuery({ ...userQueries.me(), enabled: isAuthenticated })
  const me = data?.data

  // null이면 아직 입력하지 않은 상태 — 조회한 닉네임을 그대로 보여준다
  const [nicknameInput, setNicknameInput] = useState<null | string>(null)
  const [nicknameError, setNicknameError] = useState('')
  const [message, setMessage] = useState('')
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)

  const modifyNickname = useMutation(userMutations.modifyNickname())
  const modifyProfileImage = useMutation(userMutations.modifyProfileImage())
  const withdrawMutation = useMutation(userMutations.withdraw())

  // 비로그인으로 확정되면 볼 내용이 없다. 탈퇴 직후에도 이 경로로 마이페이지에 안착한다.
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/my')
  }, [status, router])

  const handleEditImage = async () => {
    try {
      const photo = await takePhoto('gallery')
      if (!photo) return
      modifyProfileImage.mutate(
        { image: photo.blob },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey })
          },
          onError: () => {
            setMessage('프로필 이미지를 변경하지 못했어요. 잠시 후 다시 시도해주세요.')
          },
        },
      )
    } catch {
      setMessage('사진을 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleSave = () => {
    if (!me) return
    const nextNickname = (nicknameInput ?? me.nickname).trim()
    // 바뀐 게 없으면 서버를 부르지 않고 그대로 돌아간다
    if (!nextNickname || nextNickname === me.nickname) {
      router.back()
      return
    }
    modifyNickname.mutate(
      { nickname: nextNickname },
      {
        onSuccess: () => {
          // 이동을 막을 이유가 없다 — 갱신은 뒤에서 마저 돈다
          void queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey })
          router.back()
        },
        onError: (error) => {
          // 중복·하루 1회 제한 등 서버 사유는 메시지에 담겨 온다
          setNicknameError(
            error instanceof ApiError && error.message
              ? error.message
              : '닉네임을 변경하지 못했어요. 잠시 후 다시 시도해주세요.',
          )
        },
      },
    )
  }

  const handleWithdraw = () => {
    withdrawMutation.mutate(undefined, {
      onSuccess: () => {
        // 탈퇴한 계정의 캐시(프로필·흔적)를 남기지 않는다
        queryClient.clear()
        router.replace('/my')
      },
      onError: () => {
        setIsWithdrawOpen(false)
        setMessage('회원 탈퇴에 실패했어요. 잠시 후 다시 시도해주세요.')
      },
    })
  }

  const isPending = status === 'loading' || (isAuthenticated && !me && !isError)

  return (
    // 흰 상단이 노치 뒤까지 채워지도록 셸 패딩을 되돌리고(-mt) 안에서 다시 더한다
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      {/* 셸은 데이터를 기다리지 않는다 — 로딩 중에도 TopBar와 타이틀은 그대로 선다 */}
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로"
          onClick={() => {
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">프로필 설정</TopBar.Title>
      </TopBar.Root>

      {me && !isPending ? (
        <ProfileForm
          email={me.email ?? null}
          profileImageUrl={me.profileImageUrl ?? null}
          nickname={nicknameInput ?? me.nickname}
          nicknameError={nicknameError}
          isImageUploading={modifyProfileImage.isPending}
          onNicknameChange={(value) => {
            setNicknameInput(value)
            setNicknameError('')
          }}
          onEditImage={() => void handleEditImage()}
          onWithdrawClick={() => {
            setIsWithdrawOpen(true)
          }}
        />
      ) : isError ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-body-14md text-text-tertiary">
          프로필을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </p>
      ) : (
        <ProfileSettingsSkeleton />
      )}

      <div
        className="mt-auto flex shrink-0 p-4"
        style={{ paddingBottom: 'max(1rem, var(--safe-bottom))' }}
      >
        <Button
          className="h-[54px] flex-1"
          disabled={!me}
          loading={modifyNickname.isPending}
          onClick={handleSave}
        >
          저장하기
        </Button>
      </div>

      <WithdrawDialog
        open={isWithdrawOpen}
        loading={withdrawMutation.isPending}
        onCancel={() => {
          setIsWithdrawOpen(false)
        }}
        onConfirm={handleWithdraw}
      />

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </main>
  )
}

function ProfileForm({
  email,
  profileImageUrl,
  nickname,
  nicknameError,
  isImageUploading,
  onNicknameChange,
  onEditImage,
  onWithdrawClick,
}: {
  email: null | string
  profileImageUrl: null | string
  nickname: string
  nicknameError: string
  isImageUploading: boolean
  onNicknameChange: (value: string) => void
  onEditImage: () => void
  onWithdrawClick: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
      <div className="flex justify-center py-6">
        <div className="relative">
          {profileImageUrl ? (
            // 외부 이미지 도메인이 유동적이라 next/image 대신 img 사용
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileImageUrl} alt="" className="size-[90px] rounded-3xl object-cover" />
          ) : (
            <Image
              src="/images/profile-character-orange.png"
              alt=""
              width={90}
              height={90}
              className="rounded-3xl"
            />
          )}
          <button
            type="button"
            aria-label="프로필 이미지 변경"
            disabled={isImageUploading}
            onClick={onEditImage}
            className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-border-default bg-bg-default text-icon-primary press"
          >
            {isImageUploading ? (
              <Spinner className="size-3.5" />
            ) : (
              <PencilIcon aria-hidden="true" className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Textfield
          label="닉네임"
          value={nickname}
          maxLength={15}
          placeholder="닉네임을 입력해 주세요."
          errorMessage={nicknameError}
          onChange={(event) => {
            onNicknameChange(event.target.value)
          }}
        />

        {/* SNS 이메일 제공 미동의면 email이 null — 필드 블록 자체를 렌더하지 않는다 */}
        {email && (
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-body-14md text-text-secondary">가입 아이디</span>
              <span className="text-caption-12rg text-text-disabled">
                *SNS 로그인 가입자입니다.
              </span>
            </div>
            <p className="w-full rounded-2xl bg-bg-surface p-4 text-body-16md text-text-secondary/50">
              {email}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onWithdrawClick}
        className="mt-auto mb-2 self-start py-4 text-body-14md text-text-tertiary underline"
      >
        회원탈퇴
      </button>
    </div>
  )
}
