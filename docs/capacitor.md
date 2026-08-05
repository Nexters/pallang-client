# Capacitor 운영/검증 노트 (iOS · Android Runbook)

이 앱은 **Capacitor 셸이 원격 URL(배포된 Next.js 웹)을 WebView로 로드**하고, 네이티브 기능은 **카메라**와 **Android 하드웨어 back 인터셉트**만 쓴다. 설계 배경은 [specs/2026-07-24-capacitor-camera-webview-design.md](./superpowers/specs/2026-07-24-capacitor-camera-webview-design.md).

## 쓰는 플러그인

| 플러그인                             | 용도                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `@capacitor/camera`                  | 대목 사진 촬영 (함정 3 참고 — 경로가 아니라 `DataUrl`로 받는다)              |
| `@capacitor/app`                     | Android 하드웨어 back·엣지 스와이프 인터셉트(`HardwareBackProvider`, 함정 6) |
| `@capacitor/preferences`             | 토큰 저장                                                                    |
| `@capacitor/splash-screen`           | 인증 판정 전 깜빡임 방지                                                     |
| `@capacitor-community/apple-sign-in` | 애플 로그인 (iOS 네이티브 시트 — 웹 미제공, 버튼도 iOS 앱에서만 노출)        |

- 플러그인을 추가하면 `npx cap sync` 후 **앱 재설치**가 필요하다(아래 표의 "네이티브 변경").
- `@capacitor/app`의 `backButton` 리스너는 **네이티브에서만**, 그리고 **앱 전체에서 하나만** 붙인다(`HardwareBackProvider`). 브라우저에서는 `Capacitor.isNativePlatform()`이 `false`라 리스너를 걸지 않고, 브라우저 back이 그대로 동작한다.

아래는 **실제 구현·기기 검증에서 확인된 함정들**이다. 다시 겪으면 시간을 크게 날리므로 먼저 읽을 것. (함정 1·3은 iOS·Android 공통, 함정 2는 iOS 전용, Android는 아래 별도 섹션.)

## ⚠️ 함정 1 — Next.js `dev` 서버는 WKWebView에서 하이드레이션이 안 됨

- 증상: 앱(iOS WebView)에서 페이지는 뜨지만 **버튼/이벤트 무반응**, `Capacitor.isNativePlatform()`이 `false`(`platform: web`)로 나옴. **에러 로그도 안 남음(조용히 실패).**
- 원인: `next dev`(Turbopack HMR) 번들이 WKWebView에서 **클라이언트 하이드레이션이 조용히 실패**한다. 인라인 스크립트·네이티브 브릿지(`window.Capacitor`)는 정상이고, **일반 브라우저에선 잘 된다.** dev 청크 로딩 방식이 WKWebView와 안 맞는 것.
- **해결: 웹뷰/기기 테스트는 반드시 프로덕션 빌드로 한다.**
  ```bash
  pnpm build
  PORT=3000 pnpm start          # LAN에 노출됨(0.0.0.0)
  ```
  그러면 웹뷰에서 하이드레이션 정상 → `native: true / platform: ios` → 카메라 동작.
- 참고: 이건 원래 의도한 배포 아키텍처(실서비스는 배포된 프로덕션을 로드)와 일치한다. **화면/로직 개발은 브라우저(`pnpm dev`)로, 네이티브 기능 확인은 prod 빌드(또는 배포 URL)를 앱으로** 여는 워크플로를 쓴다.

## ⚠️ 함정 2 — Xcode(26) GUI로 프로젝트를 열면 pbxproj가 손상됨 → `Undefined symbol: _main`

- 증상: device 빌드가 `Undefined symbol: _main` / `Linker command failed`로 실패(시뮬레이터는 되는데 device만 실패하기도 함).
- 원인: Capacitor iOS 템플릿의 `App.xcodeproj`는 아주 오래된 포맷(`CreatedOnToolsVersion 9.2`, `objectVersion 60`). 이걸 **Xcode 26 GUI로 열면 마이그레이션하다 App 소스 그룹/Sources 빌드 페이즈를 날려서** `AppDelegate.swift`가 어느 타겟에서도 컴파일되지 않게 됨 → `@UIApplicationMain`의 `main` 심볼이 안 생김.
- **해결: iOS 프로젝트를 재생성**하고, 이후 **Xcode GUI로 열지 말고 CLI로 빌드/설치**한다.
  ```bash
  rm -rf ios && npx cap add ios
  # 그리고 Info.plist 권한/ATS, DEVELOPMENT_TEAM 재적용(아래 참고)
  ```
  - 재생성 후 `ios/App/App.xcodeproj/project.pbxproj`의 Sources 페이즈에 `AppDelegate.swift`가 있는지 확인(정상이면 크기 ~14KB, 손상되면 ~10KB).

## ⚠️ 함정 3 — 네이티브가 준 파일 경로(`capacitor://localhost/...`)는 `fetch`로 못 읽음

- 증상: 카메라는 정상적으로 열리고 촬영도 되는데 **업로드가 안 됨**. 이미지 표시는 되는데 바이트를 읽으려 하면 실패. 기기 콘솔에 `fetch` 실패만 남는다.
- 원인: 이 앱은 번들 에셋이 아니라 **원격 URL(`server.url`)을 로드**한다. 그래서 웹뷰 오리진은 배포 도메인인데, `convertFileSrc`가 만드는 경로는 항상 Capacitor의 `localURL` 기준이라 `capacitor://localhost/_capacitor_file_/...`가 된다. 둘이 **교차 오리진**이라 `fetch`/XHR이 차단된다.
  - `window.WEBVIEW_SERVER_URL = <localURL>`이 문서 시작 시 주입되고(`JSExport.swift`), `convertFileSrc`는 이 값으로만 경로를 만든다(`native-bridge.js`). 페이지가 어디서 로드됐는지는 보지 않는다.
  - Capacitor는 이 상태를 "라이브 리로드"로 간주한다(`WebViewAssetHandler.isUsingLiveReload` — `serverUrl`과 `localUrl`의 스킴이 다른 경우). 원래 개발용 임시 상태를 상정한 모드인데, **이 앱은 그걸 배포 아키텍처로 쓰므로 상시 해당된다.**
  - **`<img src={webPath}>`는 잘 뜬다.** 이미지 렌더링은 CORS 대상이 아니다. Capacitor 공식 예제가 이 형태라 이 함정을 안 만나고 지나가기 쉽다. **바이트를 읽을 때만** 터진다.
- **해결: 파일 경로를 받지 말고 브릿지로 데이터를 직접 받는다.** `resultType: CameraResultType.DataUrl` → `data:` URL이라 오리진 제약이 없다.
  - 원본은 4032px까지 나오지만 **`width`/`height`로 네이티브 축소를 걸지 않는다**(함정 5 참고). 대신 웹에서 줄인다.
  - **화면에 띄우는 이미지와 업로드하는 이미지가 같아야 한다.** OCR 바운딩 박스 좌표가 업로드한 이미지 기준이라, 다른 이미지를 표시하면 선택 영역이 어긋난다. 같은 blob을 `URL.createObjectURL`로 달아 쓴다.
- 같은 이유로 `@capacitor/filesystem` 등 **파일 경로를 돌려주는 다른 플러그인도 동일한 함정**을 갖는다. 원격 URL 로드를 유지하는 한 경로가 아니라 데이터로 받아야 한다.
- 브라우저(`pnpm dev`)에서는 `<input type="file">` 경로를 타므로 **재현되지 않는다.** 실기기에서 끝까지 태워봐야 드러난다.

## ⚠️ 함정 4 — `server.url`에 경로를 넣으면 full-page 내비게이션이 Safari로 튕김

- 증상: 앱은 멀쩡히 도는데 **카카오 로그인을 누르면 시스템 브라우저(Safari)가 열리고**, 로그인해도 콜백이 Safari에 떨어져 앱으로 돌아오지 못한다.
- 원인: Capacitor iOS는 내부/외부 내비게이션을 `serverURL` **절대 URL 문자열 prefix**로 판정한다(`WebViewDelegationHandler.swift`의 `isApplicationNavigation`). `server.url`이 `http://IP:3000/camera-check`처럼 경로를 포함하면, `/api/auth/kakao/login` 등 **그 경로로 시작하지 않는 같은 오리진 URL조차 외부로 판정**되어 `UIApplication.open`(Safari)으로 넘어간다.
- Next의 클라이언트 라우팅(SPA 전환)은 이 판정을 타지 않아서 평소엔 정상으로 보인다. `window.location.assign` 같은 **full-page 내비게이션에서만** 터져서 발견이 늦는다.
- **해결: `CAP_SERVER_URL`은 항상 origin까지만.** `scripts/cap-dev.sh`가 origin만 굽도록 되어 있다(경로 인자 제거됨).

## ⚠️ 함정 5 — `Camera.getPhoto`의 `width` 축소가 글자를 뭉갠다 (OCR 인식률 저하)

- 증상: 앱 카메라로 찍은 사진의 OCR 정확도가 **갤러리에서 고른 사진보다 눈에 띄게 낮다.** 사진은 멀쩡해 보이는데 인식만 안 된다.
- 원인: Capacitor Android는 `ImageOptions.width`가 있으면 `Bitmap.createScaledBitmap(bitmap, w, h, false)`로 줄인다(`ImageUtils.java:53`). **마지막 인자가 필터 플래그이고 `false`** — 보간 없이 픽셀을 솎아내는 축소라, 4032 → 1600처럼 절반 이하로 줄이면 본문 글자의 얇은 획이 통째로 사라지거나 계단이 진다. iOS는 CoreGraphics 보간을 쓰므로 덜하지만 손실은 마찬가지다.
  - 촬영·갤러리 **양쪽 다 같은 축소를 거치는데도** 차이가 나는 건 원본 화질이 달라서다. 갤러리 사진은 기본 카메라 앱이 다중 프레임 합성·샤프닝까지 끝낸 결과이고, 앱 안 촬영은 `UIImagePickerController`/`ACTION_IMAGE_CAPTURE`의 기본 촬영이라 더 무르다. 무른 원본일수록 축소 손실에 먼저 무너진다.
- **해결: 네이티브 축소를 끄고(width/height 미지정) 웹에서 줄인다.** `photoResize.service.ts`가 `imageSmoothingQuality: 'high'`로 긴 변 2400px까지 줄이고(2배 넘게 줄일 땐 반씩 나눠 내림) JPEG 0.92로 다시 굽는다. 촬영·갤러리·브라우저 파일선택이 전부 같은 경로를 타서 OCR 입력이 하나로 묶인다.
- **대가: 브릿지에 원본 크기 dataUrl이 실린다**(12MP 기준 수 MB). 촬영 직후 한 번뿐이고 스캔 오버레이가 떠 있는 구간이라 감수한다. 더 줄여야 하면 `OCR_MAX_EDGE`를 낮추지 말고(인식률 직결) 촬영 UI 자체를 문서 스캐너(iOS VisionKit / Android ML Kit)로 바꾸는 쪽이 이득이 크다.

## ⚠️ 함정 6 — (Android) 엣지 스와이프 뒤로가기가 완전히 무반응

- 증상: iOS는 스와이프 백이 되는데 **Android만 아무 반응이 없다.** 앱이 닫히지도, 뒤로 가지도 않는다.
- 원인: 두 플랫폼의 처리 경로가 아예 다르다.
  - iOS는 `allowsBackForwardNavigationGestures`(WKWebView 자체 기능)라 웹뷰가 제스처를 직접 받아 자기 히스토리를 걷는다. Capacitor도 JS도 개입하지 않는다.
  - Android의 엣지 스와이프는 **시스템 back**이라 액티비티로 간다. 그런데 Capacitor 8의 `BridgeActivity`/`Bridge`에는 back 처리가 없고, `@capacitor/app` 플러그인만 `OnBackPressedCallback`을 **`enabled=true`로** 등록해 back을 먹는다(`AppPlugin.java:46`). 그 핸들러는 `canGoBack()`이 참일 때만 되감고 **거짓이면 아무 것도 하지 않는다** — 시스템 기본 동작(액티비티 종료)까지 막혀서 무반응이 된다.
  - 게다가 JS가 `backButton` 리스너를 하나라도 붙이면 네이티브 되감기는 통째로 꺼지고 JS 통보만 간다.
- **해결: 앱 전체에서 리스너를 하나만 붙이고 되감기·종료까지 직접 처리한다.** `HardwareBackProvider`가 그 하나를 맡고, 화면은 `useHardwareBack`으로 스택에 핸들러를 등록한다(나중에 등록한 층이 우선). 아무도 안 가져가면 `canGoBack`이면 `history.back()`, 아니면 `App.exitApp()`.
- 브라우저에서는 리스너를 붙이지 않는다 — 브라우저 back이 그대로 동작해야 한다.

## dev 서버 URL 자동화 (`scripts/cap-dev.sh`)

로컬 dev 서버를 앱이 로드하려면 `CAP_SERVER_URL`에 맥의 **LAN IP**가 필요한데, 이 IP는 **와이파이/네트워크가 바뀌면 달라진다.** `capacitor.config.ts`는 `process.env.CAP_SERVER_URL`을 읽으므로, IP를 앱에 하드코딩하지 않고 스크립트가 매 실행마다 현재 IP를 감지해 sync 한다.

```bash
# 다른 터미널: 웹 서버 (기기 검증은 prod 권장)
pnpm build && PORT=3000 pnpm start

# iOS 실기기/시뮬레이터 — 현재 IP 자동 감지 → sync → 실행
pnpm cap:dev:ios
# Android 에뮬레이터 (호스트는 10.0.2.2 자동 사용)
pnpm cap:dev:android
# 빌드/실행 없이 sync만 (URL만 갱신하고 앱에서 새로고침)
pnpm cap:dev:sync
```

- ⚠️ **`CAP_SERVER_URL`에는 경로를 넣지 않는다(origin만).** 함정 4 참고. 특정 화면 확인은 앱 안에서 이동한다.

### IP가 바뀌면? 케이블은 언제 필요한가?

`server.url`은 **빌드 시 앱에 구워진다.** 그래서:

| 상황                                           | 필요한 조치                                | 케이블         |
| ---------------------------------------------- | ------------------------------------------ | -------------- |
| **웹만 수정 + IP 그대로**                      | 앱에서 당겨서 새로고침 (라이브)            | ❌             |
| **IP 바뀜** (네트워크 변경)                    | `pnpm cap:dev:*` 다시 실행 → 재빌드·재설치 | ✅ (재설치 시) |
| **네이티브 변경** (권한/플러그인/`server.url`) | 재빌드·재설치                              | ✅             |

- **웹뷰 앱이라 웹 변경엔 케이블이 필요 없다.** 케이블은 **네이티브 재설치(=IP 변경 포함)** 때만.
- 무선 설치를 원하면 최초 1회 케이블로 "네트워크를 통해 연결"을 켜면 이후 무선 가능.
- **배포(프로덕션)에선 이 문제가 없다** — `server.url`이 고정 https 도메인이라 IP와 무관.

## 실기기(iPhone) 실행 절차 (CLI 중심, Xcode GUI 회피)

1. **웹 서버(prod)**를 LAN에 띄운다: `pnpm build && PORT=3000 pnpm start`
2. **앱이 볼 URL**을 맥의 LAN IP로 동기화(폰은 localhost 못 씀) — `pnpm cap:dev:sync`가 자동으로 해준다. 수동이면:
   ```bash
   CAP_SERVER_URL=http://<맥_LAN_IP>:3000 npx cap sync ios
   ```
3. **ATS 예외**: `ios/App/App/Info.plist`에 `NSAppTransportSecurity > NSAllowsLocalNetworking = true` (사설 IP http 허용; 인터넷 전체 개방 아님). 프로덕션 https면 불필요.
4. **카메라 권한 문구**: `Info.plist`에 `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`.
5. **서명**: `project.pbxproj`의 App 타겟 Debug/Release에 `DEVELOPMENT_TEAM = <팀ID>` (CODE_SIGN_STYLE=Automatic 옆). CLI 빌드는 `-allowProvisioningUpdates` 사용.
6. **폰 준비(한 번만)**: 설정 → 개인정보 보호 및 보안 → **개발자 모드 ON**(재시작). 무료 팀이면 첫 실행 후 설정 → 일반 → VPN 및 기기 관리에서 **개발자 프로필 신뢰**.
7. **빌드 → 설치 → 실행** (Xcode 안 엶):
   ```bash
   DEV=<devicectl UDID>   # xcrun devicectl list devices 로 확인
   xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
     -sdk iphoneos -destination 'generic/platform=iOS' -allowProvisioningUpdates \
     -derivedDataPath ./build-ios build
   APP=./build-ios/Build/Products/Debug-iphoneos/App.app
   xcrun devicectl device install app --device "$DEV" "$APP"
   xcrun devicectl device process launch --device "$DEV" kr.co.pallang.app
   ```

## 시뮬레이터 절차 (빠른 확인, 카메라는 없음)

```bash
xcrun simctl boot "iPhone 17"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath ./build-sim CODE_SIGNING_ALLOWED=NO build
xcrun simctl install booted ./build-sim/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted kr.co.pallang.app
xcrun simctl io booted screenshot out.png   # 화면 확인
```

- 시뮬레이터엔 카메라가 없어 실제 촬영은 실기기에서 확인. 셸/로드/하이드레이션 검증엔 충분.

## 세이프에어리어(노치/상태바) 대응

- `app/layout.tsx`에 `export const viewport = { viewportFit: 'cover', ... }` (이게 있어야 iOS에서 `env(safe-area-inset-*)`가 실제 값을 가짐).
- 값은 `globals.css`의 `--safe-top`/`--safe-bottom` 토큰으로만 읽는다. 화면에서 `env(safe-area-inset-*)`를 직접 쓰지 않는다(배치 규칙은 `AGENTS.md`의 Safe area 절).
- **⚠️ Android는 env()만 믿으면 안 된다.** Android 15(API 35)부터 targetSdk 35+ 앱은 창이 시스템 바 뒤까지 그려지는데(edge-to-edge 강제), **Chromium 140 미만 웹뷰는 시스템 바 인셋을 `env(safe-area-inset-*)`로 노출하지 않는다.** 하단 제스처 바가 탭바·고정 버튼을 덮어도 값이 0으로 나온다. Capacitor 8은 이 보정을 해주지 않는다(`CapacitorWebView`가 `WindowInsetsCompat`를 import만 하고 쓰지 않음).
  - 그래서 `MainActivity`가 `ViewCompat.setOnApplyWindowInsetsListener`로 실제 인셋(`systemBars | displayCutout`)을 읽어 두 CSS 변수에 덮어쓴다. 페이지가 새로 로드되면 인라인 스타일이 날아가므로 `WebViewListener.onPageLoaded`에서 다시 넣는다.
  - **API 35 미만에서는 넣지 않는다.** 창이 시스템 바를 침범하지 않아 웹뷰가 이미 인셋 안쪽이라, 값을 넣으면 두 번 밀린다.
  - 인셋은 물리 픽셀이라 `density`로 나눠 CSS px(dp)로 바꾼다. `String.format`은 `Locale.US` 고정 — 지역에 따라 소수점이 쉼표로 찍히면 CSS 값이 깨진다.

## Android 노트

iOS만큼 함정은 없다(Gradle 프로젝트라 pbxproj 손상 같은 문제 없음). **에뮬레이터에서 카메라 촬영 → 미리보기 왕복까지 실제 검증 완료.** 확인된 사항:

- **⚠️ 빌드에 JDK 21 필요**: `@capacitor/camera` 플러그인의 Gradle 툴체인이 Java 21을 요구한다. JDK 17로 빌드하면 `Cannot find a Java installation ... matching {languageVersion=21}`로 실패. 빌드 시 `JAVA_HOME`을 **JDK 21**로 지정할 것.
- **⚠️ cleartext(http) — iOS ATS의 Android판**: targetSdk 36이라 cleartext가 기본 차단된다. **프로덕션(https)은 무관**하지만, **LAN dev 서버(http) 테스트 시** 필요. `android/app/src/debug/AndroidManifest.xml`에 `usesCleartextTraffic="true"`를 두어 **디버그 빌드에만** 허용(릴리스엔 안 들어가 prod 보안 유지).
- **카메라 권한 불필요**: `@capacitor/camera`가 매니페스트(`queries` IMAGE_CAPTURE 등)를 자동 병합. `CAMERA` 권한 선언 불필요.
- **하이드레이션 정상**: Android WebView는 Chromium이라 iOS의 WKWebView 문제가 없다. 그래도 배포 아키텍처 일관성을 위해 iOS와 동일하게 **prod 빌드 권장**.

### 최초 1회 셋업 (SDK/에뮬레이터)

```bash
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools   # commandlinetools 설치 경로
# SDK 구성요소
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "emulator" \
  "system-images;android-36;google_apis;arm64-v8a"
# AVD 생성
avdmanager create avd -n pallang_test -k "system-images;android-36;google_apis;arm64-v8a" -d pixel_7
```

- **JDK 21**은 `~/jdk21`(Temurin)에 로컬 설치돼 있음. Homebrew cask는 sudo가 필요해서, tarball을 풀어 씀.
- Gradle이 SDK를 찾도록 `android/local.properties`에 `sdk.dir=$ANDROID_HOME` (git-ignored).

### APK 빌드 → 에뮬레이터 실행 → 카메라 확인 (검증된 절차)

```bash
# 1. 웹 서버(prod) — dev는 WKWebView가 아니라도 prod 권장
pnpm build && PORT=3000 pnpm start

# 2. 앱이 볼 URL을 에뮬레이터 호스트(10.0.2.2)로 동기화
CAP_SERVER_URL=http://10.0.2.2:3000 npx cap sync android

# 3. APK 빌드 (JDK 21 필수)
cd android
JAVA_HOME=~/jdk21/jdk-21*/Contents/Home ANDROID_HOME=$ANDROID_HOME ./gradlew assembleDebug
# 산출물: android/app/build/outputs/apk/debug/app-debug.apk

# 4. 에뮬레이터 실행 (직접 볼 땐 -no-window 빼기. -camera-back webcam0 = 맥 웹캠)
emulator -avd pallang_test -camera-back webcam0 -partition-size 2048 -no-snapshot

# 5. 설치 & 실행 (다른 탭)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n kr.pallang.app/.MainActivity
```

- **디스크 주의**: 에뮬레이터가 userdata에 ~7GB 요구. 부족하면 `Not enough space to create userdata partition`으로 부팅 실패 → 공간 확보 후 재시도. `config.ini`의 `disk.dataPartition.size` 축소로도 완화.
- **에뮬레이터 카메라**: `-camera-back webcam0`(맥 웹캠, 가장 현실적) / `virtualscene`(3D 가상방) / `emulated`(패턴). iOS 시뮬레이터와 달리 Android 에뮬레이터는 **카메라 촬영까지 테스트 가능**.
- 검증된 왕복: 버튼 탭 → `Camera.getPhoto {"source":"PROMPT",...}` → "Take Picture" → 웹캠 촬영 → `webPath`로 사진 반환 → `<img>` 미리보기.

## 애플 로그인 (Sign in with Apple) 네이티브 검증

- **엔티틀먼트는 파일로 관리한다** (Xcode GUI 금지 — 함정 2): `ios/App/App/App.entitlements`에 `com.apple.developer.applesignin = [Default]`가 있고, `project.pbxproj`의 App 타겟 Debug/Release `CODE_SIGN_ENTITLEMENTS = App/App.entitlements`가 이를 가리킨다. `ios/`를 재생성하면 이 두 가지를 다시 적용할 것.
- **Apple Developer 콘솔 선행 작업**: App ID(`kr.co.pallang.app`)에 "Sign In with Apple" capability 활성화. 활성화 전에는 실기기에서 자동 서명이 프로비저닝 프로파일 생성에 실패한다(`-allowProvisioningUpdates`로 빌드 시 에러 메시지에 드러남).
- **검증은 실기기 권장**: 네이티브 authorize 시트는 기기에 Apple ID가 로그인돼 있어야 뜬다. 시뮬레이터는 설정에서 Apple ID 로그인 후 가능하지만 불안정한 사례가 많다. 플로우: 로그인 화면 → "Apple로 계속하기" → 시트 → Face ID/암호 → 홈(또는 약관 동의) 진입 확인.
- **웹 브라우저에는 애플 로그인을 제공하지 않는다(정책 결정)**: 버튼이 iOS 네이티브에서만 렌더되므로 Service ID·Return URL·관련 env가 필요 없다. 웹 제공으로 바뀌면 Apple JS SDK(usePopup) 경로와 콘솔 Service ID 등록을 다시 붙인다.

## 미확정 / 배포 전 할 일

- `capacitor.config.ts`의 `appId`(`kr.co.pallang.app`)와 `PROD_SERVER_URL`(`https://pallang.co.kr`)은 실제 값으로 교체 완료. Android 패키지명(`kr.pallang.app`)은 별도 정리 예정.
- **iOS**: 시뮬레이터 + 실기기(iPhone 12 Pro) 카메라 검증 완료. **Android**: 에뮬레이터(Android 16) 카메라 검증 완료. 둘 다 실기 스토어 제출(서명·심사)은 미수행.
- **UIScene 생명주기(향후 필수화)**: 현재 Capacitor iOS 템플릿은 옛 AppDelegate 생명주기를 써서 실행 시 `UIScene lifecycle will soon be required...` 경고가 뜬다. **지금 배포엔 문제없음**(앱스토어 심사 반려 아님, 앱 정상 동작). 다만 미래 iOS에서 Scene 채택이 필수가 되면 미채택 앱은 실행 시 크래시(assert)한다. → **Capacitor 업데이트에 Scene 대응이 들어오는지 주기적으로 확인**하고, 들어오면 반영할 것. 미리 대응하려면 `SceneDelegate`를 수동 채택(Capacitor 커뮤니티에 방법 있음). 지금 당장은 조치 불필요.

## TestFlight 배포

전체 Xcode 필요. 프로젝트를 Xcode GUI로 열지 말 것(pbxproj 손상) — 아래 스크립트가 아카이브까지 CLI로 처리한다.

1. **App Store Connect 앱 생성(1회)**: appstoreconnect.apple.com → 앱 → `+` → 번들 ID `kr.co.pallang.app` 선택.
2. **아카이브**:
   ```bash
   pnpm ios:archive:dev   # dev.pallang.co.kr 을 로드하는 내부 테스트 빌드
   pnpm ios:archive       # 운영(pallang.co.kr) 빌드 — 심사 제출용
   ```
   `build-ios/export/`에 .ipa가 생성된다. 서명은 자동(팀 DQ3Q4Z82DZ, `ExportOptions.plist`).
3. **업로드**: Transporter 앱(App Store에서 설치)에 .ipa를 드래그해 업로드.
4. App Store Connect → TestFlight 탭에서 처리 완료(수 분) 후 내부 테스터 추가. 수출 규정 질문은 `ITSAppUsesNonExemptEncryption=false`로 생략된다.
5. 버전은 `MARKETING_VERSION`, 빌드 번호는 `CURRENT_PROJECT_VERSION`(pbxproj) — 같은 버전을 다시 올릴 땐 빌드 번호를 올려야 한다.
