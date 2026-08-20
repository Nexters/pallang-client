import { cn } from '@/app/_global/_services/cn.service'

/** 프로필 이미지를 올리지 않은 사람 자리에 서는 기본 캐릭터 — 주황 배경까지 그림에 들어 있다 */
const FALLBACK_SRC = '/images/profile-character-orange.webp'

type ProfileAvatarProps = {
  /** 서버가 준 프로필 이미지. 없으면(null·undefined) 기본 캐릭터가 대신 선다 */
  src?: string | null
  /** 지름(px). 시안마다 다르므로 Tailwind 클래스가 아니라 값으로 받는다 */
  size: number
  className?: string
}

/**
 * 동그란 프로필 사진.
 *
 * 옆에 닉네임이 함께 서는 자리에만 쓰므로 그림은 장식으로 둔다(`alt=""`) —
 * 이름을 다시 읽어 주면 보조기기에서 같은 사람이 두 번 불린다.
 *
 * next/image를 쓰지 않는다 — 올린 사진은 도메인이 유동적이고(카카오 CDN 등, 기존 프로필
 * 자리들이 이미 같은 이유로 img를 쓴다), 기본 캐릭터는 크기가 고정된 작은 정적 파일이라
 * 최적화가 붙을 자리가 없다.
 */
export function ProfileAvatar({ src, size, className }: ProfileAvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 위 주석 참고(도메인 유동·고정 크기)
    <img
      src={src ?? FALLBACK_SRC}
      alt=""
      width={size}
      height={size}
      decoding="async"
      style={{ width: size, height: size }}
      className={cn('shrink-0 rounded-full object-cover', className)}
    />
  )
}
