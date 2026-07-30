#!/usr/bin/env bash
#
# cap-dev.sh — 로컬 dev 서버를 현재 LAN IP로 자동 노출하고,
#              Capacitor 앱이 그 URL을 로드하도록 sync + 실행한다.
#
# IP는 와이파이/네트워크가 바뀔 때마다 달라지므로, 이 스크립트가
# 매 실행마다 현재 IP를 감지해 CAP_SERVER_URL을 자동으로 맞춘다.
# (IP를 앱에 하드코딩하지 않는다.)
#
# 사용법:
#   scripts/cap-dev.sh ios        # iOS 실기기/시뮬레이터
#   scripts/cap-dev.sh android    # Android 에뮬레이터/기기
#   scripts/cap-dev.sh sync-only  # 빌드/실행 없이 sync만
#
# ⚠️ server.url에는 경로를 넣지 않는다(origin만). Capacitor iOS가 내부/외부 내비게이션을
#    serverURL "문자열 prefix"로 판정해서(WebViewDelegationHandler.isApplicationNavigation),
#    경로가 붙으면 그 밖의 full-page 내비게이션(카카오 로그인 등)이 전부 Safari로 튕긴다.
#    특정 화면은 앱 안에서 이동해서 확인할 것.
#
set -euo pipefail

PLATFORM="${1:-ios}"
PORT="${PORT:-3000}"

# --- 1. 현재 LAN IP 감지 (en0=Wi-Fi 우선, en1 폴백) ---
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -z "$LAN_IP" ]; then
  echo "❌ LAN IP를 찾을 수 없습니다. Wi-Fi 연결을 확인하세요." >&2
  exit 1
fi

# Android 에뮬레이터는 호스트를 10.0.2.2로 접근 (LAN IP 대신 특수 주소)
if [ "$PLATFORM" = "android-emulator" ]; then
  HOST="10.0.2.2"
else
  HOST="$LAN_IP"
fi

export CAP_SERVER_URL="http://${HOST}:${PORT}"
echo "🌐 CAP_SERVER_URL = ${CAP_SERVER_URL}   (감지된 LAN IP: ${LAN_IP})"

# --- 2. dev 서버가 안 떠 있으면 안내 (수동 기동 권장) ---
# 주의: WKWebView는 next dev 하이드레이션 이슈가 있으므로 기기 확인은 prod 빌드 권장.
#       (docs/capacitor.md 함정 1 참고)
if ! curl -s -o /dev/null "http://localhost:${PORT}" 2>/dev/null; then
  echo "⚠️  localhost:${PORT} 에 서버가 없습니다. 다른 터미널에서 먼저 실행하세요:"
  echo "      pnpm build && PORT=${PORT} pnpm start   # 기기 검증용(권장)"
  echo "      또는 개발 중이면: PORT=${PORT} pnpm dev"
  echo ""
fi

# --- 3. Capacitor sync (config에 CAP_SERVER_URL이 구워짐) ---
# 플랫폼명 매핑: android-emulator→android, sync-only→전체(플랫폼 인자 없음)
case "$PLATFORM" in
  android-emulator) CAP_PLATFORM="android" ;;
  sync-only)        CAP_PLATFORM="" ;;
  *)                CAP_PLATFORM="$PLATFORM" ;;
esac

echo "🔄 npx cap sync ${CAP_PLATFORM}"
npx cap sync ${CAP_PLATFORM}

# --- 4. 실행 ---
case "$PLATFORM" in
  sync-only)
    echo "✅ sync 완료. 앱에서 새로고침하면 최신 URL을 로드합니다."
    ;;
  ios)
    echo "▶️  npx cap run ios"
    npx cap run ios
    ;;
  android|android-emulator)
    echo "▶️  npx cap run android"
    npx cap run android
    ;;
  *)
    echo "❌ 알 수 없는 플랫폼: $PLATFORM (ios | android | android-emulator | sync-only)" >&2
    exit 1
    ;;
esac
