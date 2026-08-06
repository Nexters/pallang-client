#!/usr/bin/env bash
# TestFlight/App Store용 서명 아카이브(.ipa) 생성. 전체 Xcode 설치 필요(Command Line Tools만으로는 불가).
# 기본은 운영 URL(capacitor.config.ts의 PROD_SERVER_URL)을 로드하는 빌드다.
# dev 서버를 로드하는 빌드는 CAP_SERVER_URL로 덮어쓴다: pnpm ios:archive:dev
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ cap sync ios (server.url = ${CAP_SERVER_URL:-운영 기본값 https://www.pallang.co.kr})"
npx cap sync ios

# App Store Connect는 같은 빌드 번호를 두 번 받지 않는다. 아카이브마다 올려 둔다.
# ponytail: pbxproj를 직접 sed — agvtool은 프로젝트 설정을 따로 요구한다. 값이 Debug/Release에
# 나뉘어 다르게 굴러가기 시작하면 그때 agvtool로 옮긴다.
PBXPROJ=ios/App/App.xcodeproj/project.pbxproj
BUILD_NUMBER=$(grep -m1 -oE 'CURRENT_PROJECT_VERSION = [0-9]+' "$PBXPROJ" | grep -oE '[0-9]+')
NEXT_BUILD_NUMBER=$((BUILD_NUMBER + 1))
sed -i '' "s/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER};/CURRENT_PROJECT_VERSION = ${NEXT_BUILD_NUMBER};/g" "$PBXPROJ"
echo "▶ 빌드 번호 ${BUILD_NUMBER} → ${NEXT_BUILD_NUMBER} (pbxproj 변경 — 커밋할 것)"

ARCHIVE=build-ios/App.xcarchive
EXPORT_DIR=build-ios/export

echo "▶ archive"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -allowProvisioningUpdates \
  archive -archivePath "$ARCHIVE"

echo "▶ export .ipa"
xcodebuild -exportArchive -archivePath "$ARCHIVE" \
  -exportOptionsPlist ios/App/ExportOptions.plist \
  -exportPath "$EXPORT_DIR" -allowProvisioningUpdates

echo "✅ ${EXPORT_DIR}/ 에 .ipa 생성 완료 — Transporter 앱으로 App Store Connect에 업로드하세요."
