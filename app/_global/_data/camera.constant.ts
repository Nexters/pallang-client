/* eslint-disable @typescript-eslint/no-deprecated --
 * source를 지정해 촬영/앨범을 나누는 동작은 신규 takePhoto/chooseFromGallery API로 완전히
 * 대체되지 않아 이 파일 전체에서 구버전 getPhoto 타입을 의도적으로 사용한다.
 */
import { CameraResultType, CameraSource, type ImageOptions } from '@capacitor/camera'

const SHARED_OPTIONS = {
  // Uri로 받으면 webPath가 capacitor://localhost/... 인데, 이 앱은 원격 URL을 로드하므로
  // 웹뷰 오리진과 교차 오리진이 되어 fetch가 막힌다. 브릿지로 바로 데이터를 받는다.
  resultType: CameraResultType.DataUrl,
  // 축소를 끈 만큼 dataUrl이 커진다. 품질은 플러그인 기본값으로 두어 브릿지 부담을 묶는다
  // (뒤에서 2400px로 줄이며 재인코딩하므로 여기서 더 올려도 OCR에 남는 이득이 거의 없다).
  quality: 90,
  // width/height를 주지 않는다 = 네이티브 축소를 끈다.
  // Capacitor Android는 Bitmap.createScaledBitmap(..., filter=false)로 줄여서(ImageUtils.java)
  // 보간 없이 픽셀을 솎아낸다 — 본문 글자 획이 끊겨 인식률이 크게 떨어진다.
  // 대신 원본을 받아 웹에서 보간을 켜고 줄인다(photoResize.service).
  // 그 대가로 브릿지에 원본 크기 dataUrl이 실린다(12MP 기준 수 MB).
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
