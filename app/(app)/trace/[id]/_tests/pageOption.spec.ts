import { describe, expect, it } from 'vitest'

import {
  formatPageLabel,
  parsePageValue,
  toPageOptions,
  toPageValue,
  toSelectedValue,
} from '../_services/pageOption.service'

describe('쪽 표기', () => {
  it("라벨에는 'p'가 붙고 값에는 붙지 않는다 — 둘이 섞이면 고른 쪽을 되돌리지 못한다", () => {
    expect(formatPageLabel(7)).toBe('7p')
    expect(toPageValue(7)).toBe('7')
  })

  it('값과 쪽 번호는 왕복해도 같은 수다', () => {
    for (const page of [1, 7, 200, 1234]) {
      expect(parsePageValue(toPageValue(page))).toBe(page)
    }
  })
})

describe('toSelectedValue', () => {
  it('정해진 쪽은 값 표기로 준다', () => {
    expect(toSelectedValue(9)).toBe('9')
  })

  it("아직 정해진 쪽이 없으면 null이다 — base-ui Select의 '선택 없음'", () => {
    expect(toSelectedValue(undefined)).toBeNull()
  })
})

describe('toPageOptions', () => {
  it('목록의 순서를 지키며 라벨·값 짝을 만든다', () => {
    expect(toPageOptions([7, 9, 200])).toEqual([
      { label: '7p', value: '7' },
      { label: '9p', value: '9' },
      { label: '200p', value: '200' },
    ])
  })

  it('빈 목록은 빈 목록이다 — 고를 쪽이 없으면 선택기 자체가 서지 않는다', () => {
    expect(toPageOptions([])).toEqual([])
  })

  it('보고 있는 쪽이 목록에 없으면 앞에 끼워 넣는다 — 트리거 라벨은 여기서 찾는다', () => {
    expect(toPageOptions([7, 9], 130)).toEqual([
      { label: '130p', value: '130' },
      { label: '7p', value: '7' },
      { label: '9p', value: '9' },
    ])
  })

  it('이미 목록에 있는 쪽은 두 번 넣지 않는다', () => {
    expect(toPageOptions([7, 9], 9)).toEqual([
      { label: '7p', value: '7' },
      { label: '9p', value: '9' },
    ])
  })
})
