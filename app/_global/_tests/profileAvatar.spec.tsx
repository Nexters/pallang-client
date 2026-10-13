import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProfileAvatar } from '../_components/ProfileAvatar/ProfileAvatar'

const FALLBACK = '/images/profile-character-orange.webp'
const KAKAO = 'https://k.kakaocdn.net/dn/expired/profile.jpg'

/** 닉네임이 옆에 서므로 그림은 장식이다 — 이름이 없어 alt로는 못 찾는다 */
function avatar() {
  const image = screen.getByRole('presentation', { hidden: true })
  if (!(image instanceof HTMLImageElement)) throw new Error('프로필 사진을 찾지 못했다')
  return image
}

describe('프로필 사진', () => {
  it('사진이 없으면 기본 캐릭터가 대신 선다', () => {
    render(<ProfileAvatar size={24} src={null} />)

    expect(avatar()).toHaveAttribute('src', FALLBACK)
  })

  // 카카오 CDN URL은 만료된다 — 그대로 두면 웹뷰가 깨진 이미지 표시를 낸다
  it('사진을 불러오지 못하면 기본 캐릭터로 떨어진다', () => {
    render(<ProfileAvatar size={24} src={KAKAO} />)
    expect(avatar()).toHaveAttribute('src', KAKAO)

    fireEvent.error(avatar())

    expect(avatar()).toHaveAttribute('src', FALLBACK)
  })

  it('기본 캐릭터까지 실패해도 원래 URL로 되돌아가지 않는다', () => {
    render(<ProfileAvatar size={24} src={KAKAO} />)
    fireEvent.error(avatar())

    // 여기서 원래 URL로 돌아가면 두 src를 오가며 무한히 돈다
    fireEvent.error(avatar())

    expect(avatar()).toHaveAttribute('src', FALLBACK)
  })
})
