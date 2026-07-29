/* eslint-disable @typescript-eslint/no-deprecated --
 * source를 지정해 촬영/앨범을 나누는 동작은 신규 takePhoto/chooseFromGallery API로 완전히
 * 대체되지 않아 이 파일 전체에서 구버전 getPhoto 타입을 의도적으로 사용한다.
 */
import { CameraResultType, CameraSource, type ImageOptions } from '@capacitor/camera'

const SHARED_OPTIONS = {
  // Uri로 받으면 webPath가 capacitor://localhost/... 인데, 이 앱은 원격 URL을 로드하므로
  // 웹뷰 오리진과 교차 오리진이 되어 fetch가 막힌다. 브릿지로 바로 데이터를 받는다.
  resultType: CameraResultType.DataUrl,
  quality: 90,
  // 원본은 4032px까지 나온다. 브릿지로 실어 나르고 업로드까지 해야 하니 줄인다.
  // 책 한 쪽 기준 1600px면 OCR 인식에 충분하다.
  width: 1600,
} satisfies ImageOptions

/** 사진으로 입력을 고르면 곧바로 촬영으로 간다 — 카메라/앨범을 한 번 더 묻지 않는다. */
export const CAMERA_OPTIONS: ImageOptions = {
  ...SHARED_OPTIONS,
  source: CameraSource.Camera,
}

/** 촬영이 실패했을 때의 대안 경로. */
export const GALLERY_OPTIONS: ImageOptions = {
  ...SHARED_OPTIONS,
  source: CameraSource.Photos,
}
