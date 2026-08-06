import Capacitor
import Foundation
import KakaoSDKAuth
import KakaoSDKCommon
import KakaoSDKUser

/// 카카오 네이티브 로그인 — iOS 전용.
///
/// 카카오톡이 깔려 있으면 카카오톡 앱으로 전환하고(`loginWithKakaoTalk`), 없으면 시스템 인증 시트로
/// 떨어진다(`loginWithKakaoAccount` → `ASWebAuthenticationSession`). 둘 다 우리 웹뷰 밖에서 그려지므로
/// 노치·safe area는 시스템이 처리한다 — 웹뷰 안에서 카카오 페이지를 열던 기존 방식과 다른 점이다.
///
/// 브라우저는 이 플러그인을 타지 않고 기존 REST OAuth 경로(`/api/auth/kakao/login`)를 그대로 쓴다.
@objc(KakaoLoginPlugin)
public class KakaoLoginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KakaoLoginPlugin"
    public let jsName = "KakaoLogin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "login", returnType: CAPPluginReturnPromise)
    ]

    /// 사용자가 스스로 닫은 경우. 웹에서 이 코드를 보고 에러 없이 조용히 돌아간다.
    public static let cancelCode = "KAKAO_LOGIN_CANCELLED"

    /// 앱 키는 URL scheme(`kakao<앱키>`)과 같은 Info.plist에 둔다 — 값이 두 군데로 갈리지 않게.
    /// 여기서 초기화하므로 JS가 별도 initialize를 호출할 필요가 없다.
    override public func load() {
        super.load()

        guard let appKey = Bundle.main.object(forInfoDictionaryKey: "KAKAO_NATIVE_APP_KEY") as? String,
              !appKey.isEmpty else {
            CAPLog.print("⚡️ KakaoLogin - Info.plist에 KAKAO_NATIVE_APP_KEY가 없어 SDK를 초기화하지 못했습니다.")
            return
        }
        KakaoSDK.initSDK(appKey: appKey)

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleUrlOpened(notification:)),
            name: Notification.Name.capacitorOpenURL,
            object: nil)
    }

    /// 로그인을 마친 카카오톡이 `kakao<앱키>://oauth`로 앱을 다시 연다. 이 처리가 없으면 앱으로
    /// 돌아오기만 하고 `login`의 completion이 영영 호출되지 않는다.
    ///
    /// AppDelegate 대신 여기서 받는 이유는 두 가지다. AppDelegate는 Capacitor가 생성·관리하는 파일이라
    /// iOS 프로젝트를 재생성하면 편집이 날아가고, 앱 타겟에서는 SPM 이행 의존인 KakaoSDKAuth를 import할 수 없다.
    @objc private func handleUrlOpened(notification: NSNotification) {
        guard let object = notification.object as? [String: Any],
              let url = object["url"] as? URL,
              AuthApi.isKakaoTalkLoginUrl(url) else {
            return
        }

        // handleOpenUrl은 main actor 격리라 노티 셀렉터(nonisolated)에서 직접 부를 수 없다.
        DispatchQueue.main.async {
            _ = AuthController.handleOpenUrl(url: url)
        }
    }

    @objc func login(_ call: CAPPluginCall) {
        // 카카오 SDK는 앱 전환·인증 시트를 띄우므로 메인 스레드에서 호출해야 한다.
        DispatchQueue.main.async {
            if UserApi.isKakaoTalkLoginAvailable() {
                UserApi.shared.loginWithKakaoTalk { token, error in
                    self.settle(call, token: token, error: error)
                }
            } else {
                UserApi.shared.loginWithKakaoAccount { token, error in
                    self.settle(call, token: token, error: error)
                }
            }
        }
    }

    private func settle(_ call: CAPPluginCall, token: OAuthToken?, error: Error?) {
        if let error {
            // 카카오톡 전환 취소와 인증 시트 취소 모두 SdkError(.Cancelled)로 온다.
            if let sdkError = error as? SdkError,
               sdkError.isClientFailed,
               sdkError.getClientError().reason == .Cancelled {
                call.reject("카카오 로그인이 취소되었습니다.", KakaoLoginPlugin.cancelCode)
                return
            }
            call.reject(error.localizedDescription, nil, error)
            return
        }

        guard let token else {
            call.reject("카카오 응답에 액세스 토큰이 없습니다.")
            return
        }

        // 백엔드(POST /auth/kakao)가 요구하는 건 카카오 액세스 토큰 하나뿐이라 나머지는 넘기지 않는다.
        call.resolve(["accessToken": token.accessToken])

        // SDK가 UserDefaults에 심어둔 토큰을 지운다. 이 앱은 카카오 API를 직접 부르지 않아 쓸 일이 없는데,
        // 남겨두면 initSDK가 등록한 TokenRefresher가 앱을 켤 때마다 토큰 점검 요청을 카카오로 보낸다.
        TokenManager.manager.deleteToken()
    }
}
