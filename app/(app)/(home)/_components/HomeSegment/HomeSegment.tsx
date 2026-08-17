'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

type HomeSegmentProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  children: ReactNode
  selected?: boolean
}

export function HomeSegment({
  children,
  className,
  selected = false,
  type = 'button',
  ...props
}: HomeSegmentProps) {
  return (
    <button
      type={type}
      role="radio"
      aria-checked={selected}
      data-state={selected ? 'checked' : 'unchecked'}
      className={cn(
        'press flex w-[66px] items-center justify-center rounded-[99px] px-[14px] py-2 font-pretendard text-[14px] leading-[1.3] tracking-[-0.56px] whitespace-nowrap text-[#333]',
        'transition-[background-color,color,scale] duration-instant ease-standard',
        selected ? 'bg-bg-default font-bold text-[#111]' : 'font-medium',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
