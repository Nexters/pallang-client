package kr.co.pallang.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 앱 자신의 설정 화면 열기. iOS의 AppSettingsPlugin(native-plugins/app-settings)과 같은
 * jsName("AppSettings")을 써서 웹에서는 한 가지 API로 보인다.
 *
 * Android는 권한을 두 번 거부하면 PermissionState.DENIED가 되어 요청을 다시 띄울 수 없다.
 * 그때 사용자를 이 화면으로 보낸다.
 *
 * iOS와 달리 별도 플러그인 패키지를 만들지 않고 앱 모듈에 둔다 — gradle 모듈을 새로 얹지 않아도
 * MainActivity의 registerPlugin으로 등록되기 때문이다.
 */
@CapacitorPlugin(name = "AppSettings")
public class AppSettingsPlugin extends Plugin {

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
        // 액티비티가 아닌 컨텍스트에서 시작될 수 있어 새 태스크로 띄운다.
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException error) {
            call.reject("설정 화면을 열지 못했습니다.", error);
        }
    }
}
