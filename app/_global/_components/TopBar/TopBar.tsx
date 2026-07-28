import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

type RootProps = ComponentPropsWithoutRef<'header'>

function Root({ className, ...props }: RootProps) {
  return (
    <header
      data-slot="top-bar"
      className={cn('flex items-center gap-2 px-4 py-2.5', className)}
      {...props}
    />
  )
}

type TitleProps = ComponentPropsWithoutRef<'div'> & {
  as?: 'div' | 'h1' | 'span'
}

function Title({ as: Component = 'div', className, ...props }: TitleProps) {
  return (
    <Component
      data-slot="top-bar-title"
      className={cn(
        'flex min-w-px items-center gap-1 whitespace-nowrap font-pretendard text-title-18bd text-text-secondary',
        className,
      )}
      {...props}
    />
  )
}

type ActionProps = ComponentPropsWithoutRef<'button'>

function Action({ className, type = 'button', ...props }: ActionProps) {
  return (
    <button
      type={type}
      data-slot="top-bar-action"
      className={cn(
        'flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-primary',
        className,
      )}
      {...props}
    />
  )
}

type LinkActionProps = ComponentPropsWithoutRef<typeof Link>

function LinkAction({ className, ...props }: LinkActionProps) {
  return (
    <Link
      data-slot="top-bar-link-action"
      className={cn(
        'flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-primary',
        className,
      )}
      {...props}
    />
  )
}

type SpacerProps = ComponentPropsWithoutRef<'div'>

function Spacer({ className, ...props }: SpacerProps) {
  return <div data-slot="top-bar-spacer" className={cn('min-w-px flex-1', className)} {...props} />
}

export const TopBar = {
  Root,
  Title,
  Action,
  LinkAction,
  Spacer,
}
