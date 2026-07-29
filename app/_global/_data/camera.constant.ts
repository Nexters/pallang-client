/* eslint-disable @typescript-eslint/no-deprecated --
 * getPhoto의 카메라/앨범 선택 프롬프트(CameraSource.Prompt) 동작은 신규 takePhoto/chooseFromGallery API로
 * 대체되지 않아 이 파일 전체에서 구버전 타입을 의도적으로 사용한다.
 */
import { CameraResultType, CameraSource, type ImageOptions } from '@capacitor/camera'

export const CAMERA_OPTIONS: ImageOptions = {
  source: CameraSource.Prompt, // 카메라/앨범 선택 프롬프트
  // Uri로 받으면 webPath가 capacitor://localhost/... 인데, 이 앱은 원격 URL을 로드하므로
  // 웹뷰 오리진과 교차 오리진이 되어 fetch가 막힌다. 브릿지로 바로 데이터를 받는다.
  resultType: CameraResultType.DataUrl,
  quality: 90,
  // 원본은 4032px까지 나온다. 브릿지로 실어 나르고 업로드까지 해야 하니 줄인다.
  // 책 한 쪽 기준 1600px면 OCR 인식에 충분하다.
  width: 1600,
}
