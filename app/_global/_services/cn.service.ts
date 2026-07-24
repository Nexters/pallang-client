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
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
