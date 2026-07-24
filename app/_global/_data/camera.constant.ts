/* eslint-disable @typescript-eslint/no-deprecated --
 * getPhoto의 카메라/앨범 선택 프롬프트(CameraSource.Prompt) 동작은 신규 takePhoto/chooseFromGallery API로
 * 대체되지 않아 이 파일 전체에서 구버전 타입을 의도적으로 사용한다.
 */
import { CameraResultType, CameraSource, type ImageOptions } from '@capacitor/camera'

export const CAMERA_OPTIONS: ImageOptions = {
  source: CameraSource.Prompt, // 카메라/앨범 선택 프롬프트
  resultType: CameraResultType.Uri,
  quality: 90,
}
