export type UserResponse = {
  id: number
  loginId: string
}

export type CsrfResponse = {
  token: string
  headerName: string
  parameterName: string
}

export type MeResult =
  | { status: 'authenticated'; user: UserResponse }
  | { status: 'unauthenticated' }
  | { status: 'error' }

const credentials = 'include' as const

type ApiFailure = {
  ok: false
  status: number
  message: string | null
}

type ApiSuccess<T> = {
  ok: true
  data: T
}

export type AuthActionResult<T> = ApiSuccess<T> | ApiFailure

async function readMessage(response: Response): Promise<string | null> {
  try {
    const data: unknown = await response.json()
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message: unknown }).message
      return typeof message === 'string' ? message : null
    }
  } catch {
    // ignore
  }
  return null
}

export async function fetchCsrf(): Promise<CsrfResponse> {
  const response = await fetch('/api/auth/csrf', { credentials })
  if (!response.ok) {
    throw new Error('csrf')
  }
  return (await response.json()) as CsrfResponse
}

export async function fetchMe(): Promise<MeResult> {
  try {
    const response = await fetch('/api/auth/me', { credentials })
    if (response.status === 401) {
      return { status: 'unauthenticated' }
    }
    if (response.status === 200) {
      return { status: 'authenticated', user: (await response.json()) as UserResponse }
    }
    return { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}

export async function signup(
  loginId: string,
  password: string,
): Promise<AuthActionResult<UserResponse>> {
  try {
    const csrf = await fetchCsrf()
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials,
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify({ loginId, password }),
    })
    if (response.status === 201) {
      return { ok: true, data: (await response.json()) as UserResponse }
    }
    const message = await readMessage(response)
    if (response.status === 409) {
      return {
        ok: false,
        status: 409,
        message: '이미 사용 중인 아이디입니다.',
      }
    }
    return {
      ok: false,
      status: response.status,
      message: message ?? '회원가입에 실패했습니다.',
    }
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없습니다.' }
  }
}

export async function login(
  loginId: string,
  password: string,
): Promise<AuthActionResult<UserResponse>> {
  try {
    const csrf = await fetchCsrf()
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials,
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify({ loginId, password }),
    })
    if (response.ok) {
      await fetchCsrf()
      return { ok: true, data: (await response.json()) as UserResponse }
    }
    const message = await readMessage(response)
    if (response.status === 401) {
      return {
        ok: false,
        status: 401,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
      }
    }
    return {
      ok: false,
      status: response.status,
      message: message ?? '로그인에 실패했습니다.',
    }
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없습니다.' }
  }
}

export async function logout(): Promise<AuthActionResult<null>> {
  try {
    const csrf = await fetchCsrf()
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials,
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
      },
      body: '{}',
    })
    if (response.status === 204) {
      return { ok: true, data: null }
    }
    return { ok: false, status: response.status, message: '로그아웃에 실패했습니다.' }
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없습니다.' }
  }
}