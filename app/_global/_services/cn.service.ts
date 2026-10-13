import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// globals.css의 커스텀 타이포 토큰(text-body-16bd 등)은 기본 tailwind-merge가
// 색상 클래스로 분류해 text-text-inverse 같은 색상 유틸과 충돌 병합됨
// → font-size 그룹으로 등록해 타이포끼리만 병합되도록 한다
const isCustomTextStyle = (value: string) =>
  /^(title|body|caption|dialogue)-\d+(bd|sb|md|rg)$/.test(value)

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [isCustomTextStyle] }],
      // globals.css의 하단 인셋 유틸리티. 등록하지 않으면 tailwind-merge가 padding-bottom으로
      // 알아보지 못해 pb-0 같은 덮어쓰기가 pb-safe와 나란히 살아남고, 어느 쪽이 이길지는
      // 스타일시트 순서에 맡겨진다 — 같은 그룹에 넣어 뒤에 온 클래스만 남게 한다
      pb: [{ pb: ['safe', 'safe-6', 'safe-8'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
