# Capacitor 웹뷰(카메라) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 Next.js 16 웹을 Capacitor로 감싸 iOS/Android 앱으로 만들고, 웹뷰는 배포 URL을 원격 로드하며 네이티브 카메라를 사용할 수 있게 한다.

**Architecture:** 앱은 얇은 Capacitor 셸이고 WebView가 `server.url`의 원격 웹을 로드하므로 Next.js 서버 기능(PPR/`cacheComponents`)을 그대로 유지한다. 카메라는 `app/_global/_hooks/useCamera.ts` 한 곳으로 캡슐화하고, 네이티브에서는 `@capacitor/camera`, 브라우저에서는 파일 input 폴백으로 분기해 웹은 `pnpm dev`로도 그대로 개발/검증된다.

**Tech Stack:** Next.js 16.2.11, React 19, TypeScript, Capacitor 8 (`@capacitor/core`·`cli`·`ios`·`android`·`camera`), Vitest + Testing Library (happy-dom), pnpm.

## Global Constraints

모든 태스크는 아래 제약을 암묵적으로 포함한다.

- **서버 기능 유지**: `next.config.ts`의 `cacheComponents: true`를 유지한다. `output: 'export'` 로 바꾸지 않는다.
- **로딩 방식**: 정적 번들링이 아니라 `capacitor.config.ts`의 `server.url` 원격 로드.
- **default export 금지**: named export만. 예외는 Next 특수 파일(`page.tsx` 등)과 설정 파일(`*.config.ts`)뿐.
- **배럴 파일 금지**: `index.ts`/`index.tsx` 생성·import 금지.
- **import 경로**: 같은 route 내부는 상대경로, `_global`/`_shared` 코드는 `@/` 절대경로.
- **캡슐화**: feature 코드는 `@capacitor/camera`를 직접 import하지 않고 `@/app/_global/_hooks/useCamera`만 사용.
- **파일명**: `_hooks`/`_data` 하위 `.ts`는 camelCase, 컴포넌트 폴더/파일은 PascalCase.
- **타입 전용 import**: `import type` 또는 인라인 `type` 사용.
- **로그**: `console.log` 금지 (`console.warn`/`console.error`만).
- **커밋**: Conventional Commits, subject는 **소문자(또는 한글)로 시작**(commitlint `subject-case`). 모든 커밋 메시지는 다음 트레일러로 끝낸다:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **검증**: 코드 변경 태스크는 종료 전 `pnpm lint && pnpm typecheck && pnpm test` 통과.

---

### Task 1: Capacitor 의존성·설정·ignore·scripts

Capacitor를 웹 프로젝트에 배선한다. 네이티브 플랫폼 생성(`cap add`)은 Task 4에서 하고, 여기서는 npm 의존성·설정 파일·lint/format 제외·npm scripts까지만. 유닛 테스트 대상이 아니며 `typecheck`/`lint`로 검증한다.

**Files:**

- Create: `capacitor.config.ts`
- Modify: `package.json` (dependencies + scripts)
- Modify: `eslint.config.mjs` (globalIgnores)
- Modify: `.prettierignore`

**Interfaces:**

- Consumes: 없음.
- Produces: 루트 `capacitor.config.ts` (default export `CapacitorConfig`), `pnpm cap:*` scripts. `appId`/prod URL은 아래 상수로 노출되어 Task 4가 사용.

- [ ] **Step 1: Capacitor 의존성 설치**

Run:

```bash
pnpm add @capacitor/core @capacitor/camera @capacitor/ios @capacitor/android
pnpm add -D @capacitor/cli
```

Expected: `package.json` dependencies에 5개 패키지 추가, 설치 성공.

- [ ] **Step 2: `capacitor.config.ts` 작성**

> ⚠️ `PROD_SERVER_URL`의 `https://pallang.example.com`, `appId`의 `kr.pallang.app`은 **실제 배포 도메인/앱 식별자로 교체**한다(아직 미정이면 이 기본값으로 두고 배포 전 확정). dev 라이브리로드는 `CAP_SERVER_URL` 환경변수로 LAN IP를 주입한다.

Create `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli'

// 배포 전 실제 값으로 교체할 것
const APP_ID = 'kr.pallang.app'
const PROD_SERVER_URL = 'https://pallang.example.com'

// dev 라이브리로드: CAP_SERVER_URL=http://<LAN_IP>:3000 pnpm cap:ios
const serverUrl = process.env.CAP_SERVER_URL ?? PROD_SERVER_URL

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: 'pallang',
  // 원격 로드라도 존재해야 함 → 기존 public을 최소 fallback으로 사용
  webDir: 'public',
  server: {
    url: serverUrl,
    androidScheme: 'https',
    // http(LAN) 로드일 때만 cleartext 허용
    cleartext: serverUrl.startsWith('http://'),
    allowNavigation: [],
  },
}

export default config
```

- [ ] **Step 3: `package.json`에 cap scripts 추가**

`package.json`의 `scripts`에 다음 4줄을 추가:

```jsonc
"cap:sync": "cap sync",
"cap:ios": "cap run ios",
"cap:android": "cap run android",
"cap:open:ios": "cap open ios"
```

- [ ] **Step 4: ESLint에서 네이티브 폴더 제외**

`eslint.config.mjs` 마지막의 `globalIgnores` 호출을 수정:

```js
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'ios/**', 'android/**']),
```

- [ ] **Step 5: Prettier에서 네이티브 폴더 제외**

`.prettierignore` 끝에 두 줄 추가:

```
ios
android
```

- [ ] **Step 6: 검증 — typecheck & lint**

Run:

```bash
pnpm typecheck && pnpm lint
```

Expected: 둘 다 에러 없이 통과. (`capacitor.config.ts`는 `*.config.ts` 예외로 default export 허용됨.)

- [ ] **Step 7: 커밋**

```bash
git add capacitor.config.ts package.json pnpm-lock.yaml eslint.config.mjs .prettierignore
git commit -m "chore: capacitor 의존성 및 원격 로드 설정 추가"
```

(커밋 메시지 끝에 Global Constraints의 Co-Authored-By 트레일러 포함.)

---

### Task 2: 카메라 상수 + `useCamera` 훅 (TDD)

카메라 촬영을 캡슐화한 전역 훅. 네이티브면 `@capacitor/camera`, 브라우저면 파일 input 폴백. 유닛 테스트로 분기 로직을 고정한다.

**Files:**

- Create: `app/_global/_data/camera.constant.ts`
- Create: `app/_global/_hooks/useCamera.ts`
- Test: `app/_global/_tests/useCamera.spec.ts`

**Interfaces:**

- Consumes: `@capacitor/camera` (`Camera.getPhoto`, `CameraResultType`, `CameraSource`, `ImageOptions`), `@capacitor/core` (`Capacitor.isNativePlatform`).
- Produces:
  - `CAMERA_OPTIONS: ImageOptions` (`app/_global/_data/camera.constant.ts`)
  - `type Photo = { webPath: string }`
  - `useCamera(): { takePhoto: () => Promise<Photo | null> }` (`app/_global/_hooks/useCamera.ts`)

- [ ] **Step 1: 카메라 옵션 상수 작성**

Create `app/_global/_data/camera.constant.ts`:

```ts
import { CameraResultType, CameraSource, type ImageOptions } from '@capacitor/camera'

export const CAMERA_OPTIONS: ImageOptions = {
  source: CameraSource.Prompt, // 카메라/앨범 선택 프롬프트
  resultType: CameraResultType.Uri,
  quality: 90,
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

Create `app/_global/_tests/useCamera.spec.ts`:

```ts
import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CAMERA_OPTIONS } from '@/app/_global/_data/camera.constant'
import { useCamera } from '@/app/_global/_hooks/useCamera'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}))
vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Prompt: 'PROMPT' },
}))

describe('useCamera', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('네이티브에서는 Camera.getPhoto를 CAMERA_OPTIONS로 호출하고 webPath를 반환한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      webPath: 'capacitor://photo/1',
    } as Awaited<ReturnType<typeof Camera.getPhoto>>)

    const { takePhoto } = useCamera()
    const result = await takePhoto()

    expect(Camera.getPhoto).toHaveBeenCalledWith(CAMERA_OPTIONS)
    expect(result).toEqual({ webPath: 'capacitor://photo/1' })
  })

  it('네이티브에서 webPath가 없으면 null을 반환한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Camera.getPhoto).mockResolvedValue({} as Awaited<ReturnType<typeof Camera.getPhoto>>)

    const { takePhoto } = useCamera()
    expect(await takePhoto()).toBeNull()
  })

  it('브라우저에서는 Camera.getPhoto를 호출하지 않고 파일 input을 생성한다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    const createEl = vi.spyOn(document, 'createElement')

    void useCamera().takePhoto()

    expect(Camera.getPhoto).not.toHaveBeenCalled()
    const input = createEl.mock.results.at(-1)?.value as HTMLInputElement
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('capture')).toBe('environment')
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run:

```bash
pnpm test app/_global/_tests/useCamera.spec.ts
```

Expected: FAIL — `useCamera`(과 `camera.constant`) 모듈이 없어 import 해석 실패.

- [ ] **Step 4: `useCamera` 훅 구현**

Create `app/_global/_hooks/useCamera.ts`:

```ts
'use client'

import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

import { CAMERA_OPTIONS } from '@/app/_global/_data/camera.constant'

export type Photo = { webPath: string }

export function useCamera(): { takePhoto: () => Promise<Photo | null> } {
  const takePhoto = async (): Promise<Photo | null> => {
    if (Capacitor.isNativePlatform()) {
      const photo = await Camera.getPhoto(CAMERA_OPTIONS)
      return photo.webPath ? { webPath: photo.webPath } : null
    }
    return takePhotoFromFileInput()
  }

  return { takePhoto }
}

function takePhotoFromFileInput(): Promise<Photo | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.setAttribute('capture', 'environment')
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      resolve(file ? { webPath: URL.createObjectURL(file) } : null)
    })
    input.click()
  })
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run:

```bash
pnpm test app/_global/_tests/useCamera.spec.ts
```

Expected: PASS (3 tests).

- [ ] **Step 6: 전체 검증**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: 모두 통과.

- [ ] **Step 7: 커밋**

```bash
git add app/_global/_data/camera.constant.ts app/_global/_hooks/useCamera.ts app/_global/_tests/useCamera.spec.ts
git commit -m "feat: 카메라 촬영 useCamera 훅 추가"
```

---

### Task 3: 카메라 검증용 데모 화면 (TDD)

브라우저·실기기에서 카메라 동작을 눈으로 확인할 최소 화면. `/camera-check` 라우트에서 버튼을 누르면 촬영/선택 결과 미리보기를 띄운다.

**Files:**

- Create: `app/camera-check/_components/CameraCheck/CameraCheck.tsx`
- Create: `app/camera-check/page.tsx`
- Test: `app/camera-check/_tests/cameraCheck.spec.tsx`

**Interfaces:**

- Consumes: `useCamera` (`@/app/_global/_hooks/useCamera`, Task 2).
- Produces: `CameraCheck` 컴포넌트, `/camera-check` 페이지.

- [ ] **Step 1: 실패하는 컴포넌트 테스트 작성**

Create `app/camera-check/_tests/cameraCheck.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CameraCheck } from '../_components/CameraCheck/CameraCheck'

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({
    takePhoto: vi.fn().mockResolvedValue({ webPath: 'blob:test' }),
  }),
}))

describe('CameraCheck', () => {
  it('버튼을 누르면 촬영 결과 이미지를 보여준다', async () => {
    render(<CameraCheck />)
    fireEvent.click(screen.getByRole('button', { name: '사진 촬영' }))

    const img = await screen.findByAltText('촬영 결과')
    expect(img).toHaveAttribute('src', 'blob:test')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run:

```bash
pnpm test app/camera-check/_tests/cameraCheck.spec.tsx
```

Expected: FAIL — `CameraCheck` 모듈 없음.

- [ ] **Step 3: `CameraCheck` 컴포넌트 구현**

Create `app/camera-check/_components/CameraCheck/CameraCheck.tsx`:

```tsx
'use client'

import { useState } from 'react'

import { useCamera } from '@/app/_global/_hooks/useCamera'

export function CameraCheck() {
  const { takePhoto } = useCamera()
  const [src, setSrc] = useState<string | null>(null)

  const onCapture = async () => {
    const photo = await takePhoto()
    if (photo) setSrc(photo.webPath)
  }

  return (
    <div>
      <button type="button" onClick={() => void onCapture()}>
        사진 촬영
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="촬영 결과" />}
    </div>
  )
}
```

- [ ] **Step 4: 페이지 작성**

Create `app/camera-check/page.tsx`:

```tsx
import { CameraCheck } from './_components/CameraCheck/CameraCheck'

export default function CameraCheckPage() {
  return <CameraCheck />
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run:

```bash
pnpm test app/camera-check/_tests/cameraCheck.spec.tsx
```

Expected: PASS.

- [ ] **Step 6: 전체 검증 + 브라우저 확인**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: 모두 통과.

이어서 `pnpm dev` 후 `http://localhost:3000/camera-check`에서 "사진 촬영" 클릭 → 파일 선택 다이얼로그가 뜨고, 이미지를 고르면 미리보기가 보이는지 확인(브라우저 폴백 경로).

- [ ] **Step 7: 커밋**

```bash
git add app/camera-check/
git commit -m "feat: 카메라 검증용 데모 화면 추가"
```

---

### Task 4: 네이티브 플랫폼 생성 + iOS 카메라 권한

> ⚠️ **로컬 환경 필요**: Xcode + CocoaPods(iOS), Android Studio + JDK(Android). 자동 에이전트가 아니라 로컬 macOS에서 실행한다. 이 태스크는 `ios/`·`android/` 프로젝트를 생성/커밋하고 실기기에서 네이티브 카메라를 검증한다.

**Files:**

- Create: `ios/` (Capacitor 생성)
- Create: `android/` (Capacitor 생성)
- Modify: `ios/App/App/Info.plist` (카메라/앨범 권한 문구)

**Interfaces:**

- Consumes: `capacitor.config.ts`·Capacitor 의존성(Task 1), `useCamera` 데모(Task 3).
- Produces: 빌드·제출 가능한 iOS/Android 네이티브 프로젝트.

- [ ] **Step 1: 네이티브 플랫폼 추가**

Run (프로젝트 루트에서):

```bash
npx cap add ios
npx cap add android
```

Expected: `ios/`, `android/` 폴더 생성. (config가 이미 있으므로 `cap init` 불필요.)

- [ ] **Step 2: 웹 설정 동기화**

Run:

```bash
npx cap sync
```

Expected: `webDir`(public)와 플러그인이 네이티브 프로젝트에 동기화됨. 에러 없음.

- [ ] **Step 3: iOS 카메라/앨범 권한 문구 추가**

`ios/App/App/Info.plist`의 최상위 `<dict>` 안에 추가(없으면 앱이 카메라 접근 시 크래시):

```xml
<key>NSCameraUsageDescription</key>
<string>사진 촬영을 위해 카메라를 사용합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>사진 선택을 위해 앨범에 접근합니다.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>촬영한 사진을 앨범에 저장합니다.</string>
```

(Android는 시스템 카메라/포토피커 인텐트를 쓰므로 기본 촬영에 매니페스트 권한 추가 불필요.)

- [ ] **Step 4: 실기기에서 네이티브 카메라 검증**

dev 서버를 LAN에 노출하고 실기기에서 실행:

```bash
# 터미널 A: 웹 dev 서버 (LAN 접근 허용)
pnpm dev -- -H 0.0.0.0

# 터미널 B: 앱을 로컬 웹으로 로드 (LAN IP는 본인 것으로)
CAP_SERVER_URL=http://<LAN_IP>:3000 npx cap run ios
```

확인: 기기에서 앱 실행 → `/camera-check` 진입 → "사진 촬영" → **네이티브 카메라/앨범**이 뜨고 선택 결과 미리보기가 보이는지. (iOS 시뮬레이터엔 카메라가 없으니 실기기 권장. Android는 `npx cap run android`로 동일 확인.)

- [ ] **Step 5: 커밋**

```bash
git add ios android
git commit -m "chore: ios/android 네이티브 플랫폼 및 카메라 권한 설정"
```

(`ios/`·`android/`는 Capacitor가 생성한 `.gitignore`로 빌드 산출물은 자동 제외된다.)

---

## Self-Review 결과

- **스펙 커버리지**: 원격 로드 설정(§5→Task 1), 의존성(§3→Task 1), 디렉토리/ignore(§4→Task 1·2), 카메라 연동 계층(§6→Task 2), iOS 권한(§6→Task 4), 데모/검증(§9, Non-goals의 "최소 예시"→Task 3), 워크플로(§8→Task 4 Step 4). 모두 태스크로 매핑됨.
- **의도적 열린 값**: `appId`, prod 배포 도메인, dev LAN IP는 스펙 §10의 미확정 항목으로, Task 1/4에서 "실제 값으로 교체"로 명시(플랜 공백 아님, 사용자 제공 설정값).
- **범위 밖**: 푸시, 오프라인, 앱스토어 서명/제출 자동화, 딥링크 — 계획에 포함하지 않음(스펙 Non-goals 일치).
