#!/usr/bin/env bash
# Google Play용 서명 번들(.aab) 생성. scripts/ios-archive.sh의 Android 대응물이다.
# 기본은 운영 URL(capacitor.config.ts의 PROD_SERVER_URL)을 로드하는 빌드다.
# dev 서버를 로드하는 빌드는 CAP_SERVER_URL로 덮어쓴다: pnpm android:bundle:dev
set -euo pipefail
cd "$(dirname "$0")/.."

# 운영 URL을 여기 다시 적지 않는다 — capacitor.config.ts와 어긋나기 시작한다
echo "▶ cap sync android (server.url = ${CAP_SERVER_URL:-capacitor.config.ts의 운영 기본값})"
npx cap sync android

BUILD_GRADLE=android/app/build.gradle

# 제품 버전의 단일 소스는 package.json이다(iOS와 같다). versionName은 사용자에게 보이는 값이고
# prerelease 접미사(1.1.0-3의 '-3')는 떼고 넣는다 — Play도 정수.마침표 형식을 기대한다.
VERSION_NAME=$(node -p "require('./package.json').version.split('-')[0]")
perl -pi -e "s/(versionName \")[^\"]*\"/\${1}${VERSION_NAME}\"/" "$BUILD_GRADLE"
echo "▶ versionName ← package.json: ${VERSION_NAME}"

# Play는 같은 versionCode를 두 번 받지 않는다. 빌드마다 올려 둔다(iOS의 CURRENT_PROJECT_VERSION과 같은 역할).
perl -pi -e 's/(versionCode )(\d+)/$1 . ($2 + 1)/e' "$BUILD_GRADLE"
VERSION_CODE=$(perl -ne 'print "$1\n" and last if /versionCode (\d+)/' "$BUILD_GRADLE")
echo "▶ versionCode 올림 → ${VERSION_CODE} (build.gradle 변경 — 커밋할 것)"

if [ ! -f android/keystore.properties ]; then
  echo "✖ android/keystore.properties가 없어 서명할 수 없습니다." >&2
  echo "  docs/capacitor.md의 'Android 릴리스 번들(AAB)' 절을 따라 업로드 키를 먼저 만드세요." >&2
  exit 1
fi

echo "▶ bundleRelease"
cd android
JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}" ./gradlew :app:bundleRelease
cd ..

AAB=android/app/build/outputs/bundle/release/app-release.aab
echo "✅ ${AAB} 생성 완료 (${VERSION_NAME} / versionCode ${VERSION_CODE})"
echo "   Play Console → 앱 번들 탐색기 또는 프로덕션 트랙에 업로드하세요."
