import type { ComponentPropsWithoutRef } from 'react'

// ponytail: base-ui 미설치 — 네이티브 button으로 충분. 상호작용 로직 필요해지면 base-ui 도입 검토
type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'default' | 'back' | 'activated'
}

const variantClassMap = {
  default: 'bg-interactive-btn-secondary',
  back: 'bg-interactive-btn-tertiary',
  activated: 'bg-interactive-accent',
} satisfies Record<NonNullable<ButtonProps['variant']>, string>

export function Button({ variant = 'default', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`flex items-center justify-center rounded-2xl p-4 text-center text-body-16bd text-text-inverse disabled:bg-interactive-btn-disabled ${variantClassMap[variant]} ${className ?? ''}`}
      {...props}
    />
  )
}
