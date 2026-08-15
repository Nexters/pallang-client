import { cn } from '@/app/_global/_services/cn.service'

import { GRID_PAPER_SIZE } from '../../_data/stage.constant'
import styles from '../QuoteStage/QuoteStage.module.css'

/** 무대 뒤에 깔리는 배경 아트 — 크림 면 · 모눈종이 · 그 아래 어두운 면 세 겹.
    책 표지가 아니라 화면마다 같은 정적 그림이라 대목이 바뀌어도 그대로다(디자인 200:939).
    좌표는 스테이지 좌표계를 그대로 따르므로 QuoteStage.module.css를 함께 읽는다. */
export function QuoteStageBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-bg-book-card" />
      {/* 모눈종이 — 아래로 갈수록 배경색으로 걷힌다 */}
      <div className={cn(styles['paper'], 'absolute inset-x-0 top-0 overflow-hidden')}>
        <div className="absolute inset-0 bg-neutral-200" />
        {/* eslint-disable-next-line @next/next/no-img-element -- 고정 크기 정적 배경이라 next/image의 최적화가 붙을 자리가 없다 */}
        <img
          src="/images/trace-grid-paper.png"
          alt=""
          className={cn('absolute top-1/2 left-1/2 max-w-none -translate-1/2', GRID_PAPER_SIZE)}
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-neutral-200" />
      </div>
      {/* 모눈종이 아래는 목록과 같은 어두운 면이고, 카드가 그 경계에 걸쳐 놓인다 */}
      <div className={cn(styles['underlay'], 'absolute inset-x-0 bottom-0 bg-bg-dark')} />
    </>
  )
}
