#!/usr/bin/env bash
# .env.local이 없으면 메인 워크트리에서 복사하고, 거기도 없으면 .env.example로 생성한다.
# git worktree로 브랜치별 디렉토리를 만들면 gitignore된 env 파일이 따라오지 않아 dev 서버가 API URL 없이 뜨는 문제 방지.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.local ] && exit 0

main_dir="$(git worktree list --porcelain | head -1 | sed 's/^worktree //')"
if [ "$main_dir" != "$PWD" ] && [ -f "$main_dir/.env.local" ]; then
  cp "$main_dir/.env.local" .env.local
  echo "[ensure-env] .env.local을 메인 워크트리($main_dir)에서 복사했다."
else
  cp .env.example .env.local
  echo "[ensure-env] .env.local을 .env.example로 생성했다. 카카오 키 등 빈 값은 직접 채울 것."
fi
