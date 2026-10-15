import { cn } from '@/app/_global/_services/cn.service'

type SheetTone = 'light' | 'dark'

/** BottomSheet와 PeekSheet가 같이 쓰는 패널 표면.
    모서리 32px은 v2 시트 시안 공통값(3321:30402)이다. */
export function sheetPanelClassName({
  tone = 'light',
  withHandle = false,
}: {
  tone?: SheetTone
  withHandle?: boolean
}): string {
  return cn(
    'relative flex flex-col rounded-t-4xl outline-none',
    withHandle ? 'pt-0' : 'pt-6',
    tone === 'dark' ? 'bg-bg-dark' : 'bg-bg-default',
  )
}
