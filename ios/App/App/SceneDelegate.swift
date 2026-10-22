import UIKit
import Capacitor

// UIScene 생명주기(#435). 창과 CAPBridgeViewController는 Info.plist의 UISceneStoryboardFile(Main)이
// 만들어 window에 넣어 준다 — 여기서 다시 만들면 창이 둘이 된다.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // 앱이 꺼진 상태에서 URL·유니버설 링크로 열린 경우도 여기로 들어온다.
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // WKWebView는 엣지 스와이프 뒤로/앞으로 가기가 기본 비활성이다.
        // willConnectTo 시점에는 웹뷰가 아직 준비되지 않아 여기서 설정한다(반복 호출 무해).
        (window?.rootViewController as? CAPBridgeViewController)?.webView?.allowsBackForwardNavigationGestures = true
    }

    // Scene을 쓰면 AppDelegate의 open url / continue userActivity는 호출되지 않는다. 이 둘이 대신 받는다.
    // 프록시가 기존 .capacitorOpenURL 노티를 그대로 보내므로 카카오 로그인 복귀(KakaoLoginPlugin)는 손댈 것이 없다.
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
