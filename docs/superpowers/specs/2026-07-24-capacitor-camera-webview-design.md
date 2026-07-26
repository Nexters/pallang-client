# Capacitor 웹뷰 앱화 (카메라) 설계

- 날짜: 2026-07-24
- 대상: `pallang-client` (Next.js 16.2.11, React 19, TanStack Query, Tailwind 4, TypeScript, ESLint 9 flat config)
- 목표: 기존 Next.js 웹을 **Capacitor**로 감싸 iOS/Android 네이티브 앱으로 앱스토어에 배포한다. 앱 웹뷰는 **배포된 URL을 원격 로드**하며, 네이티브 기능은 **카메라만** 사용한다.

## 1. 목표와 원칙

1. **웹 코드베이스 유지**: 지금 Next.js 웹을 크게 뜯어고치지 않는다. "브라우저에서 되면 앱에서도 된다"는 Capacitor 원칙을 따른다.
2. **서버 기능 보존**: 원격 URL 로드 방식을 써서 Next.js 서버 기능(PPR / `cacheComponents` / Server Actions / SSR)을 **그대로 유지**한다. 정적 export(`output: 'export'`)로 가지 않는다.
3. **온라인 전용**: 오프라인 요구가 없으므로 웹 자산을 앱에 번들링하지 않는다. 앱은 얇은 네이티브 셸이다.
4. **컨벤션 준수**: 웹↔네이티브 연동 코드는 기존 디렉토리/lint 규칙(AGENTS.md) 안에서 배치하고, 네이티브 프로젝트 폴더는 lint/format 대상에서 제외한다.
5. **브라우저 개발 유지**: 모든 네이티브 호출은 플랫폼 가드 + 웹 폴백을 둬서, 웹은 브라우저(`pnpm dev`)에서도 그대로 열리고 개발된다.

### 결정 사항 (확정)

- **셸 구현**: Capacitor. (React Native / 순수 네이티브 대신)
- **로딩 방식**: 원격 URL 로드 (`server.url`). 정적 번들링 아님.
- **네이티브 기능**: **카메라만**. 푸시 알림은 이번 범위에서 제외.
- **리포 구조**: 단일 리포. `capacitor.config.ts`, `ios/`, `android/`를 이 레포 루트에 둔다.
- **웹 폴백**: 카메라 웹 폴백은 `@capacitor/camera` 기본 동작(파일 input)을 사용. 더 나은 웹 카메라 UI가 필요해지면 `@ionic/pwa-elements`를 추후 옵션으로 도입.

### 비목표 (Non-goals)

- **푸시 알림** — 이번 범위 밖 (후속 작업).
- **오프라인 지원 / 정적 export** — 하지 않는다.
- **앱스토어 계정·서명·심사·제출 자동화(Fastlane 등)** — 설정 방법은 안내하되 이번 구현 범위 밖.
- **딥링크 / 유니버설 링크** — 카메라만 다루므로 이번 범위 밖.
- **실제 도메인 기능** — 카메라를 소비하는 실제 업로드/화면 로직은 별도. 이번엔 연동 계층 + 검증용 최소 사용 예시까지.

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────┐
│  네이티브 앱 (iOS .ipa / Android .apk)      │  ← 앱스토어 배포 실체
│  ┌─────────────────────────────────────┐ │
│  │        WebView (전체화면)              │ │
│  │   server.url → 배포된 Next.js 웹 로드   │ │  ← SSR/PPR 그대로 수신
│  └─────────────────────────────────────┘ │
│              ↕  Capacitor Bridge           │
│  네이티브 런타임 (Swift / Kotlin)            │  ← @capacitor/camera → 실제 카메라
└─────────────────────────────────────────┘

배포 흐름:  웹 수정 → 서버 재배포 → 앱 즉시 최신 (앱스토어 심사 불필요)
네이티브 수정(설정/플러그인) 시에만 → cap sync → 재빌드/재제출
```

- 앱은 `server.url`이 가리키는 원격 웹을 로드한다. 웹을 고치면 **재배포만으로 앱이 갱신**된다.
- 네이티브 설정(권한 문구, 플러그인 추가 등)을 바꿀 때만 `npx cap sync` 후 재빌드가 필요하다.

## 3. 의존성

`package.json`에 추가:

- `@capacitor/core` — 런타임/브릿지 (웹 번들에 포함되어야 JS API가 동작)
- `@capacitor/cli` (dev) — `cap` 명령어
- `@capacitor/ios`, `@capacitor/android` — 플랫폼
- `@capacitor/camera` — 카메라 플러그인

원격 URL 방식에서도 `@capacitor/*` JS 래퍼는 **웹 번들에 포함**되어야 네이티브 브릿지와 통신한다. 즉 웹 프로젝트가 Capacitor 의존성을 갖게 된다(의도된 통합 비용).

## 4. 디렉토리 배치 (기존 컨벤션 준수)

### 루트 (네이티브 영역, lint/format 제외)

- `capacitor.config.ts` — Capacitor 설정. **config 파일이므로 default export 예외 적용** (AGENTS의 "설정 파일 예외").
- `ios/` — Xcode 프로젝트 (`npx cap add ios`가 생성). 소스는 커밋, 네이티브 빌드 산출물은 Capacitor가 넣어주는 `.gitignore`로 무시.
- `android/` — Android Studio 프로젝트 (`npx cap add android`가 생성). 동일.

### 웹↔네이티브 연동 계층 (`app/_global` 안)

AGENTS의 `_global` 하위 폴더 목록(`_providers/ _components/ _hooks/ _queries/ _apis/ _data/ _styles/`)을 벗어나지 않기 위해 **새 폴더를 만들지 않고 기존 규칙에 맞춘다**:

- `app/_global/_hooks/useCamera.ts` — **공개 API**. feature 코드는 이 훅만 사용하고 `@capacitor/camera`를 직접 import하지 않는다 (기존 "API 직접 import 금지"와 같은 결).
  - 내부에서 `Capacitor.isNativePlatform()`으로 분기: 네이티브면 `@capacitor/camera`, 브라우저면 웹 폴백.
- `app/_global/_data/camera.constant.ts` — 카메라 옵션 기본값(quality, resultType 등) 상수. (`_data`는 store/model/constant 파일 단위 분리 규칙)

> 근거: `_global`에 `_native`/`_services` 같은 새 폴더를 추가하면 `check-file`/`boundaries` lint 규칙과 충돌할 수 있다. 카메라 연동은 훅 하나로 캡슐화되므로 기존 `_hooks`로 충분하다.

### lint/format/ignore 반영

- `eslint.config.mjs` — flat config의 `ignores`에 `ios/`, `android/` 추가.
- `.prettierignore` — `ios/`, `android/` 추가 (없으면 생성).
- `capacitor.config.ts`는 lint 대상이되 default export 예외 규칙에 포함되도록 확인.

## 5. Capacitor 설정 (`capacitor.config.ts`)

환경별 `server.url` 분기가 핵심.

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const isDev = process.env.NODE_ENV === 'development'

const config: CapacitorConfig = {
  appId: 'kr.pallang.app', // 확정 필요 (역DNS 형식)
  appName: 'pallang',
  webDir: 'public', // 원격 로드 시에도 존재해야 함 → 기존 public을 최소 fallback으로 사용
  server: {
    androidScheme: 'https',
    // dev: 로컬 dev 서버(LAN IP). prod: 배포 URL.
    url: isDev ? 'http://<LAN_IP>:3000' : 'https://<배포-도메인>',
    cleartext: isDev, // dev의 http 허용. 프로덕션은 false.
    // 앱 웹뷰가 이동을 허용할 추가 도메인(인증/외부 리소스 등)
    allowNavigation: [],
  },
}

export default config
```

- **`webDir`**: 원격 URL을 쓰더라도 빌드/`cap sync`가 존재를 요구한다. 별도 산출물을 만들지 않고 기존 `public/`을 최소 fallback으로 지정한다. (필요 시 `public/index.html`에 간단한 로딩/폴백 화면 추가 가능)
- **`server.url`**: 실제 값은 배포 도메인/LAN IP로 채운다. 하드코딩 대신 env로 관리하는 방식은 구현 계획에서 확정.
- **`appId`**: 앱스토어 식별자. 역DNS 형식으로 확정 필요(예: `kr.pallang.app`).

## 6. 카메라 연동 계층

### 공개 훅 (`useCamera`)

```ts
// app/_global/_hooks/useCamera.ts (형태 예시)
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

// 반환: 촬영/선택 후 미리보기용 URL 또는 파일
export function useCamera() {
  const takePhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      const photo = await Camera.getPhoto({
        source: CameraSource.Prompt, // 카메라/앨범 선택
        quality: 90,
        resultType: CameraResultType.Uri,
      })
      return { webPath: photo.webPath }
    }
    // 웹 폴백: <input type="file" accept="image/*" capture> 로 파일 획득
    return pickFileFallback()
  }

  return { takePhoto }
}
```

- 네이티브: `@capacitor/camera`의 `getPhoto`(또는 8.1+ `takePhoto`/`chooseFromGallery`) 사용. 설치 시점의 실제 API는 `node_modules/@capacitor/camera` 문서로 확인 후 확정.
- 웹: 파일 input 폴백. 브라우저에서도 동일 인터페이스로 동작.
- 모든 분기는 `isNativePlatform()` 가드로 감싼다.

### 네이티브 권한 문구

- **iOS** (`ios/App/App/Info.plist`): 카메라/앨범 사용 목적 문구 필수. 없으면 앱 크래시.
  - `NSCameraUsageDescription`
  - `NSPhotoLibraryUsageDescription` (앨범 읽기)
  - `NSPhotoLibraryAddUsageDescription` (앨범 저장 시)
- **Android**: 11+는 시스템 포토피커라 대개 별도 권한 선언 불필요. `saveToGallery` 사용 시에만 저장 권한 추가.

## 7. WebView / UX 세부

- **세이프에어리어**: 노치/홈 인디케이터 대응을 위해 `env(safe-area-inset-*)` CSS 적용 (globals.css 또는 레이아웃). 카메라 범위에서는 최소한만, 전체 UX는 후속.
- `server.androidScheme = 'https'` 로 쿠키/보안 컨텍스트 일관성 확보.
- 인증/외부 도메인으로의 웹뷰 내 이동이 필요하면 `allowNavigation`에 추가 (기본은 외부 브라우저로 열림).

## 8. 개발 / 빌드 워크플로

### 준비물 (prerequisites)

- Xcode + CocoaPods (iOS, macOS)
- Android Studio + JDK (Android)

### npm scripts 추가 (예시)

```jsonc
{
  "cap:sync": "cap sync",
  "cap:ios": "cap run ios",
  "cap:android": "cap run android",
  "cap:open:ios": "cap open ios",
}
```

### 로컬 개발 3단계

1. **브라우저 (작업 대부분)**: `pnpm dev` → `localhost:3000`. 카메라는 파일 input 폴백으로 동작. UI/로직 대부분을 여기서 개발.
2. **앱 + 라이브 리로드 (네이티브 카메라 확인)**: `server.url`을 `http://<LAN_IP>:3000`으로 두고 실기기에서 앱 실행 → 코드 저장 시 실시간 갱신, 실제 카메라 확인. (iOS 시뮬레이터엔 카메라 없음 → 실기기 권장)
3. **프로덕션 유사**: 웹 배포 → `server.url` = 배포 URL → 앱 빌드/제출.

### 초기 셋업 순서

1. 의존성 설치
2. `npx cap init` (appId/appName)
3. `capacitor.config.ts` 작성 (`server.url`, `webDir`)
4. `npx cap add ios && npx cap add android`
5. `useCamera` 훅 + 상수 추가, 검증용 최소 사용 예시 배치
6. iOS 권한 문구(Info.plist) 추가
7. `npx cap sync` → 실기기에서 카메라 동작 확인

## 9. 검증

- `pnpm lint && pnpm typecheck && pnpm test` — 웹 코드 변경분 검증 (AGENTS 규칙).
- 브라우저에서 웹 폴백으로 사진 선택 동작 확인.
- 실기기(iOS/Android)에서 `useCamera`가 네이티브 카메라를 띄우고 결과를 받는지 확인.

## 10. 열린 질문 (구현 계획에서 확정)

1. `appId` 최종 값 (예: `kr.pallang.app`).
2. 배포 도메인(prod `server.url`)과 dev LAN IP 주입 방식(env vs config 분기).
3. `webDir` fallback을 기존 `public/`으로 둘지, 전용 폴더를 둘지.
4. 카메라 결과 소비처(업로드 API/화면) — 이번 범위에 검증용 최소 예시만 둘지, 실제 연동까지 갈지.
