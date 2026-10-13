#!/usr/bin/env bash
# TestFlight/App Store용 서명 아카이브(.ipa) 생성. 전체 Xcode 설치 필요(Command Line Tools만으로는 불가).
# 기본은 운영 URL(capacitor.config.ts의 PROD_SERVER_URL)을 로드하는 빌드다.
# dev 서버를 로드하는 빌드는 CAP_SERVER_URL로 덮어쓴다: pnpm ios:archive:dev
set -euo pipefail
cd "$(dirname "$0")/.."

# 두 빌드는 번들 ID가 같아 App Store Connect의 한 앱에 같이 쌓인다. 심사 제출 화면에서
# 고를 때 보이는 건 표시 버전과 빌드 번호뿐이므로(로드 URL도 표시명도 안 보인다),
# 아카이브가 스스로 두 가지 표식을 붙인다.
#   ① 표시명 — 기기 홈 화면·권한 팝업에서 구분한다. Info.plist가 아니라 빌드 설정을 덮어쓰므로
#      파일이 더러워지지 않고, 아카이브가 실패해도 원복할 것이 없다.
#   ② 빌드 번호 홀짝 — App Store Connect에서 유일하게 보이는 구분자다. 운영=짝수, dev=홀수.
#      MARKETING_VERSION은 Apple이 정수와 마침표만 받아 '1.2.0-dev' 같은 접미사를 못 쓴다.
# 심사에는 짝수 빌드만 제출한다.
if [ -n "${CAP_SERVER_URL:-}" ]; then
  BUILD_KIND="dev (${CAP_SERVER_URL})"
  DISPLAY_NAME='Pallang DEV'
  BUILD_PARITY=1
else
  BUILD_KIND='운영 (capacitor.config.ts의 PROD_SERVER_URL)'
  DISPLAY_NAME='Pallang'
  BUILD_PARITY=0
fi

echo "▶ 빌드 종류: ${BUILD_KIND}"
echo "▶ 표시명: ${DISPLAY_NAME}"

# 운영 URL을 여기 다시 적지 않는다 — capacitor.config.ts와 어긋나기 시작한다
echo "▶ cap sync ios (server.url = ${CAP_SERVER_URL:-capacitor.config.ts의 운영 기본값})"
npx cap sync ios

PBXPROJ=ios/App/App.xcodeproj/project.pbxproj

# 제품 버전의 단일 소스는 package.json이다. Apple의 MARKETING_VERSION은 마침표로 나뉜
# 정수만 받으므로 prerelease 접미사(1.1.0-3의 '-3')를 떼고 넣는다. 즉 dev 아카이브와
# 운영 아카이브의 표시 버전은 같고, 둘을 가르는 건 아래 빌드 번호와 로드하는 서버 URL이다.
MARKETING_VERSION=$(node -p "require('./package.json').version.split('-')[0]")
perl -pi -e "s/(MARKETING_VERSION = ).*;/\${1}${MARKETING_VERSION};/" "$PBXPROJ"
echo "▶ 표시 버전 ← package.json: ${MARKETING_VERSION}"

# App Store Connect는 같은 빌드 번호를 두 번 받지 않는다. 아카이브마다 올려 둔다.
# 위 ②의 홀짝을 맞추느라 한 번에 1이 아니라 2가 오를 수 있다 — 값은 언제나 커지기만 하므로
# 두 빌드가 한 카운터를 나눠 써도 번호가 겹치거나 되돌아가지 않는다.
# ponytail: pbxproj를 직접 치환 — agvtool은 프로젝트 설정을 따로 요구한다. 값이 여러 개라도
# 각각 제 값에서 오르므로 Debug/Release가 갈라져도 견딘다.
perl -pi -e "s/(CURRENT_PROJECT_VERSION = )(\d+)/\$1 . do { my \$n = \$2 + 1; \$n++ if \$n % 2 != ${BUILD_PARITY}; \$n }/e" "$PBXPROJ"
echo "▶ 빌드 번호 올림 → $(perl -ne 'print "$1\n" and last if /CURRENT_PROJECT_VERSION = (\d+)/' "$PBXPROJ") ($([ "$BUILD_PARITY" -eq 0 ] && echo '짝수 = 운영, 심사 제출 가능' || echo '홀수 = dev, 심사 제출 금지'))"

ARCHIVE=build-ios/App.xcarchive
EXPORT_DIR=build-ios/export

echo "▶ archive"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -allowProvisioningUpdates \
  archive -archivePath "$ARCHIVE" \
  BUNDLE_DISPLAY_NAME="$DISPLAY_NAME"

echo "▶ export .ipa"
xcodebuild -exportArchive -archivePath "$ARCHIVE" \
  -exportOptionsPlist ios/App/ExportOptions.plist \
  -exportPath "$EXPORT_DIR" -allowProvisioningUpdates

echo "✅ ${EXPORT_DIR}/ 에 .ipa 생성 완료 — Transporter 앱으로 App Store Connect에 업로드하세요."

# 빌드 번호를 올린 채 커밋하지 않으면 다음 아카이브가 같은 번호에서 다시 시작하고,
# 그 사이 실제로 올라간 빌드가 있으면 레포의 카운터가 App Store Connect보다 뒤처진다.
# (1.3.0/빌드 12에서 1.3.1(15)이 올라가 있던 실제 사고가 있었다.) 그래서 사람 손에 맡기지 않는다.
# 태그는 올린 ipa와 커밋을 잇는 유일한 표식이라 dev/운영을 이름에서 가른다.
# annotated로 단다 — lightweight 태그는 push --follow-tags가 그냥 무시한다.
BUILD_NUMBER=$(perl -ne 'print "$1\n" and last if /CURRENT_PROJECT_VERSION = (\d+)/' "$PBXPROJ")
TAG="ios-v${MARKETING_VERSION}-b${BUILD_NUMBER}$([ "$BUILD_PARITY" -eq 0 ] || echo '-dev')"
git commit -q -m "chore: iOS ${BUILD_KIND%% *} 아카이브 ${TAG}" -- "$PBXPROJ"
git tag -a "$TAG" -m "iOS ${BUILD_KIND}"
echo "✅ 커밋 + 태그 ${TAG} — 푸시: git push origin HEAD --follow-tags"
