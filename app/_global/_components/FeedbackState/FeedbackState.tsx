import Image from 'next/image'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { cn } from '@/app/_global/_services/cn.service'

type FeedbackStateProps = ComponentPropsWithoutRef<'section'> & {
  actionLabel?: string
  imageSrc?: string
  message: ReactNode
  onAction?: () => void
}

export function FeedbackState({
  actionLabel,
  className,
  imageSrc = '/images/sad-friends.png',
  message,
  onAction,
  ...props
}: FeedbackStateProps) {
  return (
    <section
      className={cn('flex flex-1 flex-col items-center justify-center gap-10 px-4', className)}
      {...props}
    >
      <div className="flex w-full flex-col items-center gap-4">
        <Image
          src={imageSrc}
          alt=""
          width={175}
          height={140}
          aria-hidden="true"
          className="h-[140px] w-[175px] object-bottom opacity-40"
        />
        <p className="text-center font-pretendard text-title-18md text-text-secondary">{message}</p>
      </div>
      {actionLabel && (
        <Button className="h-[54px] w-[168px] bg-interactive-btn-secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  )
}
