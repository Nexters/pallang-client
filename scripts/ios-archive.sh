#!/usr/bin/env bash
# TestFlight/App Store용 서명 아카이브(.ipa) 생성. 전체 Xcode 설치 필요(Command Line Tools만으로는 불가).
# 기본은 운영 URL(capacitor.config.ts의 PROD_SERVER_URL)을 로드하는 빌드다.
# dev 서버를 로드하는 빌드는 CAP_SERVER_URL로 덮어쓴다: pnpm ios:archive:dev
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ cap sync ios (server.url = ${CAP_SERVER_URL:-운영 기본값 https://pallang.co.kr})"
npx cap sync ios

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
