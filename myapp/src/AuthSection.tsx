import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  fetchMe,
  login,
  logout,
  signup,
  type UserResponse,
} from './api/auth.ts'
import { validateLogin, validateSignup } from './authValidation.ts'

type AuthSessionState =
  | { kind: 'loading' }
  | { kind: 'authenticated'; user: UserResponse }
  | { kind: 'unauthenticated' }
  | { kind: 'server_error' }

type AuthFormView = 'none' | 'login' | 'signup'

type AuthSectionProps = {
  onLogoutSuccess: () => void
  onAuthChange: (user: UserResponse | null) => void
}

export default function AuthSection({ onLogoutSuccess, onAuthChange }: AuthSectionProps) {
  const [session, setSession] = useState<AuthSessionState>({ kind: 'loading' })
  const [formView, setFormView] = useState<AuthFormView>('none')

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [logoutSubmitting, setLogoutSubmitting] = useState(false)

  const loadSession = useCallback(async () => {
    setSession({ kind: 'loading' })
    const result = await fetchMe()
    if (result.status === 'authenticated') {
      setSession({ kind: 'authenticated', user: result.user })
    } else if (result.status === 'unauthenticated') {
      setSession({ kind: 'unauthenticated' })
    } else {
      setSession({ kind: 'server_error' })
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  useEffect(() => {
    if (session.kind === 'authenticated') {
      onAuthChange(session.user)
      return
    }
    if (session.kind === 'unauthenticated' || session.kind === 'server_error') {
      onAuthChange(null)
    }
  }, [session, onAuthChange])

  function openLogin() {
    setFormView('login')
    setFormError(null)
    setFormNotice(null)
    setFieldErrors({})
    setPassword('')
  }

  function openSignup() {
    setFormView('signup')
    setFormError(null)
    setFormNotice(null)
    setFieldErrors({})
    setLoginId('')
    setPassword('')
  }

  function closeForm() {
    setFormView('none')
    setFormError(null)
    setFormNotice(null)
    setFieldErrors({})
    setPassword('')
  }

  async function handleSignupSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    const errors = validateSignup(loginId, password)
    if (errors.loginId || errors.password) {
      setFieldErrors({
        ...(errors.loginId ? { loginId: errors.loginId } : {}),
        ...(errors.password ? { password: errors.password } : {}),
      })
      setFormError(null)
      return
    }

    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)
    setFormNotice(null)

    const id = loginId.trim()
    const result = await signup(id, password)
    setSubmitting(false)

    if (result.ok) {
      setLoginId(id)
      setPassword('')
      setFormView('login')
      setFormNotice('가입이 완료되었습니다. 로그인해 주세요.')
      return
    }

    if (result.status === 409) {
      setFormError(result.message ?? '이미 사용 중인 아이디입니다.')
      return
    }
    setFormError(result.message ?? '회원가입에 실패했습니다.')
  }

  async function handleLoginSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    const errors = validateLogin(loginId, password)
    if (errors.loginId || errors.password) {
      setFieldErrors({
        ...(errors.loginId ? { loginId: errors.loginId } : {}),
        ...(errors.password ? { password: errors.password } : {}),
      })
      setFormError(null)
      return
    }

    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)
    setFormNotice(null)

    const result = await login(loginId.trim(), password)
    setSubmitting(false)

    if (result.ok) {
      setSession({ kind: 'authenticated', user: result.data })
      setFormView('none')
      setPassword('')
      setFormError(null)
      setFormNotice(null)
      return
    }

    if (result.status === 401) {
      setFormError('아이디 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    setFormError(result.message ?? '로그인에 실패했습니다.')
  }

  async function handleLogout() {
    if (logoutSubmitting) return
    setLogoutSubmitting(true)
    const result = await logout()
    setLogoutSubmitting(false)

    if (result.ok) {
      setSession({ kind: 'unauthenticated' })
      setFormView('none')
      setLoginId('')
      setPassword('')
      setFormError(null)
      setFormNotice(null)
      onLogoutSuccess()
      return
    }
    setFormError(result.message ?? '로그아웃에 실패했습니다.')
  }

  if (session.kind === 'loading') {
    return <span className="status-muted" aria-busy="true">계정 확인 중…</span>
  }

  if (session.kind === 'server_error') {
    return (
      <>
        <p className="alert alert--error" role="alert">
          인증 서버에 연결할 수 없습니다.
        </p>
        <button type="button" className="btn btn-ghost" onClick={() => void loadSession()}>
          다시 시도
        </button>
      </>
    )
  }

  return (
    <>
      <div className="app-header__auth-inner">
        {session.kind === 'authenticated' ? (
          <>
            <span>
              <span className="status-muted">로그인 </span>
              <span className="auth-user">{session.user.loginId}</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void handleLogout()}
              disabled={logoutSubmitting}
            >
              {logoutSubmitting ? '로그아웃 중…' : '로그아웃'}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={openLogin}>
              로그인
            </button>
            <button type="button" className="btn btn-ghost" onClick={openSignup}>
              회원가입
            </button>
          </>
        )}

        {formError && session.kind === 'authenticated' && (
          <p className="alert alert--error" role="alert">
            {formError}
          </p>
        )}
      </div>

      {formView === 'login' && session.kind !== 'authenticated' && (
        <form className="auth-panel" onSubmit={(e) => void handleLoginSubmit(e)}>
          <h2 className="auth-panel__title">로그인</h2>
          {formNotice && (
            <p className="status-muted" role="status">
              {formNotice}
            </p>
          )}
          <label className="field-label" htmlFor="auth-login-id">
            아이디
          </label>
          <input
            id="auth-login-id"
            className="field"
            type="text"
            autoComplete="username"
            maxLength={64}
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.loginId && (
            <p className="alert alert--error" role="alert">
              {fieldErrors.loginId}
            </p>
          )}
          <label className="field-label" htmlFor="auth-login-password">
            비밀번호
          </label>
          <input
            id="auth-login-password"
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.password && (
            <p className="alert alert--error" role="alert">
              {fieldErrors.password}
            </p>
          )}
          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}
          <FormActionButtons submitting={submitting} onCancel={closeForm} submitLabel="로그인" />
        </form>
      )}

      {formView === 'signup' && session.kind !== 'authenticated' && (
        <form className="auth-panel" onSubmit={(e) => void handleSignupSubmit(e)}>
          <h2 className="auth-panel__title">회원가입</h2>
          <label className="field-label" htmlFor="auth-signup-id">
            아이디 (1–64자)
          </label>
          <input
            id="auth-signup-id"
            className="field"
            type="text"
            autoComplete="username"
            maxLength={64}
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.loginId && (
            <p className="alert alert--error" role="alert">
              {fieldErrors.loginId}
            </p>
          )}
          <label className="field-label" htmlFor="auth-signup-password">
            비밀번호 (8–72자)
          </label>
          <input
            id="auth-signup-password"
            className="field"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.password && (
            <p className="alert alert--error" role="alert">
              {fieldErrors.password}
            </p>
          )}
          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}
          <FormActionButtons submitting={submitting} onCancel={closeForm} submitLabel="가입하기" />
        </form>
      )}
    </>
  )
}

function FormActionButtons({
  submitting,
  onCancel,
  submitLabel,
}: {
  submitting: boolean
  onCancel: () => void
  submitLabel: string
}) {
  return (
    <div className="btn-row">
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? '처리 중…' : submitLabel}
      </button>
      <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
        닫기
      </button>
    </div>
  )
}