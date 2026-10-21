#!/usr/bin/env bash
# ios-archive.sh가 만든 아카이브를 App Store Connect(TestFlight)에 올린다.
# Xcode에 로그인된 Apple 계정으로 올리므로 API 키·앱 암호가 필요 없다.
# 같은 ExportOptions에 destination=upload만 얹어, 서명 설정이 export와 어긋나지 않게 한다.
set -euo pipefail
cd "$(dirname "$0")/.."

ARCHIVE=build-ios/App.xcarchive
if [ ! -d "$ARCHIVE" ]; then
  echo "✖ ${ARCHIVE}가 없습니다. pnpm ios:archive(:dev)를 먼저 돌리세요." >&2
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp ios/App/ExportOptions.plist "$TMP/ExportOptions.plist"
plutil -insert destination -string upload "$TMP/ExportOptions.plist"

VERSION=$(/usr/libexec/PlistBuddy -c 'Print :ApplicationProperties:CFBundleShortVersionString' "$ARCHIVE/Info.plist")
BUILD=$(/usr/libexec/PlistBuddy -c 'Print :ApplicationProperties:CFBundleVersion' "$ARCHIVE/Info.plist")
echo "▶ 업로드: ${VERSION} (${BUILD})"

xcodebuild -exportArchive -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$TMP/ExportOptions.plist" \
  -exportPath "$TMP/out" -allowProvisioningUpdates

echo "✅ ${VERSION} (${BUILD}) 업로드 완료 — App Store Connect에서 처리(수 분) 후 TestFlight에 뜹니다."
