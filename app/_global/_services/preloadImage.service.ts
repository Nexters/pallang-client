import { getImageProps } from 'next/image'
import { preload } from 'react-dom'

type PreloadImageInput = { src: string; width: number; height: number }

// 열림·판정 시점에야 마운트되는 일러스트를 미리 받아 팝인을 막는다.
// 실제 <Image>가 만들 optimizer srcset을 getImageProps로 그대로 계산해야 한다 —
// 임의 URL을 preload하면 w·q 파라미터가 달라 재사용되지 않는다.
// 호출부의 width·height는 렌더하는 <Image>와 반드시 일치시킬 것(상수 공유).
export function preloadImage({ src, width, height }: PreloadImageInput): void {
  const { props } = getImageProps({ alt: '', src, width, height })
  preload(props.src, { as: 'image', fetchPriority: 'low', imageSrcSet: props.srcSet })
}
