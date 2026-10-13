import Image from 'next/image'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import ResetIcon from '@/app/_global/_components/Icon/assets/reset.svg'
import {
  FEEDBACK_ILLUSTRATION_SIZE,
  FEEDBACK_ILLUSTRATION_SRC,
} from '@/app/_global/_data/feedbackIllustration.constant'
import { cn } from '@/app/_global/_services/cn.service'

type FeedbackStateProps = ComponentPropsWithoutRef<'section'> & {
  actionLabel?: ReactNode
  /** 액션이 처리 중인지. 재시도처럼 눌러도 화면이 그대로인 동작에 진행 표시를 남긴다. */
  actionLoading?: boolean
  imageSrc?: string
  message: ReactNode
  onAction?: () => void
}

type ApiErrorProps = Omit<FeedbackStateProps, 'actionLabel' | 'message' | 'onAction' | 'title'> & {
  onRetry: () => void
  title?: ReactNode
}

const DEFAULT_API_ERROR_TITLE = '문제가 발생했습니다.'

const API_ERROR_ACTION_LABEL = (
  <span className="flex items-center gap-2">
    다시 시도하기
    <ResetIcon aria-hidden="true" className="size-6 text-text-inverse" />
  </span>
)

export function FeedbackState({
  actionLabel,
  actionLoading = false,
  className,
  // 기본 일러스트는 IllustrationPreload(루트 레이아웃)가 선로딩한다 — imageSrc를 바꾸면 선로딩 밖이다
  imageSrc = FEEDBACK_ILLUSTRATION_SRC,
  message,
  onAction,
  ...props
}: FeedbackStateProps) {
  return (
    <section
      className={cn('flex flex-1 flex-col items-center justify-center gap-4 px-4', className)}
      {...props}
    >
      <div className="flex w-full flex-col items-center gap-4">
        <Image
          src={imageSrc}
          alt=""
          {...FEEDBACK_ILLUSTRATION_SIZE}
          aria-hidden="true"
          className="h-[140px] w-[175px] object-bottom opacity-40"
        />
        <p className="text-center font-pretendard text-title-18md text-text-secondary">{message}</p>
      </div>
      {actionLabel && (
        <Button
          className="h-[54px] w-[168px] bg-interactive-btn-secondary"
          loading={actionLoading}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </section>
  )
}

export function ApiErrorFeedbackState({
  onRetry,
  title = DEFAULT_API_ERROR_TITLE,
  ...props
}: ApiErrorProps) {
  return (
    <FeedbackState
      message={
        <>
          {title}
          <br />
          다시 시도해주세요!
        </>
      }
      actionLabel={API_ERROR_ACTION_LABEL}
      onAction={onRetry}
      {...props}
    />
  )
}
