// 카카오 로그인 / 인증 관련 상수.

// 웹 카카오 로그인 콜백 경로. authorize의 redirect_uri와 토큰 교환의 redirect_uri가 반드시 일치해야 한다.
export const KAKAO_CALLBACK_PATH = '/auth/kakao/callback'

// 웹 로그인 시작(서버 Route Handler → 카카오 authorize로 302).
export const KAKAO_LOGIN_PATH = '/api/auth/kakao/login'

// 웹 code → 카카오 액세스 토큰 교환(서버 Route Handler). kauth CORS 회피 + REST 키 은닉.
export const KAKAO_EXCHANGE_PATH = '/api/auth/kakao/exchange'

// 카카오 OAuth 엔드포인트.
export const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'
export const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'

// state(CSRF) 검증용 쿠키 이름.
export const KAKAO_STATE_COOKIE = 'kakao_oauth_state'

// 토큰 저장소 키(@capacitor/preferences, 웹은 localStorage 폴백).
export const ACCESS_TOKEN_KEY = 'pallang.accessToken'
export const REFRESH_TOKEN_KEY = 'pallang.refreshToken'

// 서버가 액세스 토큰 만료 시 내려주는 에러 코드(AUTH_401_2). 이때만 refresh 회전을 시도한다.
export const TOKEN_EXPIRED_CODE = 'AUTH_401_2'

// 로그인 후 이동 경로.
export const HOME_PATH = '/'
export const LOGIN_PATH = '/login'
export const SIGN_UP_TERMS_PATH = '/terms'
export const SIGN_UP_WELCOME_PATH = '/sign-up/welcome'
