package kr.pallang.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.util.Locale;

/**
 * Android 15(API 35)부터 targetSdk 35+ 앱은 창이 시스템 바 뒤까지 그려진다(edge-to-edge 강제).
 * 그런데 Chromium 140 미만 웹뷰는 시스템 바 인셋을 env(safe-area-inset-*)로 노출하지 않아
 * 하단 제스처 바가 탭바·고정 버튼을 덮는다. 네이티브가 읽은 실제 인셋을 CSS 변수로 덮어써 맞춘다.
 * (globals.css의 --safe-top/--safe-bottom 기본값은 env()이고, 여기서 넣는 인라인 스타일이 이긴다.)
 */
public class MainActivity extends BridgeActivity {

    private String insetScript;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 14 이하는 창이 시스템 바를 침범하지 않는다 — 웹뷰가 이미 인셋 안쪽이라
        // 값을 넣으면 두 번 밀린다.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return;

        Bridge bridge = getBridge();
        if (bridge == null) return;
        WebView webView = bridge.getWebView();
        if (webView == null) return;

        ViewCompat.setOnApplyWindowInsetsListener(
            webView,
            (view, insets) -> {
                Insets safe = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                // 인셋은 물리 픽셀, CSS px은 dp다(뷰포트가 device-width/initial-scale=1이라 1 CSS px = 1 dp).
                float density = getResources().getDisplayMetrics().density;
                // Locale.US 고정 — 지역에 따라 소수점이 쉼표로 찍히면 CSS 값이 깨진다.
                insetScript =
                    String.format(
                        Locale.US,
                        "document.documentElement.style.setProperty('--safe-top','%.2fpx');" +
                        "document.documentElement.style.setProperty('--safe-bottom','%.2fpx');",
                        safe.top / density,
                        safe.bottom / density
                    );
                applyInsets(webView);
                // 소비하지 않고 그대로 넘긴다 — 웹뷰 기본 인셋 처리를 막지 않기 위함.
                return insets;
            }
        );

        // 페이지가 새로 로드되면 documentElement의 인라인 스타일이 날아간다. 다시 넣어준다.
        bridge.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageLoaded(WebView view) {
                    applyInsets(view);
                }
            }
        );
    }

    private void applyInsets(WebView webView) {
        if (insetScript == null) return;
        webView.evaluateJavascript(insetScript, null);
    }
}
