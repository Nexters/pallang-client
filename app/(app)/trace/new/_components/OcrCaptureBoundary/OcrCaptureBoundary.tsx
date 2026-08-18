'use client'

import { useState } from 'react'

import { useTraceNav } from '../../_hooks/useTraceNav'
import { OcrSelector } from '../OcrSelector/OcrSelector'

/**
 * 사진 단계에 들어설 때마다 촬영 한 판을 새로 시작하게 한다.
 *
 * Next는 다음 단계로 넘어가도 화면을 언마운트하지 않고 <Activity>로 감춰 두었다가 되살린다
 * (Cache Components). 그래서 되살아난 사진 화면은 지난 판의 사진·인식 결과·선택을 그대로 들고
 * 있고, '이미 촬영을 시작했다'는 표시(OcrSelector의 started)까지 남아 방식 선택 화면이 새로
 * 맡긴 촬영을 꺼내지 않는다 — 방금 찍은 사진이 조용히 버려진다. 게다가 감춰질 때 blob URL이
 * 해제되므로 남아 있는 사진은 이미 죽은 주소다.
 *
 * 방문마다 다른 key를 주어 화면을 통째로 새로 마운트한다. 상태를 하나씩 되돌리지 않으므로
 * 나중에 촬영 한 판의 상태가 늘어도 새 판은 새 판으로 남는다. 촬영을 한 번만 시작하게 막는
 * started는 인스턴스마다 새로 생기는 ref라, 마운트가 갈리면 StrictMode의
 * mount→cleanup→remount에도 카메라가 두 번 열리지 않는다(OcrSelector 주석 참고).
 */
export function OcrCaptureBoundary() {
  const { step } = useTraceNav()
  const isCurrentStep = step === 'photo'
  const [visit, setVisit] = useState({ count: 0, wasCurrentStep: isCurrentStep })

  if (visit.wasCurrentStep !== isCurrentStep) {
    // 번호는 들어설 때만 올린다. 떠날 때 올리면 감춰진 채로 한 판이 헛돌아, 정작 되살아날 때는
    // 이미 시작해 둔 판이 되어 새로 맡긴 촬영을 또 놓친다.
    setVisit({
      count: isCurrentStep ? visit.count + 1 : visit.count,
      wasCurrentStep: isCurrentStep,
    })
  }

  return <OcrSelector key={visit.count} />
}
