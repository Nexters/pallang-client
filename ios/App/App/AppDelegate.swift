import UIKit
import Capacitor
import FirebaseCore

// UIScene 생명주기(#435)를 쓰므로 창·URL 열기·유니버설 링크·앞/뒤 전환은 SceneDelegate가 받는다.
// 여기 남는 건 앱 단위 이벤트(실행·푸시 등록·백그라운드 푸시)뿐이다.
// ponytail: configurationForConnecting은 두지 않는다 — Info.plist의 UISceneConfigurations가
// 델리게이트와 storyboard를 이미 지정한다. 장면 종류가 둘 이상 필요해지면 그때 추가.
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        NotificationCenter.default.post(name: Notification.Name.init("didReceiveRemoteNotification"), object: completionHandler, userInfo: userInfo)
    }
}
