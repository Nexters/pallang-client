# 카메라·사진 권한을 한 번 거부한 사용자 되돌리기

## 배경

PR #185에서 `Info.plist`의 `NSPhotoLibraryAddUsageDescription` 누락을 고쳐 iOS 카메라가 열리게 했지만, 기기 검증에서 다른 증상이 남았다 — **권한을 한 번 거부하면 그 뒤로는 권한 창이 다시 뜨지 않고 촬영도 되지 않는다.**

원인은 OS 정책이다.

- `node_modules/@capacitor/camera/ios/Sources/CameraPlugin/CameraPlugin.swift:513` — `showCamera()`가 `AVCaptureDevice.authorizationStatus`를 먼저 확인하고, `.denied`/`.restricted`면 **요청 없이 즉시** `call.reject("User denied access to camera")` 한다. `requestAccess`를 불러도 iOS는 두 번째 팝업을 띄우지 않는다.
- 사진 권한도 같다 — `showPhotos()`가 `"User denied access to photos"`로 똑같이 즉시 reject한다(같은 파일 533행).
- Android는 2회 거부 후 `PermissionState.DENIED`가 되어 같은 상태에 들어간다.

우리 코드는 이 reject를 다른 실패와 구분하지 않는다. `useCamera.ts:43`이 "cancel이 아니면 전부 throw"로 넘기고, `OcrSelector.tsx:66`이 "카메라를 열지 못했어요"만 보여준다. 사용자는 무엇이 잘못됐는지도, 어떻게 풀지도 알 수 없다. 실패 시 대안으로 제시하는 "갤러리에서 선택하기"조차 사진 권한이 거부돼 있으면 아무 반응 없이 실패한다.

**앱에서 권한 팝업을 다시 띄울 방법은 없다.** 되돌릴 유일한 경로는 OS 설정 화면으로 보내는 것이다.

## 목표

카메라·사진 권한이 거부된 상태를 감지해 사용자에게 설명하고, OS 설정의 앱 권한 화면을 한 번의 탭으로 열어준다. 카메라를 쓰는 세 호출부 중 사용자 대면 두 곳(`OcrSelector`, `ProfileSettingsContent`)에 적용한다.

명시적 비목표: 시스템 팝업 이전의 사전 안내(프라이밍) 화면은 이번 범위가 아니다.

## 설계

### 1. 설정 열기 — 자체 플러그인

**기성 플러그인(`capacitor-native-settings`)을 쓰지 않는다.** 그 플러그인의 iOS 구현은 특정 설정 화면으로 뛰는 `App-prefs:` 계열 비공개 URL 스킴 문자열을 **31개** 딕셔너리로 들고 있다(`NativeSettings.swift:18`). 우리는 그중 하나도 호출하지 않지만 문자열 리터럴은 호출 여부와 무관하게 바이너리에 남고, 애플 심사의 정적 검사에 걸릴 수 있다(가이드라인 2.5.1 — 비공개 API). 플러그인 문서 자체가 이를 경고한다. 우리가 필요한 건 함수 하나뿐이라 회피 비용이 낮아 직접 만든다.

플랫폼마다 가장 확실한 방식을 쓴다. 둘 다 jsName이 `AppSettings`, 메서드가 `openSettings`라 웹에서는 하나의 API로 보인다.

- **iOS** — `native-plugins/app-settings/` 로컬 Capacitor 패키지. `native-plugins/kakao-login`과 같은 구조이고 `cap sync`가 `CapApp-SPM/Package.swift`에 배선한다. `UIApplication.openSettingsURLString` **하나만** 쓴다 — 애플이 공식 허용하는 유일한 설정 딥링크다.
  - 앱 타겟(`AppDelegate.swift`)에 넣지 않는 이유: Capacitor가 생성·관리하는 파일이라 `ios/` 재생성 시 편집이 날아간다(kakao-login이 같은 이유로 패키지를 쓴다).
- **Android** — 앱 모듈의 `AppSettingsPlugin.java` + `MainActivity`의 `registerPlugin`. `ACTION_APPLICATION_DETAILS_SETTINGS` 인텐트를 띄운다. gradle 모듈을 새로 얹지 않아도 되는 표준 방식이라 iOS와 달리 별도 패키지를 만들지 않는다.

화면 코드는 플러그인을 직접 부르지 않고 래퍼를 거친다.

**`app/_global/_services/appSettings.service.ts`**

```ts
export async function openAppSettings(): Promise<void>
```

- `registerPlugin<AppSettingsPlugin>('AppSettings', { web: ... })`로 네이티브 구현에 붙는다.
- 네이티브가 아니면 no-op — 웹에는 열 설정 화면이 없다.
- 설정을 못 열어도 예외를 밖으로 흘리지 않는다. 안내 화면이 남아 사용자가 직접 찾아갈 수 있다.

### 2. 거부 상태 감지 — `useCamera`

**`app/_global/_data/camera.model.ts`**

```ts
export class CameraPermissionDeniedError extends Error {
  constructor(readonly kind: 'camera' | 'photos')
}
```

`takePhoto`는 네이티브에서 `Camera.getPhoto`를 부르기 **전에** `Camera.checkPermissions()`로 상태를 본다. `source === 'camera'`면 `camera` 상태를, `'gallery'`면 `photos` 상태를 본다.

| 상태                               | 동작                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `granted` · `limited`              | 그대로 진행                                                     |
| `prompt` · `prompt-with-rationale` | 그대로 진행 — 플러그인이 OS 팝업을 띄운다                       |
| `denied`                           | `getPhoto`를 부르지 않고 `CameraPermissionDeniedError`를 던진다 |

`limited`(iOS 14+ 제한 접근)는 사용 가능한 상태다. 막지 않는다.

웹에서는 `Camera.checkPermissions()`가 `unavailable`을 던지므로, 검사는 기존 `Capacitor.isNativePlatform()` 분기 안쪽에만 둔다.

**팝업 직후의 거부는 이 경로에 넣지 않는다.** 사용자가 방금 "허용 안 함"을 누른 직후 "설정으로 가세요"를 들이미는 것은 무례하다. 그 경우는 지금처럼 일반 실패 문구로 두고, 상태가 `denied`로 바뀐 **다음 시도부터** 설정 안내가 뜬다. 호출 전 검사만으로 이 구분이 별도 상태 없이 나온다.

### 3. 화면

**`OcrSelector`** — 기존 실패 패널과 같은 자리에 안내를 그린다. 카메라가 열리지 않아 화면이 비어 있는 상황이라, 그 위에 모달을 또 얹으면 막이 두 겹이 된다.

- `permissionBlocked: 'camera' | 'photos' | null` 상태를 `failure`와 별도로 둔다.
- 카메라 거부: `[설정 열기]` + `[갤러리에서 선택하기]`
- 갤러리까지 거부: `[설정 열기]`만 — 누를 수 없는 버튼을 남기지 않는다.

**`ProfileSettingsContent`** — 화면을 실패로 덮을 수 없으므로 `_components/Dialog`(중앙 모달)를 쓴다. `handleEditImage`의 catch에서 `CameraPermissionDeniedError`면 스낵바 대신 Dialog를 연다. `[닫기]` / `[설정 열기]`.

`camera-check`는 개발용 확인 페이지라 손대지 않는다.

### 4. 설정에서 켜고 돌아왔을 때

- **iOS**: 권한을 바꾸면 OS가 앱을 종료시킨다. 재시작 뒤 사용자가 다시 진입하는 수밖에 없어 자동 재시도 대상이 아니다.
- **Android**: 프로세스가 유지된다. `OcrSelector`가 `permissionBlocked !== null`일 때만 `App.addListener('appStateChange')`를 걸어, 활성 복귀 시 권한을 재확인하고 풀렸으면 촬영을 자동 재시도한다.
- 프로필 화면은 Dialog를 닫으면 편집 버튼이 그대로 남아 재시도가 자명하다. 리스너를 걸지 않는다.

## 테스트

- `useCamera.spec.ts` — `denied`면 `getPhoto`가 호출되지 않고 `CameraPermissionDeniedError`가 나온다 / `prompt`·`granted`·`limited`면 호출된다 / `gallery`는 `photos` 상태를 본다 / 웹에서는 `checkPermissions`를 부르지 않는다.
- `appSettings.spec.ts` — 네이티브에서만 설정을 열고, 실패해도 예외를 흘리지 않는다.
- `ocrPermission.spec.tsx` — 카메라 거부 시 `[설정 열기]`가 뜨고 누르면 `openAppSettings`가 불린다 / 사진까지 거부면 갤러리 버튼이 없다 / 복귀(`appStateChange`)에 재시도한다.
- `photoPermission.spec.tsx` — 사진 권한 거부 시 Dialog가 뜬다.

## 검증

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

네이티브 코드가 추가되므로 빌드도 확인한다.

- **iOS**: `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
  - 링크 결과 확인: `nm -gU <App.app>/App.debug.dylib | grep AppSettingsPlugin` (심볼이 있어야 함)
  - 비공개 스킴 잔존 확인: `strings -a <App.app>/App.debug.dylib | grep -c "App-prefs"` → **0**
- **Android**: JDK 21이 필요하다. 이 작업 시점 환경에 JDK가 없어 컴파일 검증을 하지 못했다 — Android 빌드 시 `AppSettingsPlugin.java`와 `MainActivity`의 `registerPlugin`을 먼저 확인할 것.

기기 확인 절차: 권한을 거부한 상태로 흔적 작성 → 안내 화면 → `[설정 열기]` → 권한 허용 → (Android) 복귀 시 자동 촬영 / (iOS) 앱 재시작 후 재진입.
