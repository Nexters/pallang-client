import { describe, expect, it } from 'vitest'

import { cn } from './cn.service'

describe('cn', () => {
  it('커스텀 타이포 토큰과 색상 유틸을 충돌로 병합하지 않는다', () => {
    expect(cn('text-body-16bd', 'text-text-inverse')).toBe('text-body-16bd text-text-inverse')
  })

  it('커스텀 타이포 토큰끼리는 뒤가 이긴다', () => {
    expect(cn('text-body-16bd', 'text-title-16sb')).toBe('text-title-16sb')
  })

  it('색상 유틸끼리는 뒤가 이긴다', () => {
    expect(cn('text-text-inverse', 'text-text-primary')).toBe('text-text-primary')
  })

  it('조건부 클래스와 tailwind 충돌을 함께 처리한다', () => {
    expect(cn('p-4', undefined, { hidden: false }, 'p-2')).toBe('p-2')
  })
})
