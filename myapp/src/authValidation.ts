export type FieldErrors = {
  loginId?: string
  password?: string
}

export function validateSignup(loginId: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  const id = loginId.trim()
  if (id.length < 1) {
    errors.loginId = '아이디를 입력해 주세요.'
  } else if (id.length > 64) {
    errors.loginId = '아이디는 64자 이하여야 합니다.'
  }
  if (password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  } else if (password.length > 72) {
    errors.password = '비밀번호는 72자 이하여야 합니다.'
  }
  return errors
}

export function validateLogin(loginId: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  const id = loginId.trim()
  if (id.length < 1) {
    errors.loginId = '아이디를 입력해 주세요.'
  } else if (id.length > 64) {
    errors.loginId = '아이디는 64자 이하여야 합니다.'
  }
  if (password.length < 1) {
    errors.password = '비밀번호를 입력해 주세요.'
  }
  return errors
}