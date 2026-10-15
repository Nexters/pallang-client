---
name: deploy-release
description: 웹 운영 배포(develop→release, Vercel Production)와 앱 배포(TestFlight·Play 아카이브·업로드)를 절차대로 수행한다. "운영 배포", "release 배포", "프로덕션 올려", "릴리스 만들어", "앱 배포", "테스트플라이트 올려", "dev 빌드 올려", "아카이브 떠줘" 요청 시 사용.
---

# 운영 배포 (develop → release)

`release` 브랜치가 Vercel Production을 추적한다. `develop`은 dev.pallang.co.kr.

**`release` 브랜치로 나가는 모든 배포는 예외 없이 이 문서의 절차를 따른다.**
급해 보이거나 커밋이 하나뿐이어도 단계를 건너뛰지 않는다. 특히:

- 0번(develop이 초록인지 확인) 없이 `release`에 push하지 않는다. 깨진 develop을 밀면 Production 빌드가 실패해 배포가 아예 안 나간다.
- 1번(fast-forward 확인) 없이 `release`에 push하지 않는다.
- 3번(사용자 확인) 없이 `release`에 push하지 않는다. 운영 배포는 되돌리기 어렵다.
- 버전 태그 없이 배포하지 않는다. 배포 시점과 태그가 1:1로 맞아야 롤백할 지점을 찾을 수 있다.

핫픽스처럼 이 절차로 안 되는 상황이면 **임의로 진행하지 말고 사용자에게 판단을 넘긴다.**

앱 빌드(TestFlight·Play)는 아래 **「앱 배포」** 절이 따로 있다. 웹 배포와 절차가 다르므로 그쪽을 따른다.

## 0. develop이 초록인지 확인

`release` push는 그대로 Production 빌드로 들어간다. **깨진 develop을 밀면 배포가 실패하고
운영은 직전 배포에 머문다** — 태그와 릴리스만 남고 실제로는 아무것도 안 나간 상태가 된다(v1.4.1 사례).

```bash
gh run list --branch develop --limit 3   # 최신 커밋의 CI 결과
```

최신 커밋의 CI가 초록이 아니거나 결과가 없으면 **로컬에서 직접 확인한다.**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

`pnpm build`까지 반드시 돌린다 — lint·typecheck·test가 다 통과해도 프리렌더 단계에서만
깨지는 종류가 있다(cacheComponents가 클라이언트 컴포넌트의 현재 시각·랜덤 사용을 빌드에서 막는다).

빨간 상태면 **중단하고 사용자에게 알린다.** 고치기 전에는 배포하지 않는다.

## 1. fast-forward 가능한지 확인

```bash
git fetch origin
git merge-base --is-ancestor origin/release origin/develop
```

실패하면 **중단**. release에만 있는 커밋(핫픽스 등)이 있다는 뜻이다.
`git log --oneline origin/develop..origin/release`로 보여주고 사용자에게 판단을 넘긴다.

## 2. 나갈 커밋과 버전 정하기

```bash
git log --oneline origin/release..origin/develop
git tag -l 'v*' | tail -1        # 직전 태그
```

웹앱이라 public API가 없으므로 실용 규칙만 쓴다:

- 기능 추가가 하나라도 있으면 → **minor**
- 버그 수정·리팩터링·문서만이면 → **patch**
- major는 제품이 통째로 달라질 때만. 앱 스토어 노출 버전이라 함부로 올리지 않는다.

`package.json`의 버전이 **웹과 앱 공통의 제품 버전**이다. 아래 "버전 체계"를 함께 읽는다.

## 3. 확인받기

나갈 커밋 목록과 정한 버전을 보여주고 진행 여부를 묻는다.

## 4. 버전 범프 + 태그

`pnpm version`은 clean tree를 요구한다. 관련 없는 작업물은 `git stash -u`로 치우고,
배포가 끝난 뒤 되돌려 별도 PR로 올린다. 배포 커밋에 섞지 않는다.

HEAD가 `origin/develop`과 같은 커밋이면 체크아웃 없이 바로 민다
(`git log --oneline -1 origin/develop`으로 확인). 다르면 develop을 체크아웃한 뒤 진행한다.

```bash
pnpm version minor -m "chore: release v%s"   # 또는 patch. package.json 범프+커밋+태그
git push origin HEAD:develop --follow-tags
```

commitlint(`commit-msg` 훅)와 `pnpm typecheck`(`pre-push` 훅)를 통과해야 한다. 실패하면 우회하지 말고 원인을 고친다.

## 5. 릴리스 PR 올리기

기록·리뷰용으로 PR을 만든다. 본문은 6번의 릴리스 노트와 같은 내용을 쓴다.

```bash
gh pr create --base release --head develop \
  --title "release v0.2.0" --body "..."
```

## 6. 운영 배포 (ff push)

```bash
git push origin origin/develop:release
```

**GitHub의 머지 버튼을 쓰지 않는다.** "Rebase and merge"는 커밋 SHA를 새로 만들어
develop과 release가 갈라지고 다음 배포부터 fast-forward가 깨진다. "Squash"는 히스토리를 뭉갠다.
ff push하면 GitHub이 해당 PR을 자동으로 merged 처리한다.

push 즉시 Vercel Production 배포가 트리거된다.

## 7. GitHub 릴리스

```bash
gh release create v0.2.0 --generate-notes
```

`--generate-notes`가 직전 태그 이후 머지된 PR 제목으로 노트를 만든다.
커밋이 `제목 (#111) (#112)` 형식이라 그대로 쓸 만하다.

**직전 태그가 없는 첫 릴리스는** `--generate-notes`가 최초 커밋부터 전부 긁어온다.
이때만 `--notes "..."`로 직접 써 넣는다.

마지막에 릴리스 URL을 사용자에게 안내한다.

---

# 버전 체계

**`package.json`의 버전이 제품 버전의 단일 소스다.** 웹과 앱이 같은 코드를 보므로
(앱은 `www.pallang.co.kr`을 원격 로드하는 웹뷰다) 두 버전을 따로 굴리지 않는다.

```
package.json  1.1.0-3  ──┬─→ 웹 dev     dev.pallang.co.kr (develop 자동 배포)
                         └─→ 앱 dev     MARKETING_VERSION 1.1.0 + 빌드번호
package.json  1.1.0    ──┬─→ 웹 운영    www.pallang.co.kr (release ff push, 태그 v1.1.0)
                         └─→ 앱 운영    MARKETING_VERSION 1.1.0 + 빌드번호
```

## dev 배포 (prerelease)

QA·기획이 dev 빌드를 이름으로 부를 일이 있을 때만 붙인다. 없으면 건너뛴다 —
`develop`은 머지마다 자동 배포되므로 전부 태그하면 태그가 PR 수만큼 쌓인다.

```bash
pnpm version preminor -m "chore: %s"     # 1.0.0 → 1.1.0-0  (다음 minor 작업 시작)
pnpm version prerelease -m "chore: %s"   # 1.1.0-0 → 1.1.0-1 (이후 dev 배포마다)
git push origin HEAD:develop --follow-tags
```

운영 배포는 4번에서 `pnpm version minor`를 쓴다 — prerelease 상태(`1.1.0-3`)에서
`minor`를 부르면 접미사만 떨어져 `1.1.0`이 된다. 번호가 건너뛰지 않는다.

# 앱 배포 (TestFlight / Play)

**앱 빌드를 올리는 모든 요청은 예외 없이 아래 1~5를 순서대로 밟는다.**
"아카이브만 떠줘", "그냥 하나 올려줘"처럼 좁게 들어와도 단계를 생략하지 않는다. 특히:

- **3번(푸시) 없이 4번(업로드)으로 넘어가지 않는다.** 아카이브 커밋을 안 밀면 develop이
  앞서갈 때 그 커밋이 어느 브랜치에도 없는 고아가 되고, 다음 아카이브가 이미 올라간 빌드보다
  낮은 번호를 달고 나온다. 그 빌드는 업로드가 통과해도 TestFlight에서 최신으로 잡히지 않아
  테스터가 옛 빌드를 계속 본다.
  (실제 사고: 커밋 `2af4da9`가 태그에만 매달린 고아로 남고, ASC엔 `1.3.1 (15)`가 올라갔는데
  레포는 `1.3.0` / 빌드 12에 머물렀다.)
- **1번(카운터 확인) 없이 아카이브하지 않는다.** 뒤처진 카운터로 뜬 ipa는 버리는 빌드다.
- dev 빌드를 심사에 제출하지 않는다. 심사는 `pnpm ios:archive`(운영, 짝수 빌드)로만.

## 1. 카운터가 실제 배포 상태와 맞는지 확인

```bash
git tag -l 'ios-*' | tail -1        # 또는 'aos-*'
```

이 태그의 빌드 번호가 **App Store Connect(Play Console)의 최신 빌드와 같아야 한다.**
사용자에게 스토어의 최신 버전·빌드 번호를 물어 맞춰 본다.

어긋나 있으면 **아카이브하기 전에** `package.json` 버전과 `CURRENT_PROJECT_VERSION`
(Android는 `versionCode`)을 실제로 올라간 값 **위로** 올려 맞추고 커밋한다.
올릴 버전은 사용자에게 확인받는다.

## 2. 아카이브

```bash
pnpm ios:archive:dev      # dev.pallang.co.kr 로드 — 내부 테스트
pnpm ios:archive          # 운영(www) 로드 — 심사 제출용
pnpm android:bundle:dev   # / pnpm android:bundle
```

스크립트가 버전 파일을 고치고 **스스로 커밋·태그한다.** 태그가 dev/운영을 가른다:

```
ios-v1.3.2-b18       운영 아카이브 (짝수)
ios-v1.3.2-b17-dev   dev 아카이브 (홀수)
aos-v1.3.2-vc5       Android 운영 번들 / -dev
```

`v*` 릴리스 태그와 접두사가 달라 `git tag -l 'v*'`(웹 배포 2번)에 섞이지 않는다.

| 값                                        | 출처                                           | 비고                                                                            |
| ----------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `MARKETING_VERSION` / `versionName`       | `package.json` 버전에서 prerelease 접미사 제거 | 스토어 노출 버전. **마침표로 나뉜 정수만 허용** — `1.1.0-3`은 업로드가 거부된다 |
| `CURRENT_PROJECT_VERSION` / `versionCode` | 아카이브마다 +1 (iOS는 dev=홀수, 운영=짝수)    | 스토어 구분자. 같은 번호를 두 번 못 올린다                                      |

**dev 빌드와 운영 빌드는 표시 버전이 같다.** 가르는 건 빌드 번호와 로드하는 서버 URL,
그리고 홈 화면 라벨(`Pallang DEV`)이다.

## 3. 푸시 (업로드보다 먼저)

```bash
git push origin HEAD --follow-tags
```

스크립트는 푸시하지 않는다 — 어느 브랜치에 있는지 모르기 때문이다. **이 스킬이 민다.**
HEAD가 `develop`이 아니면 어디로 밀지 사용자에게 확인받는다.
`pre-push` 훅의 `pnpm typecheck`가 돌므로 실패하면 우회하지 말고 고친다.

## 4. 업로드

- **iOS**: Transporter 앱에 `build-ios/export/App.ipa`를 드래그. 이건 GUI라 사용자가 한다 —
  경로와 올릴 버전·빌드 번호를 알려준다. App Store Connect → TestFlight에서 처리(수 분) 후 내부 테스터에 노출.
- **Android**: Play Console → 앱 번들 탐색기 / 트랙에 `app-release.aab` 업로드.

## 5. 보고

올린 **버전·빌드 번호·태그·로드 URL**을 한 줄로 정리해 사용자에게 알린다.
TestFlight "테스트 세부사항"에 어느 서버를 보는 빌드인지 적어두게 안내한다.

**앱 배포는 웹 배포 뒤에 한다.** 앱이 운영 URL을 원격 로드하므로, 웹이 먼저 나가야
제출한 빌드가 의도한 화면을 띄운다.

자세한 배경(서명·플러그인 함정·기기 검증)은 `docs/capacitor.md`.

---

ponytail: 아카이브 커밋·태그는 스크립트가 직접 한다 — 문서로 "커밋할 것"이라 적어둔 3개월이
실제로 안 지켜졌다. 푸시는 스크립트가 브랜치를 모르니 절차(앱 3번)에 남겼다. 로컬 머지 없이 원격 ref만 밀어 fast-forward. 체인지로그 생성은 `--generate-notes`에 위임.
버전은 `pnpm version`이 이미 하는 일에 얹었다 — 커스텀 스크립트 없음.
배포 후 헬스체크, 롤백 절차는 실제로 필요해질 때 추가.
