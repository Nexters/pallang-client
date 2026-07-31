import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

// ponytail: base-ui 미설치 — 네이티브 button으로 충분. 상호작용 로직 필요해지면 base-ui 도입 검토
type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'default' | 'back' | 'activated'
  /** 처리 중 상태. 클릭을 막고, 회색(disabled)으로 죽는 대신 색을 유지한 채 pulse로 알린다. */
  loading?: boolean
}

const variantClassMap = {
  default: 'bg-interactive-btn-secondary',
  back: 'bg-interactive-btn-tertiary',
  activated: 'bg-interactive-accent',
} satisfies Record<NonNullable<ButtonProps['variant']>, string>

export function Button({
  variant = 'default',
  type = 'button',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      // 로딩 중에도 클릭은 막되, 판정은 aria-busy로 알린다
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'flex items-center justify-center rounded-2xl p-4 text-center text-body-16bd text-text-inverse press',
        variantClassMap[variant],
        // 로딩이 아닐 때만 회색 처리 — 로딩은 색을 유지해 '처리 중'이 '비활성'으로 안 읽히게 한다
        loading ? '' : 'disabled:bg-interactive-btn-disabled',
        className,
      )}
      {...props}
    >
      {loading ? <span className="animate-pulse">{children}</span> : children}
    </button>
  )
}
