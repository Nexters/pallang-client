import { describe, expect, it } from 'vitest'

import { resolveBackTarget, resolveStep, stepPath } from '../_services/traceStepNav.service'

describe('resolveStep', () => {
  it('경로를 단계로 바꾼다', () => {
    expect(resolveStep('/trace/new')).toBe('search')
    expect(resolveStep('/trace/new/photo')).toBe('photo')
    expect(resolveStep('/trace/new/detail')).toBe('detail')
    expect(resolveStep('/trace/new/decorate')).toBe('decorate')
    expect(resolveStep('/trace/new/opinion')).toBe('opinion')
    expect(resolveStep('/trace/new/done')).toBe('done')
  })

  it('플로우 밖 경로는 null이다', () => {
    expect(resolveStep('/')).toBeNull()
    expect(resolveStep('/trace/12')).toBeNull()
  })
})

describe('stepPath', () => {
  it('단계를 경로로 바꾼다', () => {
    expect(stepPath('search')).toBe('/trace/new')
    expect(stepPath('done')).toBe('/trace/new/done')
  })
})

describe('resolveBackTarget', () => {
  it('사진·상세에서 뒤로 가면 대목을 비우고 책 검색으로 돌아간다', () => {
    // 사진과 OCR 블록은 draft에 없어 photo 재진입이 카메라를 다시 여는 것 말고 할 일이 없다.
    // 대목을 비워야 BookPicker가 방식 선택 시트를 다시 연다.
    expect(resolveBackTarget('photo')).toEqual({ clearQuote: true, step: 'search', type: 'step' })
    expect(resolveBackTarget('detail')).toEqual({ clearQuote: true, step: 'search', type: 'step' })
  })

  it('꾸미기·의견에서 뒤로 가면 대목을 유지한 채 한 단계만 되돌린다', () => {
    expect(resolveBackTarget('decorate')).toEqual({
      clearQuote: false,
      step: 'detail',
      type: 'step',
    })
    expect(resolveBackTarget('opinion')).toEqual({
      clearQuote: false,
      step: 'decorate',
      type: 'step',
    })
  })

  it('첫 화면과 완료 화면에서 뒤로 가면 플로우를 벗어난다', () => {
    expect(resolveBackTarget('search')).toEqual({ type: 'exit' })
    expect(resolveBackTarget('done')).toEqual({ type: 'exit' })
  })
})
