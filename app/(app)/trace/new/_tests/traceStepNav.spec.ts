import { describe, expect, it } from 'vitest'

import {
  nextStepPaths,
  resolveBackTarget,
  resolveStep,
  stepPath,
} from '../_services/traceStepNav.service'

describe('resolveStep', () => {
  it('경로를 단계로 바꾼다', () => {
    expect(resolveStep('/trace/new')).toBe('source')
    expect(resolveStep('/trace/new/photo')).toBe('photo')
    expect(resolveStep('/trace/new/write')).toBe('write')
    expect(resolveStep('/trace/new/decorate')).toBe('decorate')
    expect(resolveStep('/trace/new/book')).toBe('book')
    expect(resolveStep('/trace/new/done')).toBe('done')
  })

  it('플로우 밖 경로는 null이다', () => {
    expect(resolveStep('/')).toBeNull()
    expect(resolveStep('/trace/12')).toBeNull()
  })
})

describe('stepPath', () => {
  it('단계를 경로로 바꾼다', () => {
    expect(stepPath('source')).toBe('/trace/new')
    expect(stepPath('book')).toBe('/trace/new/book')
  })
})

describe('nextStepPaths', () => {
  it('각 단계에서 이어질 다음 단계 경로를 준다 — 프리페치 대상', () => {
    expect(nextStepPaths('photo')).toEqual(['/trace/new/write'])
    expect(nextStepPaths('decorate')).toEqual(['/trace/new/book'])
    expect(nextStepPaths('book')).toEqual(['/trace/new/done'])
  })

  it('생각 작성은 출구가 둘이다 — 대목을 물고 들어온 경로는 여기서 저장해 완료로 간다', () => {
    expect(nextStepPaths('write')).toEqual(['/trace/new/decorate', '/trace/new/done'])
  })

  it('첫 화면은 방식 선택에 따라 사진·직접입력 어느 쪽으로도 가므로 둘 다 미리 받는다', () => {
    expect(nextStepPaths('source')).toEqual(['/trace/new/photo', '/trace/new/write'])
  })
})

describe('resolveBackTarget', () => {
  it('사진·생각 작성에서 뒤로 가면 대목을 비우고 방식 선택으로 돌아간다', () => {
    expect(resolveBackTarget('photo')).toEqual({ clearQuote: true, step: 'source', type: 'step' })
    expect(resolveBackTarget('write')).toEqual({ clearQuote: true, step: 'source', type: 'step' })
  })

  it('꾸미기·책 등록에서 뒤로 가면 대목을 유지한 채 한 단계만 되돌린다', () => {
    expect(resolveBackTarget('decorate')).toEqual({
      clearQuote: false,
      step: 'write',
      type: 'step',
    })
    expect(resolveBackTarget('book')).toEqual({
      clearQuote: false,
      step: 'decorate',
      type: 'step',
    })
  })

  it('첫 화면과 완료 화면에서 뒤로 가면 플로우를 벗어난다', () => {
    expect(resolveBackTarget('source')).toEqual({ type: 'exit' })
    expect(resolveBackTarget('done')).toEqual({ type: 'exit' })
  })
})
