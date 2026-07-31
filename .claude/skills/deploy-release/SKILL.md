---
name: deploy-release
description: develop을 release로 올려 운영 배포(Vercel Production)하고 semver 태그·GitHub 릴리스를 만든다. "운영 배포", "release 배포", "프로덕션 올려", "릴리스 만들어" 요청 시 사용.
---

# 운영 배포 (develop → release)

`release` 브랜치가 Vercel Production을 추적한다. `develop`은 dev.pallang.co.kr.

**`release` 브랜치로 나가는 모든 배포는 예외 없이 이 문서의 절차를 따른다.**
급해 보이거나 커밋이 하나뿐이어도 단계를 건너뛰지 않는다. 특히:

- 1번(fast-forward 확인) 없이 `release`에 push하지 않는다.
- 3번(사용자 확인) 없이 `release`에 push하지 않는다. 운영 배포는 되돌리기 어렵다.
- 버전 태그 없이 배포하지 않는다. 배포 시점과 태그가 1:1로 맞아야 롤백할 지점을 찾을 수 있다.

핫픽스처럼 이 절차로 안 되는 상황이면 **임의로 진행하지 말고 사용자에게 판단을 넘긴다.**

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

1.0.0 전까지 major는 쓰지 않는다. 웹앱이라 public API가 없으므로 실용 규칙만 쓴다:

- 기능 추가가 하나라도 있으면 → **minor**
- 버그 수정·리팩터링·문서만이면 → **patch**

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

ponytail: 로컬 머지 없이 원격 ref만 밀어 fast-forward. 체인지로그 생성은 `--generate-notes`에 위임.
draft/prerelease 플래그, 배포 후 헬스체크, 롤백 절차는 실제로 필요해질 때 추가.
