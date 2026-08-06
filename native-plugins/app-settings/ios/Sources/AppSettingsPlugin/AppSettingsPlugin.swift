import Capacitor
import Foundation
import UIKit

/// 앱 자신의 설정 화면 열기.
///
/// 카메라·사진 권한을 한 번 거부하면 iOS는 권한 팝업을 다시 띄우지 않는다. 되돌리는 유일한 길이
/// 설정 화면이라 이 통로가 필요하다.
///
/// `UIApplication.openSettingsURLString` 하나만 쓴다. 특정 설정 화면으로 바로 뛰는
/// `App-prefs:` 계열은 애플이 문서화한 적 없는 비공개 스킴이라, 쓰지 않더라도 문자열이 바이너리에
/// 남으면 심사 정적 검사에 걸릴 수 있다. 이 플러그인을 직접 만든 이유가 그것이다.
@objc(AppSettingsPlugin)
public class AppSettingsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppSettingsPlugin"
    public let jsName = "AppSettings"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    @objc func openSettings(_ call: CAPPluginCall) {
        guard let url = URL(string: UIApplication.openSettingsURLString) else {
            call.reject("설정 URL을 만들지 못했습니다.")
            return
        }
        // UIApplication 접근은 메인 스레드에서만 안전하다.
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { opened in
                if opened {
                    call.resolve()
                } else {
                    call.reject("설정 화면을 열지 못했습니다.")
                }
            }
        }
    }
}
