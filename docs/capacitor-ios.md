# Capacitor iOS 운영/검증 노트 (Runbook)

이 앱은 **Capacitor 셸이 원격 URL(배포된 Next.js 웹)을 WebView로 로드**하고, 네이티브 기능은 **카메라만** 쓴다. 설계 배경은 [specs/2026-07-24-capacitor-camera-webview-design.md](./superpowers/specs/2026-07-24-capacitor-camera-webview-design.md).

아래는 **실제 구현·기기 검증에서 확인된 함정들**이다. 다시 겪으면 시간을 크게 날리므로 먼저 읽을 것.

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

## 실기기(iPhone) 실행 절차 (CLI 중심, Xcode GUI 회피)

1. **웹 서버(prod)**를 LAN에 띄운다: `pnpm build && PORT=3000 pnpm start`
2. **앱이 볼 URL**을 맥의 LAN IP로 동기화(폰은 localhost 못 씀):
   ```bash
   CAP_SERVER_URL=http://<맥_LAN_IP>:3000/camera-check npx cap sync ios
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
   xcrun devicectl device process launch --device "$DEV" kr.pallang.app
   ```

## 시뮬레이터 절차 (빠른 확인, 카메라는 없음)

```bash
xcrun simctl boot "iPhone 17"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath ./build-sim CODE_SIGNING_ALLOWED=NO build
xcrun simctl install booted ./build-sim/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted kr.pallang.app
xcrun simctl io booted screenshot out.png   # 화면 확인
```

- 시뮬레이터엔 카메라가 없어 실제 촬영은 실기기에서 확인. 셸/로드/하이드레이션 검증엔 충분.

## 세이프에어리어(노치/상태바) 대응

- `app/layout.tsx`에 `export const viewport = { viewportFit: 'cover', ... }` (이게 있어야 iOS에서 `env(safe-area-inset-*)`가 실제 값을 가짐).
- 화면 컨테이너에 `padding: max(<기본값>, env(safe-area-inset-*))` 적용.

## Android 노트

iOS만큼 함정은 없다(Gradle 프로젝트라 pbxproj 손상 같은 문제 없음). 확인된 사항:

- **⚠️ 빌드에 JDK 21 필요**: `@capacitor/camera` 플러그인의 Gradle 툴체인이 Java 21을 요구한다. JDK 17로 빌드하면 `Cannot find a Java installation ... matching {languageVersion=21}`로 실패. 빌드 시 `JAVA_HOME`을 **JDK 21**로 지정할 것.
- **⚠️ cleartext(http) — iOS ATS의 Android판**: targetSdk 36이라 cleartext가 기본 차단된다. **프로덕션(https)은 무관**하지만, **LAN dev 서버(http) 테스트 시** 필요. `android/app/src/debug/AndroidManifest.xml`에 `usesCleartextTraffic="true"`를 두어 **디버그 빌드에만** 허용(릴리스엔 안 들어가 prod 보안 유지).
- **카메라 권한 불필요**: `@capacitor/camera`가 매니페스트(`queries` IMAGE_CAPTURE 등)를 자동 병합. `CAMERA` 권한 선언 불필요.
- **APK 빌드 (검증됨)**:
  ```bash
  # dev(에뮬레이터): 호스트는 10.0.2.2로 접근
  CAP_SERVER_URL=http://10.0.2.2:3000/camera-check npx cap sync android
  cd android && JAVA_HOME=<JDK21_경로> ANDROID_HOME=<SDK> ./gradlew assembleDebug
  # 산출물: android/app/build/outputs/apk/debug/app-debug.apk
  ```
- **에뮬레이터 실행**: 디스크 여유가 넉넉해야 함(에뮬레이터가 userdata에 ~7GB 요구). SDK 구성요소: `sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "emulator" "system-images;android-36;google_apis;arm64-v8a"`, AVD는 `avdmanager create avd`.
- **하이드레이션**: Android WebView는 Chromium이라 `next dev`도 될 가능성이 높지만, iOS와 동일하게 **prod 빌드 권장**.

## 미확정 / 배포 전 할 일

- `capacitor.config.ts`의 `appId`(`kr.pallang.app`), `PROD_SERVER_URL`(현재 플레이스홀더)을 실제 값으로 교체.
- Android는 스캐폴딩만 됨(`android/`), 빌드/기기 검증은 미수행.
- **UIScene 생명주기(향후 필수화)**: 현재 Capacitor iOS 템플릿은 옛 AppDelegate 생명주기를 써서 실행 시 `UIScene lifecycle will soon be required...` 경고가 뜬다. **지금 배포엔 문제없음**(앱스토어 심사 반려 아님, 앱 정상 동작). 다만 미래 iOS에서 Scene 채택이 필수가 되면 미채택 앱은 실행 시 크래시(assert)한다. → **Capacitor 업데이트에 Scene 대응이 들어오는지 주기적으로 확인**하고, 들어오면 반영할 것. 미리 대응하려면 `SceneDelegate`를 수동 채택(Capacitor 커뮤니티에 방법 있음). 지금 당장은 조치 불필요.
