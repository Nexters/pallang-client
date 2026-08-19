import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildInviteUrl, shareInviteLink } from '../_services/inviteLink.service'

const data = {
  title: '팔랑 모임 초대',
  text: "'고전 뽀개기' 모임에 초대합니다.",
  url: 'https://www.pallang.co.kr/meeting/invite/abc',
}

describe('초대 링크', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('초대 코드로 랜딩 URL을 만든다', () => {
    expect(buildInviteUrl('a1b2', 'https://www.pallang.co.kr')).toBe(
      'https://www.pallang.co.kr/meeting/invite/a1b2',
    )
    expect(buildInviteUrl('a b', 'https://x.y')).toBe('https://x.y/meeting/invite/a%20b')
  })
  it('OS 공유 시트가 있으면 그걸로 공유한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    await expect(shareInviteLink(data)).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith(data)
  })
  it('사용자가 공유를 취소하면 아무 일도 없던 것으로 본다', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')),
    })
    await expect(shareInviteLink(data)).resolves.toBe('cancelled')
  })
  it('공유 시트가 없으면 클립보드에 복사한다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(shareInviteLink(data)).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(data.url)
  })
  it('공유가 다른 이유로 실패하면 복사로 넘어가고, 복사도 안 되면 실패다', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new Error('boom')),
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) },
    })
    await expect(shareInviteLink(data)).resolves.toBe('failed')
  })
})
