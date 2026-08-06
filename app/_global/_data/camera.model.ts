/**
 * 카메라·사진 권한이 이미 거부된 상태. `useCamera`가 촬영을 시도하기 전에 던진다.
 *
 * 다른 촬영 실패와 구분해야 하는 이유는 되돌리는 방법이 다르기 때문이다 — 한 번 거부하면
 * iOS는 권한 팝업을 다시 띄우지 않으므로(CameraPlugin.swift가 요청 없이 즉시 reject한다)
 * 재시도 버튼이 아니라 OS 설정 화면으로 보내야 한다.
 */
export class CameraPermissionDeniedError extends Error {
  constructor(readonly kind: CameraPermissionKind) {
    super(`${kind} permission denied`)
    this.name = 'CameraPermissionDeniedError'
  }
}

export type CameraPermissionKind = 'camera' | 'photos'
