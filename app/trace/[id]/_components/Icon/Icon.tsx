import type { ReactNode } from 'react'

type IconName =
  'back' | 'plus' | 'pencil' | 'chevronDown' | 'chevronRight' | 'heart' | 'comment' | 'caution'

const icons: Record<IconName, (color: string) => ReactNode> = {
  back: (color) => (
    <path
      d="M19 12H5M12 19l-7-7 7-7"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  plus: (color) => (
    <path d="M12 5v14M5 12h14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  ),
  pencil: (color) => (
    <path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"
      fill={color}
    />
  ),
  chevronDown: (color) => (
    <path
      d="m6 9 6 6 6-6"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chevronRight: (color) => (
    <path d="m9 6 6 6-6 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  ),
  heart: (color) => (
    <path
      d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
      fill={color}
    />
  ),
  comment: (color) => (
    <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" fill={color} />
  ),
  caution: (color) => (
    <>
      <path d="M12 2 1 21h22L12 2Z" fill={color} />
      <path d="M11 10h2v5h-2z" fill="#f3f2e0" />
      <circle cx="12" cy="18" r="1.1" fill="#f3f2e0" />
    </>
  ),
}

type IconProps = {
  name: IconName
  size?: number
  color?: string
}

export function Icon({ name, size = 24, color = '#fff' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {icons[name](color)}
    </svg>
  )
}
