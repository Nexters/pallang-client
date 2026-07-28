import Image from 'next/image'
import type { ComponentPropsWithoutRef } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { cn } from '@/app/_global/_services/cn.service'

type BookEmptyStateProps = ComponentPropsWithoutRef<'section'>

export function BookEmptyState({ className, ...props }: BookEmptyStateProps) {
  return (
    <section
      aria-label="빈 도서 목록"
      className={cn('flex flex-1 flex-col items-center justify-center gap-10 px-4', className)}
      {...props}
    >
      <div className="flex w-full flex-col items-center gap-4">
        <Image
          src="/images/sad-friends.png"
          alt=""
          width={175}
          height={140}
          aria-hidden="true"
          className="h-[140px] w-[175px] object-bottom opacity-40"
        />
        <p className="text-center font-pretendard text-title-18md text-text-secondary">
          등록된 책이 없어요!
          <br />
          오탈자가 있는지 확인해주시거나
          <br />
          직접 책을 등록해 주세요.
        </p>
      </div>
      <Button className="h-[54px] w-[168px] bg-interactive-btn-secondary">다음</Button>
    </section>
  )
}
