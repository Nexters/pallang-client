import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

type SkeletonProps = ComponentPropsWithoutRef<'div'> & {
  /** 놓이는 배경. 밝은 면에서는 어둡게, 어두운 면에서는 밝게 깔아야 같은 세기로 보인다. */
  tone?: 'light' | 'dark'
}

const TONE_CLASS = {
  light: 'bg-bg-surface',
  dark: 'bg-white/15',
} as const

/**
 * 데이터가 오기 전 자리를 지키는 조각. 크기·모양은 쓰는 쪽이 className으로 정한다.
 *
 * 움직이지 않는다 — 기존 골격(BookInternalPageSkeleton 등)이 모두 정적이고,
 * 여러 조각이 함께 깜빡이면 화면이 소란스러워진다.
 */
export function Skeleton({ className, tone = 'light', ...props }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('rounded', TONE_CLASS[tone], className)} {...props} />
  )
}
