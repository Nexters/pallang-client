// swift-tools-version: 5.9
import PackageDescription

// 패키지·product 이름은 Capacitor CLI가 npm 패키지명(capacitor-kakao-login)을 변환해 만드는
// 이름과 정확히 같아야 한다(fixName: kebab → PascalCase). 어긋나면 cap sync가 만든
// CapApp-SPM/Package.swift가 없는 product를 참조해 빌드가 깨진다.
let package = Package(
    name: "CapacitorKakaoLogin",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorKakaoLogin",
            targets: ["KakaoLoginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/kakao/kakao-ios-sdk.git", from: "2.28.0")
    ],
    targets: [
        .target(
            name: "KakaoLoginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "KakaoSDKCommon", package: "kakao-ios-sdk"),
                .product(name: "KakaoSDKAuth", package: "kakao-ios-sdk"),
                .product(name: "KakaoSDKUser", package: "kakao-ios-sdk")
            ],
            path: "ios/Sources/KakaoLoginPlugin")
    ]
)
